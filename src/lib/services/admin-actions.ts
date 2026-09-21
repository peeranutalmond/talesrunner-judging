"use server";

import { hash } from "bcryptjs";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { setSession } from "@/lib/auth/session";
import { getDb, query, type Queryable } from "@/lib/db";
import { getRanking } from "./admin";
import { saveCriterionScores } from "./judging";
import { redirect } from "next/navigation";
import { resolveImageSource } from "@/lib/media";

async function admin() {
  return requireSession(["ADMIN", "SUPER_ADMIN"]);
}

async function audit(tx: Queryable, contestId: string, actorId: string, action: string, entityType: string, entityId: string, before: unknown, after: unknown) {
  await tx.query("INSERT INTO audit_logs (id,contest_id,actor_user_id,action_type,entity_type,entity_id,before_data,after_data) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb)", [crypto.randomUUID(), contestId, actorId, action, entityType, entityId, before === null ? null : JSON.stringify(before), after === null ? null : JSON.stringify(after)]);
}

function orderSubmissionIds(ids: string[], mode: "SUBMISSION_NUMBER"|"RANDOM_PER_JUDGE"|"SAME_RANDOM", contestId: string, judgeId: string) {
  if(mode==="SUBMISSION_NUMBER")return ids;
  const salt=mode==="RANDOM_PER_JUDGE"?`${contestId}:${judgeId}`:contestId;
  return [...ids].sort((a,b)=>createHash("sha256").update(`${salt}:${a}`).digest("hex").localeCompare(createHash("sha256").update(`${salt}:${b}`).digest("hex")));
}

function categorySlug(name: string) {
  const ascii = name.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return ascii || `track-${crypto.randomUUID().slice(0, 8)}`;
}

async function resolveCategoryId(tx: Queryable, contestId: string, requested?: string | null) {
  if (requested) {
    const category = (await tx.query<{ id: string }>("SELECT id FROM submission_categories WHERE id=$1 AND contest_id=$2 AND active=TRUE", [requested, contestId]))[0];
    if (!category) throw new Error("Invalid artwork category");
    return category.id;
  }
  return (await tx.query<{ id: string }>("SELECT id FROM submission_categories WHERE contest_id=$1 AND active=TRUE ORDER BY CASE WHEN slug='unspecified' THEN 0 ELSE 1 END,display_order LIMIT 1", [contestId]))[0]?.id ?? null;
}

async function rebuildJudgeQueues(tx: Queryable, contestId: string) {
  const contest = (await tx.query<{ judging_order: "SUBMISSION_NUMBER"|"RANDOM_PER_JUDGE"|"SAME_RANDOM" }>("SELECT judging_order FROM contests WHERE id=$1", [contestId]))[0];
  if (!contest) throw new Error("Contest not found");
  const submissions = await tx.query<{ id: string }>("SELECT id FROM submissions WHERE contest_id=$1 AND status='ACTIVE' ORDER BY display_order,submission_number", [contestId]);
  const judges = await tx.query<{ user_id: string }>("SELECT cj.user_id FROM contest_judges cj JOIN users u ON u.id=cj.user_id WHERE cj.contest_id=$1 AND u.role='JUDGE'", [contestId]);
  const flags = await tx.query<{ judge_id: string; submission_id: string; flagged: boolean }>("SELECT judge_id,submission_id,flagged FROM judge_submission_order WHERE contest_id=$1", [contestId]);
  const flagMap = new Map(flags.map((item) => [`${item.judge_id}:${item.submission_id}`, item.flagged]));
  await tx.query("DELETE FROM judge_submission_order WHERE contest_id=$1", [contestId]);
  for (const judge of judges) {
    const ordered = orderSubmissionIds(submissions.map((item) => item.id), contest.judging_order, contestId, judge.user_id);
    for (const [position, submissionId] of ordered.entries()) {
      await tx.query("INSERT INTO judge_submission_order (id,contest_id,judge_id,submission_id,position,flagged) VALUES ($1,$2,$3,$4,$5,$6)", [crypto.randomUUID(), contestId, judge.user_id, submissionId, position, flagMap.get(`${judge.user_id}:${submissionId}`) ?? false]);
    }
  }
}

export async function createSubmissionAction(formData: FormData) {
  const session = await admin();
  const schema = z.object({ submissionNumber: z.string().min(1).max(30), displayName: z.string().min(1).max(120), playerId: z.string().min(1).max(120), artworkTitle: z.string().min(1).max(180), imageUrl: z.string().min(1).max(2000), thumbnailUrl: z.string().max(2000).optional(), contestantName: z.string().max(120).optional(), categoryId: z.string().optional() });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid submission data");
  const db = await getDb();
  await db.transaction(async (tx) => {
    const id = crypto.randomUUID();
    const data = parsed.data;
    const categoryId = await resolveCategoryId(tx, session.contestId!, data.categoryId || null);
    const image = resolveImageSource(data.imageUrl, data.thumbnailUrl);
    await tx.query(`INSERT INTO submissions (id,contest_id,submission_number,contestant_name,display_name,player_id,artwork_title,image_url,thumbnail_url,source_image_url,category_id,display_order)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,(SELECT COALESCE(MAX(display_order),-1)+1 FROM submissions WHERE contest_id=$2))`, [id, session.contestId, data.submissionNumber, data.contestantName || data.displayName, data.displayName, data.playerId, data.artworkTitle, image.imageUrl, image.thumbnailUrl, image.sourceUrl, categoryId]);
    const judges = await tx.query<{ user_id: string }>("SELECT cj.user_id FROM contest_judges cj JOIN users u ON u.id=cj.user_id WHERE cj.contest_id=$1 AND cj.status='ACTIVE' AND u.role='JUDGE'", [session.contestId]);
    for (const judge of judges) {
      await tx.query("INSERT INTO judge_submission_order (id,contest_id,judge_id,submission_id,position) VALUES ($1,$2,$3,$4,(SELECT COALESCE(MAX(position),-1)+1 FROM judge_submission_order WHERE contest_id=$2 AND judge_id=$3))", [crypto.randomUUID(), session.contestId, judge.user_id, id]);
    }
    await audit(tx, session.contestId!, session.id, "SUBMISSION_CREATED", "submission", id, null, { ...data, categoryId, imageProvider: image.provider, sourceImageUrl: image.sourceUrl });
  });
  revalidatePath("/admin/submissions"); revalidatePath("/admin");
}

