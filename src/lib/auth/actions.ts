"use server";

import { compare } from "bcryptjs";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { query } from "@/lib/db";
import type { Role } from "@/lib/db/types";
import { clearSession, setSession } from "./session";

const loginSchema = z.object({
  identity: z.string().min(3),
  pin: z.string().regex(/^\d{4,6}$/).optional().or(z.literal("")),
});

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/login?error=invalid");
  const [contestId,userId]=parsed.data.identity.split(":");
  if(!contestId||!userId)redirect("/login?error=invalid");

  const users = await query<{ id: string; name: string; role: Role; status: string; pin_hash: string | null; judge_login_mode:string }>(
    `SELECT u.id,u.name,u.role,u.status,COALESCE(cj.pin_hash,u.pin_hash) AS pin_hash,c.judge_login_mode
     FROM users u JOIN contest_judges cj ON cj.user_id=u.id JOIN contests c ON c.id=cj.contest_id
     WHERE cj.contest_id=$1 AND u.id=$2 AND cj.status='ACTIVE' AND u.status='ACTIVE'`,
    [contestId, userId],
  );
  const user = users[0];
  if(!user)redirect("/login?error=invalid");
  if(user.role==="JUDGE"&&user.judge_login_mode==="ACCOUNT")redirect("/login?error=account");
  const requiresPin=user.role!=="JUDGE"||user.judge_login_mode==="PICKER_PIN";
  if(requiresPin){
    const headerStore=await headers(); const ip=(headerStore.get("x-forwarded-for")??headerStore.get("x-real-ip")??"local").split(",")[0].trim();
    const attemptKey=createHash("sha256").update(`${ip}|${contestId}|${userId}`).digest("hex");
    const recent=(await query<{count:number}>("SELECT COUNT(*)::int AS count FROM auth_attempts WHERE attempt_key=$1 AND succeeded=FALSE AND attempted_at>NOW()-INTERVAL '15 minutes'",[attemptKey]))[0]?.count??0;
    if(Number(recent)>=5)redirect("/login?error=locked");
    const valid=Boolean(parsed.data.pin&&user.pin_hash&&await compare(parsed.data.pin,user.pin_hash));
    await query("INSERT INTO auth_attempts (id,attempt_key,succeeded) VALUES ($1,$2,$3)",[crypto.randomUUID(),attemptKey,valid]);
    if(!valid)redirect("/login?error=pin");
  }

  await setSession({ id: user.id, name: user.name, role: user.role, contestId });
  redirect(user.role === "JUDGE" ? "/judge" : "/admin");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function switchToAdminAction() {
  const contestId = "contest-demo";
  const admins = await query<{ id: string; name: string; role: Role; status: string }>(
    `SELECT u.id, u.name, u.role, u.status
     FROM users u
     JOIN contest_judges cj ON cj.user_id = u.id
     WHERE cj.contest_id = $1 AND u.status = 'ACTIVE' AND cj.status = 'ACTIVE' AND u.role IN ('ADMIN', 'SUPER_ADMIN')
     ORDER BY cj.display_order, u.name
     LIMIT 1`,
    [contestId],
  );
  if (admins[0]) {
    await setSession({ id: admins[0].id, name: admins[0].name, role: admins[0].role, contestId });
    redirect("/admin");
  } else {
    await clearSession();
    redirect("/login?tab=admin");
  }
}

export async function switchToJudgeAction() {
  const contestId = "contest-demo";
  const judges = await query<{ id: string; name: string; role: Role; status: string }>(
    `SELECT u.id, u.name, u.role, u.status
     FROM users u
     JOIN contest_judges cj ON cj.user_id = u.id
     WHERE cj.contest_id = $1 AND u.status = 'ACTIVE' AND cj.status = 'ACTIVE' AND u.role = 'JUDGE'
     ORDER BY cj.display_order, u.name
     LIMIT 1`,
    [contestId],
  );
  if (judges[0]) {
    await setSession({ id: judges[0].id, name: judges[0].name, role: judges[0].role, contestId });
    redirect("/judge");
  } else {
    await clearSession();
    redirect("/login");
  }
}