export async function updateSubmissionStatusAction(formData: FormData) {
  const session = await admin();
  const parsed = z.object({ submissionId: z.string(), status: z.enum(["ACTIVE","DISQUALIFIED","HIDDEN","WINNER","ARCHIVED"]), confirm: z.string().optional() }).parse(Object.fromEntries(formData));
  if (parsed.status === "DISQUALIFIED" && parsed.confirm !== "DISQUALIFY") throw new Error("Confirmation required");
  const db = await getDb();
  await db.transaction(async (tx) => {
    const before = (await tx.query<{ status: string }>("SELECT status FROM submissions WHERE id=$1 AND contest_id=$2 FOR UPDATE", [parsed.submissionId, session.contestId]))[0];
    if (!before) throw new Error("Submission not found");
    await tx.query("UPDATE submissions SET status=$1,updated_at=NOW() WHERE id=$2", [parsed.status, parsed.submissionId]);
    await audit(tx, session.contestId!, session.id, parsed.status === "DISQUALIFIED" ? "SUBMISSION_DISQUALIFIED" : "SUBMISSION_UPDATED", "submission", parsed.submissionId, before, { status: parsed.status });
  });
  revalidatePath("/admin/submissions"); revalidatePath("/admin/results"); revalidatePath("/admin");
}

export async function archiveSubmissionAction(formData: FormData) {
  const session=await admin(); const data=z.object({submissionId:z.string().min(1),confirmation:z.literal("DELETE")}).parse(Object.fromEntries(formData));
  const before=(await query<{status:string}>("SELECT status FROM submissions WHERE id=$1 AND contest_id=$2",[data.submissionId,session.contestId]))[0]; if(!before)throw new Error("Submission not found");
  await query("UPDATE submissions SET status='ARCHIVED',updated_at=NOW() WHERE id=$1 AND contest_id=$2",[data.submissionId,session.contestId]);
  await query("INSERT INTO audit_logs (id,contest_id,actor_user_id,action_type,entity_type,entity_id,before_data,after_data) VALUES ($1,$2,$3,'SUBMISSION_ARCHIVED','submission',$4,$5::jsonb,$6::jsonb)",[crypto.randomUUID(),session.contestId,session.id,data.submissionId,JSON.stringify(before),JSON.stringify({status:"ARCHIVED",recoverable:true})]);
  revalidatePath("/admin/submissions"); revalidatePath("/admin/results"); revalidatePath("/admin");
}

export async function reorderSubmissionAction(formData: FormData) {
  const session=await admin(); const data=z.object({submissionId:z.string().min(1),direction:z.enum(["up","down"])}).parse(Object.fromEntries(formData)); const db=await getDb();
  await db.transaction(async(tx)=>{const current=(await tx.query<{id:string;display_order:number}>("SELECT id,display_order FROM submissions WHERE id=$1 AND contest_id=$2 FOR UPDATE",[data.submissionId,session.contestId]))[0];if(!current)throw new Error("Submission not found");const operator=data.direction==="up"?"<":">";const sortOrder=data.direction==="up"?"DESC":"ASC";const adjacent=(await tx.query<{id:string;display_order:number}>(`SELECT id,display_order FROM submissions WHERE contest_id=$1 AND display_order ${operator} $2 ORDER BY display_order ${sortOrder} LIMIT 1 FOR UPDATE`,[session.contestId,current.display_order]))[0];if(!adjacent)return;await tx.query("UPDATE submissions SET display_order=$1 WHERE id=$2",[adjacent.display_order,current.id]);await tx.query("UPDATE submissions SET display_order=$1 WHERE id=$2",[current.display_order,adjacent.id]);await rebuildJudgeQueues(tx,session.contestId!);await audit(tx,session.contestId!,session.id,"SUBMISSION_REORDERED","submission",current.id,{displayOrder:current.display_order},{displayOrder:adjacent.display_order});});
  revalidatePath("/admin/submissions");
}

export async function resetSubmissionScoresAction(formData: FormData) {
  const session = await admin();
  const { submissionId, reason } = z.object({ submissionId: z.string(), confirmation: z.literal("RESET"), reason: z.string().min(3).max(500) }).parse(Object.fromEntries(formData));
  const db = await getDb();
  await db.transaction(async (tx) => {
    const affected = await tx.query<{ id: string; score: number }>("SELECT id,score::float8 AS score FROM scores WHERE contest_id=$1 AND submission_id=$2 AND is_active=TRUE FOR UPDATE", [session.contestId, submissionId]);
    await tx.query("UPDATE scores SET is_active=FALSE,reset_at=NOW(),reset_by=$1,reset_reason=$2,updated_at=NOW() WHERE contest_id=$3 AND submission_id=$4 AND is_active=TRUE", [session.id, reason, session.contestId, submissionId]);
    await audit(tx, session.contestId!, session.id, "SCORE_RESET", "submission", submissionId, { activeScoreCount: affected.length }, { activeScoreCount: 0, reason });
  });
  revalidatePath("/admin/submissions"); revalidatePath("/admin/results"); revalidatePath("/admin");
}

export async function addJudgeAction(formData: FormData) {
  const session = await admin();
  const data = z.object({ name: z.string().min(2).max(80), email: z.string().email().optional().or(z.literal("")), pin: z.string().regex(/^\d{4,6}$/), avatarUrl: z.string().max(2000).optional() }).parse(Object.fromEntries(formData));
  const db = await getDb();
  await db.transaction(async (tx) => {
    const id = crypto.randomUUID();
    const pinHash = await hash(data.pin, 10);
    const avatar = data.avatarUrl ? resolveImageSource(data.avatarUrl) : null;
    await tx.query("INSERT INTO users (id,name,email,role,pin_hash,avatar_color,avatar_url) VALUES ($1,$2,$3,'JUDGE',$4,$5,$6)", [id, data.name, data.email || null, pinHash, "#27B8FF", avatar?.thumbnailUrl ?? avatar?.imageUrl ?? null]);
    await tx.query("INSERT INTO contest_judges (id,contest_id,user_id,pin_hash,status,required,display_order) VALUES ($1,$2,$3,$4,'ACTIVE',TRUE,(SELECT COALESCE(MAX(display_order),-1)+1 FROM contest_judges WHERE contest_id=$2))", [crypto.randomUUID(), session.contestId, id, pinHash]);
    await tx.query("UPDATE contests SET required_judges=NULL,updated_at=NOW() WHERE id=$1", [session.contestId]);
    const contest=(await tx.query<{judging_order:"SUBMISSION_NUMBER"|"RANDOM_PER_JUDGE"|"SAME_RANDOM"}>("SELECT judging_order FROM contests WHERE id=$1",[session.contestId]))[0];
    const submissions = await tx.query<{ id: string }>("SELECT id FROM submissions WHERE contest_id=$1 AND status='ACTIVE' ORDER BY display_order", [session.contestId]);
    const ordered=orderSubmissionIds(submissions.map(item=>item.id),contest.judging_order,session.contestId!,id);
    for (const [position, submissionId] of ordered.entries()) await tx.query("INSERT INTO judge_submission_order (id,contest_id,judge_id,submission_id,position) VALUES ($1,$2,$3,$4,$5)", [crypto.randomUUID(), session.contestId, id, submissionId, position]);
    await audit(tx, session.contestId!, session.id, "JUDGE_CREATED", "user", id, null, { name: data.name, avatarProvider: avatar?.provider ?? null });
  });
  revalidatePath("/admin/judges"); revalidatePath("/admin"); revalidatePath("/admin/progress"); revalidatePath("/login");
}

export async function deleteJudgeAction(formData: FormData) {
  const session = await admin();
  const data = z.object({
    judgeId: z.string().min(1),
  }).parse(Object.fromEntries(formData));

  const judge = (await query<{ id: string; name: string; role: string }>(
    "SELECT u.id, u.name, u.role FROM users u JOIN contest_judges cj ON cj.user_id = u.id WHERE u.id = $1 AND cj.contest_id = $2",
    [data.judgeId, session.contestId]
  ))[0];

  if (!judge) throw new Error("ไม่พบข้อมูลกรรมการ");
  if (judge.role !== "JUDGE") throw new Error("ไม่สามารถลบบัญชีผู้ดูแลระบบได้");

  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.query("UPDATE audit_logs SET actor_user_id = NULL WHERE actor_user_id = $1", [data.judgeId]);
    await tx.query("DELETE FROM score_revisions WHERE changed_by = $1", [data.judgeId]);
    await tx.query("UPDATE scores SET reset_by = NULL WHERE reset_by = $1", [data.judgeId]);
    await tx.query("DELETE FROM scores WHERE contest_id = $1 AND judge_id = $2", [session.contestId, data.judgeId]);
    await tx.query("DELETE FROM judging_sessions WHERE contest_id = $1 AND judge_id = $2", [session.contestId, data.judgeId]);
    await tx.query("DELETE FROM judge_submission_order WHERE contest_id = $1 AND judge_id = $2", [session.contestId, data.judgeId]);
    await tx.query("DELETE FROM contest_judges WHERE contest_id = $1 AND user_id = $2", [session.contestId, data.judgeId]);
    await tx.query(
      "DELETE FROM users WHERE id = $1 AND role = 'JUDGE' AND NOT EXISTS (SELECT 1 FROM contest_judges WHERE user_id = $1)",
      [data.judgeId]
    );
    await audit(tx, session.contestId!, session.id, "JUDGE_DELETED", "user", data.judgeId, { name: judge.name }, { deleted: true });
  });

  revalidatePath("/admin/judges");
  revalidatePath("/admin");
  revalidatePath("/admin/progress");
  revalidatePath("/admin/results");
  revalidatePath("/login");
}

export async function updateJudgeProfileAction(formData: FormData) {
  const session = await admin();
  const data = z.object({ judgeId: z.string().min(1), name: z.string().min(2).max(80), avatarUrl: z.string().max(2000).optional(), avatarColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/) }).parse(Object.fromEntries(formData));
  const before = (await query<{ name: string; avatar_url: string | null; avatar_color: string }>("SELECT name,avatar_url,avatar_color FROM users WHERE id=$1", [data.judgeId]))[0];
  const membership = (await query<{ exists: boolean }>("SELECT EXISTS(SELECT 1 FROM contest_judges WHERE contest_id=$1 AND user_id=$2) AS exists", [session.contestId, data.judgeId]))[0]?.exists;
  if (!before || !membership) throw new Error("Judge not found");
  const avatar = data.avatarUrl ? resolveImageSource(data.avatarUrl) : null;
  const avatarUrl = avatar?.thumbnailUrl ?? avatar?.imageUrl ?? null;
  await query("UPDATE users SET name=$1,avatar_url=$2,avatar_color=$3,updated_at=NOW() WHERE id=$4", [data.name, avatarUrl, data.avatarColor, data.judgeId]);
  await query("INSERT INTO audit_logs (id,contest_id,actor_user_id,action_type,entity_type,entity_id,before_data,after_data) VALUES ($1,$2,$3,'JUDGE_PROFILE_UPDATED','user',$4,$5::jsonb,$6::jsonb)", [crypto.randomUUID(), session.contestId, session.id, data.judgeId, JSON.stringify(before), JSON.stringify({ name: data.name, avatarUrl, avatarColor: data.avatarColor })]);
  revalidatePath("/admin/judges"); revalidatePath("/admin"); revalidatePath("/admin/progress"); revalidatePath("/login");
}

export async function createCategoryAction(formData: FormData) {
  const session = await admin();
  const data = z.object({ name: z.string().trim().min(2).max(80), description: z.string().max(500).default(""), color: z.string().regex(/^#[0-9A-Fa-f]{6}$/), icon: z.string().trim().min(1).max(12) }).parse(Object.fromEntries(formData));
  const id = crypto.randomUUID();
  const slug = `${categorySlug(data.name)}-${id.slice(0, 6)}`;
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.query("INSERT INTO submission_categories (id,contest_id,name,slug,description,color,icon,display_order) VALUES ($1,$2,$3,$4,$5,$6,$7,(SELECT COALESCE(MAX(display_order),-1)+1 FROM submission_categories WHERE contest_id=$2))", [id, session.contestId, data.name, slug, data.description, data.color, data.icon]);
    await audit(tx, session.contestId!, session.id, "CATEGORY_CREATED", "submission_category", id, null, data);
  });
  revalidatePath("/admin/categories"); revalidatePath("/admin/submissions");
}

export async function updateCategoryAction(formData: FormData) {
  const session = await admin();
  const data = z.object({ categoryId: z.string().min(1), name: z.string().trim().min(2).max(80), description: z.string().max(500), color: z.string().regex(/^#[0-9A-Fa-f]{6}$/), icon: z.string().trim().min(1).max(12), activeToggle: z.string().optional() }).parse(Object.fromEntries(formData));
  const before = (await query<Record<string, unknown>>("SELECT * FROM submission_categories WHERE id=$1 AND contest_id=$2", [data.categoryId, session.contestId]))[0];
  if (!before) throw new Error("Category not found");
  await query("UPDATE submission_categories SET name=$1,description=$2,color=$3,icon=$4,active=$5,updated_at=NOW() WHERE id=$6 AND contest_id=$7", [data.name, data.description, data.color, data.icon, !!data.activeToggle, data.categoryId, session.contestId]);
  await query("INSERT INTO audit_logs (id,contest_id,actor_user_id,action_type,entity_type,entity_id,before_data,after_data) VALUES ($1,$2,$3,'CATEGORY_UPDATED','submission_category',$4,$5::jsonb,$6::jsonb)", [crypto.randomUUID(), session.contestId, session.id, data.categoryId, JSON.stringify(before), JSON.stringify(data)]);
  revalidatePath("/admin/categories"); revalidatePath("/admin/submissions"); revalidatePath("/admin/results"); revalidatePath("/judge");
}

export async function reorderCategoryAction(formData: FormData) {
  const session = await admin();
  const data = z.object({ categoryId: z.string().min(1), direction: z.enum(["up", "down"]) }).parse(Object.fromEntries(formData));
  const db = await getDb();
  await db.transaction(async (tx) => {
    const current = (await tx.query<{ id: string; display_order: number }>("SELECT id,display_order FROM submission_categories WHERE id=$1 AND contest_id=$2 FOR UPDATE", [data.categoryId, session.contestId]))[0];
    if (!current) throw new Error("Category not found");
    const operator = data.direction === "up" ? "<" : ">";
    const sort = data.direction === "up" ? "DESC" : "ASC";
    const adjacent = (await tx.query<{ id: string; display_order: number }>(`SELECT id,display_order FROM submission_categories WHERE contest_id=$1 AND display_order ${operator} $2 ORDER BY display_order ${sort} LIMIT 1 FOR UPDATE`, [session.contestId, current.display_order]))[0];
    if (!adjacent) return;
    await tx.query("UPDATE submission_categories SET display_order=$1 WHERE id=$2", [adjacent.display_order, current.id]);
    await tx.query("UPDATE submission_categories SET display_order=$1 WHERE id=$2", [current.display_order, adjacent.id]);
    await audit(tx, session.contestId!, session.id, "CATEGORY_REORDERED", "submission_category", current.id, { displayOrder: current.display_order }, { displayOrder: adjacent.display_order });
  });
  revalidatePath("/admin/categories"); revalidatePath("/admin/submissions"); revalidatePath("/admin/results");
}

export async function sortSubmissionsAction(formData: FormData) {
  const session = await admin();
  const mode = z.enum(["CATEGORY_NUMBER", "SUBMISSION_NUMBER", "SUBMITTED_AT", "ARTIST_NAME"]).parse(formData.get("sortMode"));
  const clauses = {
    CATEGORY_NUMBER: "COALESCE(cat.display_order,999999),sub.submission_number,sub.created_at",
    SUBMISSION_NUMBER: "sub.submission_number,sub.created_at",
    SUBMITTED_AT: "sub.submitted_at,sub.created_at",
    ARTIST_NAME: "LOWER(sub.display_name),sub.submission_number",
  } as const;
  const db = await getDb();
  await db.transaction(async (tx) => {
    const rows = await tx.query<{ id: string }>(`SELECT sub.id FROM submissions sub LEFT JOIN submission_categories cat ON cat.id=sub.category_id WHERE sub.contest_id=$1 ORDER BY ${clauses[mode]}`, [session.contestId]);
    for (const [index, row] of rows.entries()) await tx.query("UPDATE submissions SET display_order=$1,updated_at=NOW() WHERE id=$2", [index, row.id]);
    await rebuildJudgeQueues(tx, session.contestId!);
    await audit(tx, session.contestId!, session.id, "SUBMISSIONS_SORTED", "submission", session.contestId!, null, { mode, count: rows.length });
  });
  revalidatePath("/admin/submissions"); revalidatePath("/judge"); revalidatePath("/judge/review");
}

export async function toggleJudgeAction(formData: FormData) {
  const session = await admin();
  const data = z.object({ judgeId: z.string(), status: z.enum(["ACTIVE","DISABLED"]) }).parse(Object.fromEntries(formData));
  await query("UPDATE contest_judges SET status=$1 WHERE contest_id=$2 AND user_id=$3", [data.status, session.contestId, data.judgeId]);
  await query("INSERT INTO audit_logs (id,contest_id,actor_user_id,action_type,entity_type,entity_id,after_data) VALUES ($1,$2,$3,$4,'user',$5,$6::jsonb)", [crypto.randomUUID(), session.contestId, session.id, data.status === "DISABLED" ? "JUDGE_DISABLED" : "JUDGE_ENABLED", data.judgeId, JSON.stringify({ status: data.status })]);
  revalidatePath("/admin/judges"); revalidatePath("/admin");
}

export async function toggleJudgeRequiredAction(formData: FormData) {
  const session = await admin();
  const data = z.object({ judgeId: z.string(), required: z.enum(["true", "false"]) }).parse(Object.fromEntries(formData));
  const required = data.required === "true";
  const before = (await query<{ required: boolean }>("SELECT required FROM contest_judges WHERE contest_id=$1 AND user_id=$2", [session.contestId, data.judgeId]))[0];
  if (!before) throw new Error("Judge not found");
  await query("UPDATE contest_judges SET required=$1 WHERE contest_id=$2 AND user_id=$3", [required, session.contestId, data.judgeId]);
  await query("UPDATE contests SET required_judges=NULL,updated_at=NOW() WHERE id=$1", [session.contestId]);
  await query("INSERT INTO audit_logs (id,contest_id,actor_user_id,action_type,entity_type,entity_id,before_data,after_data) VALUES ($1,$2,$3,'REQUIRED_JUDGE_CHANGED','user',$4,$5::jsonb,$6::jsonb)", [crypto.randomUUID(),session.contestId,session.id,data.judgeId,JSON.stringify(before),JSON.stringify({ required })]);
  revalidatePath("/admin/judges"); revalidatePath("/admin/results"); revalidatePath("/admin");
}

export async function updateSettingsAction(formData: FormData) {
  const session = await admin();
  const data = z.object({
    contestStatus: z.enum(["DRAFT","OPEN","JUDGING","COMPLETED","ARCHIVED"]),
    aggregationMethod: z.enum(["SUM","AVERAGE","MEDIAN","DROP_HIGHEST_LOWEST"]),
    tieBreaker: z.string().min(1).max(120),
    loginMode: z.enum(["PICKER","PICKER_PIN","ACCOUNT"]),
    judgingOrder: z.enum(["SUBMISSION_NUMBER","RANDOM_PER_JUDGE","SAME_RANDOM"]),
    inputMode: z.enum(["SLIDER","STEPPER","NUMBER","QUICK"]),
    commentMode: z.enum(["DISABLED","OPTIONAL","REQUIRED"]),
    anonymousJudging: z.string().optional(), allowJudgeEditing: z.string().optional(), progressAnimations: z.string().optional(), metadataVisibility: z.string().optional(),
  }).parse(Object.fromEntries(formData));
  if(data.tieBreaker!=="MANUAL"){
    const criterionId=data.tieBreaker.startsWith("CRITERION:")?data.tieBreaker.slice("CRITERION:".length):"";
    const valid=(await query<{exists:boolean}>("SELECT EXISTS(SELECT 1 FROM criteria WHERE id=$1 AND criteria_version_id=(SELECT active_criteria_version_id FROM contests WHERE id=$2) AND enabled=TRUE) AS exists",[criterionId,session.contestId]))[0]?.exists;
    if(!valid)throw new Error("Invalid tie-break criterion");
  }
  const before = (await query<Record<string, unknown>>("SELECT * FROM contests WHERE id=$1", [session.contestId]))[0];
  const db=await getDb();
  await db.transaction(async(tx)=>{
    await tx.query(`UPDATE contests SET status=$1,aggregation_method=$2,tie_breaker=$3,judge_login_mode=$4,judging_order=$5,input_mode=$6,comment_mode=$7,anonymous_judging=$8,allow_judge_editing=$9,progress_animations=$10,metadata_visibility=$11,updated_at=NOW() WHERE id=$12`, [data.contestStatus,data.aggregationMethod,data.tieBreaker,data.loginMode,data.judgingOrder,data.inputMode,data.commentMode,!!data.anonymousJudging,!!data.allowJudgeEditing,!!data.progressAnimations,!!data.metadataVisibility,session.contestId]);
    if(before.judging_order!==data.judgingOrder){
      const submissions=await tx.query<{id:string}>("SELECT id FROM submissions WHERE contest_id=$1 AND status='ACTIVE' ORDER BY display_order",[session.contestId]);
      const judges=await tx.query<{user_id:string}>("SELECT cj.user_id FROM contest_judges cj JOIN users u ON u.id=cj.user_id WHERE cj.contest_id=$1 AND u.role='JUDGE'",[session.contestId]);
      const flags=await tx.query<{judge_id:string;submission_id:string;flagged:boolean}>("SELECT judge_id,submission_id,flagged FROM judge_submission_order WHERE contest_id=$1",[session.contestId]);
      const flagMap=new Map(flags.map(item=>[`${item.judge_id}:${item.submission_id}`,item.flagged]));
      await tx.query("DELETE FROM judge_submission_order WHERE contest_id=$1",[session.contestId]);
      for(const judge of judges){const ordered=orderSubmissionIds(submissions.map(item=>item.id),data.judgingOrder,session.contestId!,judge.user_id);for(const [position,submissionId] of ordered.entries())await tx.query("INSERT INTO judge_submission_order (id,contest_id,judge_id,submission_id,position,flagged) VALUES ($1,$2,$3,$4,$5,$6)",[crypto.randomUUID(),session.contestId,judge.user_id,submissionId,position,flagMap.get(`${judge.user_id}:${submissionId}`)??false]);}
    }
    await audit(tx,session.contestId!,session.id,"CONTEST_SETTINGS_UPDATED","contest",session.contestId!,before,data);
  });
  revalidatePath("/admin/settings"); revalidatePath("/admin/results");
}

export async function createCriteriaVersionAction(formData: FormData) {
  const session = await admin();
  const raw = z.object({ criteriaJson: z.string(), confirmation: z.string().optional(), migrationMode: z.enum(["NONE","COMPATIBLE"]).default("NONE") }).parse(Object.fromEntries(formData));

  const items = z.array(z.object({ name: z.string().min(2).max(100), description: z.string().max(400).default(""), maxScore: z.number().positive().max(100) })).min(1).parse(JSON.parse(raw.criteriaJson));
  const total = items.reduce((sum, item) => sum + item.maxScore, 0);
  if (Math.abs(total - 100) > 0.0001) throw new Error("Criteria total must equal 100");
  const db = await getDb();
  await db.transaction(async (tx) => {
    const contest = (await tx.query<{ active_criteria_version_id: string }>("SELECT active_criteria_version_id FROM contests WHERE id=$1 FOR UPDATE", [session.contestId]))[0];
    const set = (await tx.query<{ id: string }>("SELECT id FROM criteria_sets WHERE contest_id=$1 ORDER BY created_at LIMIT 1", [session.contestId]))[0];
    const next = (await tx.query<{ next: number }>("SELECT COALESCE(MAX(version_number),0)::int+1 AS next FROM criteria_versions WHERE criteria_set_id=$1", [set.id]))[0].next;
    const versionId = crypto.randomUUID();
    await tx.query("UPDATE criteria_versions SET status='ARCHIVED' WHERE id=$1", [contest.active_criteria_version_id]);
    await tx.query("INSERT INTO criteria_versions (id,criteria_set_id,version_number,status,total_max,created_by) VALUES ($1,$2,$3,'ACTIVE',100,$4)", [versionId,set.id,next,session.id]);
    const newCriteria:{id:string;name:string;maxScore:number}[]=[];
    for (const [index,item] of items.entries()) { const criterionId=crypto.randomUUID(); newCriteria.push({id:criterionId,name:item.name,maxScore:item.maxScore}); await tx.query("INSERT INTO criteria (id,criteria_version_id,name,description,max_score,display_order) VALUES ($1,$2,$3,$4,$5,$6)", [criterionId,versionId,item.name,item.description,item.maxScore,index]); }
    let migrated=0;
    if(raw.migrationMode==="COMPATIBLE"){
      const oldCriteria=await tx.query<{id:string;name:string}>("SELECT id,name FROM criteria WHERE criteria_version_id=$1 AND enabled=TRUE",[contest.active_criteria_version_id]);
      const newByName=new Map(newCriteria.map(item=>[item.name.trim().toLocaleLowerCase(),item]));
      if(oldCriteria.length!==newCriteria.length||newByName.size!==newCriteria.length)throw new Error("Cannot migrate: criteria names must match one-to-one");
      const mapping=new Map<string,{id:string;maxScore:number}>();
      for(const old of oldCriteria){const target=newByName.get(old.name.trim().toLocaleLowerCase());if(!target)throw new Error(`Cannot migrate: no matching criterion for ${old.name}`);mapping.set(old.id,target);}
      const oldScores=await tx.query<{contest_id:string;submission_id:string;judge_id:string;criterion_id:string;score:number;comment:string}>("SELECT contest_id,submission_id,judge_id,criterion_id,score::float8 AS score,comment FROM scores WHERE contest_id=$1 AND criteria_version_id=$2 AND is_active=TRUE",[session.contestId,contest.active_criteria_version_id]);
      for(const score of oldScores){const target=mapping.get(score.criterion_id);if(!target||Number(score.score)>target.maxScore)throw new Error("Cannot migrate: an existing score exceeds the new criterion maximum");await tx.query("INSERT INTO scores (id,contest_id,submission_id,judge_id,criterion_id,criteria_version_id,score,comment) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",[crypto.randomUUID(),score.contest_id,score.submission_id,score.judge_id,target.id,versionId,score.score,score.comment]);migrated+=1;}
    }
    await tx.query("UPDATE contests SET active_criteria_version_id=$1,updated_at=NOW() WHERE id=$2", [versionId,session.contestId]);
    await audit(tx,session.contestId!,session.id,"CRITERIA_VERSION_CHANGED","criteria_version",versionId,{ previousVersionId: contest.active_criteria_version_id },{ versionNumber: next,total,migrationMode:raw.migrationMode,migratedScoreRecords:migrated });
  });
  revalidatePath("/admin/criteria"); revalidatePath("/admin");
}

export async function lockResultsAction(formData: FormData) {
  const session = await admin();
  const { mode, confirmation } = z.object({ mode: z.enum(["lock","unlock"]), confirmation: z.string() }).parse(Object.fromEntries(formData));
  if (confirmation !== (mode === "lock" ? "LOCK" : "UNLOCK")) throw new Error("Confirmation required");
  await query(`UPDATE contests SET results_locked_at=${mode === "lock" ? "NOW()" : "NULL"},updated_at=NOW() WHERE id=$1`, [session.contestId]);
  await query("INSERT INTO audit_logs (id,contest_id,actor_user_id,action_type,entity_type,entity_id,after_data) VALUES ($1,$2,$3,$4,'contest',$2,$5::jsonb)", [crypto.randomUUID(),session.contestId,session.id,mode === "lock" ? "RESULTS_LOCKED" : "RESULTS_UNLOCKED",JSON.stringify({ mode })]);
  revalidatePath("/admin/results"); revalidatePath("/admin/settings");
}

export async function createSnapshotAction(formData: FormData) {
  const session = await admin();
  const name = z.string().min(2).max(100).parse(formData.get("name"));
  const ranking = await getRanking(session.contestId!);
  const next = (await query<{ next: number }>("SELECT COALESCE(MAX(version_number),0)::int+1 AS next FROM result_snapshots WHERE contest_id=$1", [session.contestId]))[0].next;
  const id = crypto.randomUUID();
  await query("INSERT INTO result_snapshots (id,contest_id,version_number,name,result_data,created_by) VALUES ($1,$2,$3,$4,$5::jsonb,$6)", [id,session.contestId,next,name,JSON.stringify({ method: ranking.contest.aggregation_method,rows: ranking.rows }),session.id]);
  await query("INSERT INTO audit_logs (id,contest_id,actor_user_id,action_type,entity_type,entity_id,after_data) VALUES ($1,$2,$3,'RESULT_SNAPSHOT_CREATED','result_snapshot',$4,$5::jsonb)", [crypto.randomUUID(),session.contestId,session.id,id,JSON.stringify({ version: next,name })]);
  revalidatePath("/admin/results");
}

export async function importSubmissionsAction(rows: { submission_number: string; contestant_name: string; player_id: string; artwork_title: string; image_url: string; category?: string }[]) {
  const session = await admin();
  const valid = z.array(z.object({ submission_number:z.string().min(1),contestant_name:z.string().min(1),player_id:z.string().min(1),artwork_title:z.string().min(1),image_url:z.string().min(1),category:z.string().optional() })).min(1).max(10000).parse(rows);
  const db = await getDb();
  await db.transaction(async (tx) => {
    const judges = await tx.query<{ user_id:string }>("SELECT cj.user_id FROM contest_judges cj JOIN users u ON u.id=cj.user_id WHERE cj.contest_id=$1 AND cj.status='ACTIVE' AND u.role='JUDGE'",[session.contestId]);
    const categories = await tx.query<{ id:string; name:string; slug:string }>("SELECT id,name,slug FROM submission_categories WHERE contest_id=$1 AND active=TRUE", [session.contestId]);
    const categoryMap = new Map(categories.flatMap((item) => [[item.name.trim().toLocaleLowerCase(), item.id] as const, [item.slug.trim().toLocaleLowerCase(), item.id] as const]));
    const fallbackCategory = categories.find((item) => item.slug === "unspecified")?.id ?? categories[0]?.id ?? null;
    for (const row of valid) {
      const id=crypto.randomUUID();
      const requestedCategory = row.category?.trim().toLocaleLowerCase();
      const categoryId = requestedCategory ? categoryMap.get(requestedCategory) : fallbackCategory;
      if (requestedCategory && !categoryId) throw new Error(`ไม่พบหมวดผลงาน: ${row.category}`);
      const image = resolveImageSource(row.image_url);
      await tx.query(`INSERT INTO submissions (id,contest_id,submission_number,contestant_name,display_name,player_id,artwork_title,image_url,thumbnail_url,source_image_url,category_id,display_order) VALUES ($1,$2,$3,$4,$4,$5,$6,$7,$8,$9,$10,(SELECT COALESCE(MAX(display_order),-1)+1 FROM submissions WHERE contest_id=$2))`,[id,session.contestId,row.submission_number,row.contestant_name,row.player_id,row.artwork_title,image.imageUrl,image.thumbnailUrl,image.sourceUrl,categoryId]);
      for(const judge of judges) await tx.query("INSERT INTO judge_submission_order (id,contest_id,judge_id,submission_id,position) VALUES ($1,$2,$3,$4,(SELECT COALESCE(MAX(position),-1)+1 FROM judge_submission_order WHERE contest_id=$2 AND judge_id=$3))",[crypto.randomUUID(),session.contestId,judge.user_id,id]);
    }
    await audit(tx,session.contestId!,session.id,"SUBMISSION_BULK_IMPORTED","submission",session.contestId!,null,{ count: valid.length, driveLinksNormalized: valid.filter((row) => resolveImageSource(row.image_url).provider === "GOOGLE_DRIVE").length });
  });
  revalidatePath("/admin/submissions"); revalidatePath("/admin");
  return { imported: valid.length };
}

export async function reviseJudgeScoresAction(formData: FormData) {
  const session = await admin();
  const base = z.object({
    submissionId: z.string().min(1),
    judgeId: z.string().min(1),
    criteriaVersionId: z.string().min(1),
    reason: z.string().trim().min(3, "A revision reason is required").max(500),
    comment: z.string().max(2000).optional(),
  }).parse(Object.fromEntries(formData));
  const criteria = await query<{ id: string; max_score: number }>(
    "SELECT id,max_score::float8 AS max_score FROM criteria WHERE criteria_version_id=$1 AND enabled=TRUE ORDER BY display_order",
    [base.criteriaVersionId],
  );
  const scores = criteria.map((criterion) => {
    const raw = formData.get(`score_${criterion.id}`);
    const score = Number(raw);
    if (raw === null || raw === "" || !Number.isFinite(score)) throw new Error("Every criterion needs a valid score");
    const rawVersion = formData.get(`version_${criterion.id}`);
    return { criterionId: criterion.id, score, expectedVersion: rawVersion ? Number(rawVersion) : undefined };
  });
  await saveCriterionScores({
    contestId: session.contestId!,
    submissionId: base.submissionId,
    judgeId: base.judgeId,
    criteriaVersionId: base.criteriaVersionId,
    scores,
    comment: base.comment,
    actorId: session.id,
    reason: base.reason,
  });
  revalidatePath(`/admin/results/${base.submissionId}`);
  revalidatePath("/admin/results");
  revalidatePath("/admin/audit");
  revalidatePath("/admin/progress");
}

export async function updateSubmissionAction(formData: FormData) {
  const session = await admin();
  const data = z.object({
    submissionId: z.string().min(1), submissionNumber: z.string().min(1).max(30), contestantName: z.string().min(1).max(120),
    displayName: z.string().min(1).max(120), playerId: z.string().min(1).max(120), email: z.string().email().optional().or(z.literal("")),
    socialUrl: z.string().url().optional().or(z.literal("")), artworkTitle: z.string().min(1).max(180), description: z.string().max(4000), adminNote: z.string().max(4000), categoryId: z.string().optional(),
  }).parse(Object.fromEntries(formData));
  const before = (await query<Record<string,unknown>>("SELECT * FROM submissions WHERE id=$1 AND contest_id=$2", [data.submissionId,session.contestId]))[0];
  if (!before) throw new Error("Submission not found");
  const db = await getDb();
  await db.transaction(async (tx) => {
    const categoryId = await resolveCategoryId(tx, session.contestId!, data.categoryId || null);
    await tx.query(`UPDATE submissions SET submission_number=$1,contestant_name=$2,display_name=$3,player_id=$4,email=$5,social_url=$6,artwork_title=$7,description=$8,admin_note=$9,category_id=$10,updated_at=NOW() WHERE id=$11 AND contest_id=$12`, [data.submissionNumber,data.contestantName,data.displayName,data.playerId,data.email||null,data.socialUrl||null,data.artworkTitle,data.description,data.adminNote,categoryId,data.submissionId,session.contestId]);
    await audit(tx, session.contestId!, session.id, "SUBMISSION_UPDATED", "submission", data.submissionId, before, { ...data, categoryId });
  });
  revalidatePath(`/admin/submissions/${data.submissionId}`); revalidatePath("/admin/submissions"); revalidatePath("/admin/results");
}

export async function replaceSubmissionImageAction(formData: FormData) {
  const session = await admin();
  const data = z.object({ submissionId:z.string().min(1), imageUrl:z.string().min(1).max(2000), thumbnailUrl:z.string().max(2000).optional(), confirmation:z.literal("REPLACE") }).parse(Object.fromEntries(formData));
  const before=(await query<{image_url:string;thumbnail_url:string|null}>("SELECT image_url,thumbnail_url FROM submissions WHERE id=$1 AND contest_id=$2",[data.submissionId,session.contestId]))[0];
  if(!before)throw new Error("Submission not found");
  const image=resolveImageSource(data.imageUrl,data.thumbnailUrl);
  await query("UPDATE submissions SET image_url=$1,thumbnail_url=$2,source_image_url=$3,updated_at=NOW() WHERE id=$4 AND contest_id=$5",[image.imageUrl,image.thumbnailUrl,image.sourceUrl,data.submissionId,session.contestId]);
  await query("INSERT INTO audit_logs (id,contest_id,actor_user_id,action_type,entity_type,entity_id,before_data,after_data) VALUES ($1,$2,$3,'SUBMISSION_IMAGE_REPLACED','submission',$4,$5::jsonb,$6::jsonb)",[crypto.randomUUID(),session.contestId,session.id,data.submissionId,JSON.stringify(before),JSON.stringify({imageUrl:image.imageUrl,thumbnailUrl:image.thumbnailUrl,sourceImageUrl:image.sourceUrl,provider:image.provider})]);
  revalidatePath(`/admin/submissions/${data.submissionId}`); revalidatePath("/admin/submissions");
}

const defaultCriteria = [
  { name:"Theme & Concept",description:"ความสอดคล้องกับธีมและความชัดเจนของแนวคิด",maxScore:30 },
  { name:"Composition & Storytelling",description:"องค์ประกอบภาพและการเล่าเรื่อง",maxScore:25 },
  { name:"Creativity",description:"ความคิดสร้างสรรค์และความสดใหม่",maxScore:20 },
  { name:"Technique & Completion",description:"เทคนิค ความประณีต และความสมบูรณ์",maxScore:15 },
  { name:"Character Expression",description:"อารมณ์และบุคลิกของตัวละคร",maxScore:10 },
] as const;

export async function createContestAction(formData: FormData) {
  const session = await admin();
  const data=z.object({name:z.string().min(2).max(160),internalName:z.string().regex(/^[a-z0-9][a-z0-9-]{1,79}$/),description:z.string().max(2000).default("")}).parse(Object.fromEntries(formData));
  const db=await getDb(); const contestId=crypto.randomUUID(); const setId=crypto.randomUUID(); const versionId=crypto.randomUUID();
  await db.transaction(async(tx)=>{
    await tx.query(`INSERT INTO contests (id,name,internal_name,description,status,active_criteria_version_id,judge_login_mode,aggregation_method,required_judges,anonymous_judging,judging_order,comment_mode,input_mode,allow_judge_editing,result_visibility,progress_animations,metadata_visibility) VALUES ($1,$2,$3,$4,'DRAFT',$5,'PICKER_PIN','SUM',NULL,TRUE,'RANDOM_PER_JUDGE','OPTIONAL','STEPPER',TRUE,FALSE,TRUE,FALSE)`,[contestId,data.name,data.internalName,data.description,versionId]);
    await tx.query("INSERT INTO contest_judges (id,contest_id,user_id,status,required,display_order) VALUES ($1,$2,$3,'ACTIVE',FALSE,0)",[crypto.randomUUID(),contestId,session.id]);
    await tx.query("INSERT INTO criteria_sets (id,contest_id,name) VALUES ($1,$2,'Fan Art Criteria')",[setId,contestId]);
    await tx.query("INSERT INTO criteria_versions (id,criteria_set_id,version_number,status,total_max,created_by) VALUES ($1,$2,1,'ACTIVE',100,$3)",[versionId,setId,session.id]);
    for(const [index,item] of defaultCriteria.entries())await tx.query("INSERT INTO criteria (id,criteria_version_id,name,description,max_score,display_order) VALUES ($1,$2,$3,$4,$5,$6)",[crypto.randomUUID(),versionId,item.name,item.description,item.maxScore,index]);
    const defaultCategories = [
      ["traditional", "วาดบนกระดาษ", "Traditional art / งานวาดและลงสีบนกระดาษ", "#FF873A", "✏️"],
      ["digital", "วาดด้วยเครื่องมือดิจิทัล", "Digital art / งานที่สร้างด้วยอุปกรณ์และซอฟต์แวร์", "#27B8FF", "🖥️"],
      ["unspecified", "ยังไม่จัดหมวด", "ผลงานที่รอทีมงานตรวจสอบและจัดประเภท", "#64748B", "🗂️"],
    ] as const;
    for (const [index, category] of defaultCategories.entries()) await tx.query("INSERT INTO submission_categories (id,contest_id,slug,name,description,color,icon,display_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [crypto.randomUUID(), contestId, ...category, index]);
    await audit(tx,contestId,session.id,"CONTEST_CREATED","contest",contestId,null,{name:data.name,internalName:data.internalName});
  });
  await setSession({...session,contestId}); redirect("/admin");
}

export async function switchContestAction(formData: FormData) {
  const session=await admin(); const contestId=z.string().min(1).parse(formData.get("contestId"));
  const access=(await query<{exists:boolean}>("SELECT EXISTS(SELECT 1 FROM contest_judges WHERE contest_id=$1 AND user_id=$2 AND status='ACTIVE') AS exists",[contestId,session.id]))[0]?.exists;
  if(!access)throw new Error("Contest access denied");
  await setSession({...session,contestId}); redirect("/admin");
}

export async function duplicateContestAction(formData: FormData) {
  const session=await admin();
  const data=z.object({sourceContestId:z.string().min(1),name:z.string().min(2).max(160),internalName:z.string().regex(/^[a-z0-9][a-z0-9-]{1,79}$/),confirmation:z.literal("DUPLICATE")}).parse(Object.fromEntries(formData));
  if(data.sourceContestId!==session.contestId)throw new Error("Switch to the source contest first");
  const db=await getDb(); const contestId=crypto.randomUUID(); const setId=crypto.randomUUID(); const versionId=crypto.randomUUID();
  await db.transaction(async(tx)=>{
    const source=(await tx.query<Record<string,unknown>>("SELECT * FROM contests WHERE id=$1 FOR UPDATE",[data.sourceContestId]))[0]; if(!source)throw new Error("Contest not found");
    await tx.query(`INSERT INTO contests (id,name,internal_name,description,cover_image,status,active_criteria_version_id,judge_login_mode,aggregation_method,tie_breaker,required_judges,anonymous_judging,judging_order,comment_mode,input_mode,allow_judge_editing,result_visibility,progress_animations,metadata_visibility) SELECT $1,$2,$3,description,cover_image,'DRAFT',$4,judge_login_mode,aggregation_method,tie_breaker,required_judges,anonymous_judging,judging_order,comment_mode,input_mode,allow_judge_editing,FALSE,progress_animations,metadata_visibility FROM contests WHERE id=$5`,[contestId,data.name,data.internalName,versionId,data.sourceContestId]);
    await tx.query("INSERT INTO criteria_sets (id,contest_id,name) VALUES ($1,$2,'Duplicated Criteria')",[setId,contestId]);
    await tx.query("INSERT INTO criteria_versions (id,criteria_set_id,version_number,status,total_max,created_by) VALUES ($1,$2,1,'ACTIVE',100,$3)",[versionId,setId,session.id]);
    const sourceCriteria=await tx.query<{name:string;description:string;max_score:number;display_order:number;enabled:boolean}>(`SELECT c.name,c.description,c.max_score::float8 AS max_score,c.display_order,c.enabled FROM criteria c JOIN contests ct ON ct.active_criteria_version_id=c.criteria_version_id WHERE ct.id=$1 ORDER BY c.display_order`,[data.sourceContestId]);
    for(const criterion of sourceCriteria)await tx.query("INSERT INTO criteria (id,criteria_version_id,name,description,max_score,display_order,enabled) VALUES ($1,$2,$3,$4,$5,$6,$7)",[crypto.randomUUID(),versionId,criterion.name,criterion.description,criterion.max_score,criterion.display_order,criterion.enabled]);
    const memberships=await tx.query<{user_id:string;pin_hash:string|null;status:string;required:boolean;display_order:number}>("SELECT user_id,pin_hash,status,required,display_order FROM contest_judges WHERE contest_id=$1",[data.sourceContestId]);
    for(const member of memberships)await tx.query("INSERT INTO contest_judges (id,contest_id,user_id,pin_hash,status,required,display_order) VALUES ($1,$2,$3,$4,$5,$6,$7)",[crypto.randomUUID(),contestId,member.user_id,member.pin_hash,member.status,member.required,member.display_order]);
    const categories=await tx.query<{name:string;slug:string;description:string;color:string;icon:string;display_order:number;active:boolean}>("SELECT name,slug,description,color,icon,display_order,active FROM submission_categories WHERE contest_id=$1 ORDER BY display_order",[data.sourceContestId]);
    for(const category of categories)await tx.query("INSERT INTO submission_categories (id,contest_id,name,slug,description,color,icon,display_order,active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",[crypto.randomUUID(),contestId,category.name,category.slug,category.description,category.color,category.icon,category.display_order,category.active]);
    await audit(tx,contestId,session.id,"CONTEST_DUPLICATED","contest",contestId,{sourceContestId:data.sourceContestId},{name:data.name,submissionsCopied:0,scoresCopied:0});
  });
  await setSession({...session,contestId}); redirect("/admin");
}

export async function syncLocalArtworksAction() {
  const session = await admin();
  const artworksDir = path.join(process.cwd(), "public", "artworks");
  if (!fs.existsSync(artworksDir)) {
    fs.mkdirSync(artworksDir, { recursive: true });
  }
  const files = fs.readdirSync(artworksDir);
  const submissions = await query<{ id: string; submission_number: string; artwork_title: string }>(
    "SELECT id, submission_number, artwork_title FROM submissions WHERE contest_id=$1",
    [session.contestId]
  );
  let synced = 0;
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (![".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) continue;
    const base = path.basename(file, ext);
    const numMatch = base.match(/\b(\d{1,3})\b/) || base.match(/^(\d{1,3})/);
    if (!numMatch) continue;
    const parsedNum = parseInt(numMatch[1], 10);
    const subNumFormatted = String(parsedNum).padStart(3, "0");
    const target = submissions.find((s) => s.submission_number === subNumFormatted || parseInt(s.submission_number, 10) === parsedNum);
    if (target) {
      const localUrl = `/artworks/${file}`;
      await query(
        "UPDATE submissions SET image_url=$1, thumbnail_url=$1, updated_at=NOW() WHERE id=$2 AND contest_id=$3",
        [localUrl, target.id, session.contestId]
      );
      synced++;
    }
  }
  if (synced > 0) {
    await query("INSERT INTO audit_logs (id,contest_id,actor_user_id,action_type,entity_type,entity_id,after_data) VALUES ($1,$2,$3,'SUBMISSIONS_LOCAL_ARTWORKS_SYNCED','contest',$2,$4::jsonb)", [crypto.randomUUID(), session.contestId, session.id, JSON.stringify({ synced, totalFiles: files.length })]);
  }
  revalidatePath("/admin/submissions");
  revalidatePath("/judge");
  revalidatePath("/judge/review");
  revalidatePath("/admin/results");
}

