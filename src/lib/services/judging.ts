import { getDb, query, type Queryable } from "@/lib/db";
import type { Contest, Criterion, Submission } from "@/lib/db/types";

export type QueueItem = Submission & {
  position: number;
  flagged: boolean;
  score_count: number;
  criterion_count: number;
  complete: boolean;
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
  category_slug?: string | null;
  my_total_score?: number;
  top_pick_rank?: number | null;
  top_pick_note?: string | null;
};

export async function getContest(contestId: string) {
  const contests = await query<Contest>("SELECT * FROM contests WHERE id=$1", [contestId]);
  return contests[0] ?? null;
}

export async function getCriteria(criteriaVersionId: string) {
  const rows = await query<Criterion>(
    "SELECT id,criteria_version_id,name,description,max_score::float8 AS max_score,display_order,enabled FROM criteria WHERE criteria_version_id=$1 AND enabled=TRUE ORDER BY display_order",
    [criteriaVersionId],
  );
  return rows;
}

export type CategoryPill = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  count: number;
};

export async function getJudgeQueue(contestId: string, judgeId: string, categoryId?: string): Promise<QueueItem[]> {
  const isSpecificCat = categoryId && categoryId !== "all";
  const rows = await query<QueueItem>(
    `SELECT s.*,o.position,o.flagged,
       cat.name AS category_name,cat.color AS category_color,cat.icon AS category_icon,cat.slug AS category_slug,
       COUNT(sc.id)::int AS score_count,
       COALESCE(SUM(sc.score)::float8, 0) AS my_total_score,
       (SELECT COUNT(*)::int FROM criteria c WHERE c.criteria_version_id=ct.active_criteria_version_id AND c.enabled=TRUE) AS criterion_count,
       p.rank_order AS top_pick_rank,
       p.note AS top_pick_note
     FROM judge_submission_order o
     JOIN submissions s ON s.id=o.submission_id
     JOIN contests ct ON ct.id=o.contest_id
     LEFT JOIN submission_categories cat ON cat.id=s.category_id
     LEFT JOIN scores sc ON sc.submission_id=s.id AND sc.judge_id=$2 AND sc.criteria_version_id=ct.active_criteria_version_id AND sc.is_active=TRUE
     LEFT JOIN judge_top_picks p ON p.submission_id=s.id AND p.judge_id=$2 AND p.contest_id=$1
     WHERE o.contest_id=$1 AND o.judge_id=$2 AND s.status='ACTIVE'
     ${isSpecificCat ? "AND (cat.id = $3 OR cat.slug = $3)" : ""}
     GROUP BY s.id,o.position,o.flagged,ct.active_criteria_version_id,cat.id,p.rank_order,p.note
     ORDER BY o.position`,
    isSpecificCat ? [contestId, judgeId, categoryId] : [contestId, judgeId],
  );
  return rows.map((row) => ({
    ...row,
    position: Number(row.position),
    score_count: Number(row.score_count),
    criterion_count: Number(row.criterion_count),
    complete: Number(row.score_count) === Number(row.criterion_count),
    my_total_score: Number(row.my_total_score ?? 0),
    top_pick_rank: row.top_pick_rank != null ? Number(row.top_pick_rank) : null,
  }));
}

export async function getJudgeCategoryStats(contestId: string, judgeId: string): Promise<CategoryPill[]> {
  const cats = await query<{ id: string; name: string; slug: string; icon: string | null; color: string | null; count: number }>(
    `SELECT cat.id, cat.name, cat.slug, cat.icon, cat.color, COUNT(s.id)::int AS count
     FROM submission_categories cat
     JOIN submissions s ON s.category_id = cat.id AND s.status = 'ACTIVE'
     JOIN judge_submission_order o ON o.submission_id = s.id AND o.judge_id = $2 AND o.contest_id = $1
     WHERE cat.contest_id = $1 AND cat.active = TRUE
     GROUP BY cat.id, cat.name, cat.slug, cat.icon, cat.color, cat.display_order
     ORDER BY cat.display_order`,
    [contestId, judgeId],
  );
  const totalCount = cats.reduce((sum, c) => sum + Number(c.count), 0);
  return [
    {
      id: "all",
      name: "ทุกสนาม",
      slug: "all",
      icon: "🏁",
      color: "#0f172a",
      count: totalCount,
    },
    ...cats.map((c) => ({ ...c, count: Number(c.count) })),
  ];
}

export async function getJudgeWorkspace(contestId: string, judgeId: string, requestedId?: string, categoryId?: string) {
  const [contest, categories] = await Promise.all([
    getContest(contestId),
    getJudgeCategoryStats(contestId, judgeId),
  ]);
  if (!contest) return null;

  const activeCategory = categoryId && categoryId !== "all"
    ? categories.find((c) => c.id === categoryId || c.slug === categoryId) ?? categories[0]
    : categories[0];
  const activeCategoryId = activeCategory.id === "all" ? null : activeCategory.id;

  const queue = await getJudgeQueue(contestId, judgeId, activeCategoryId ?? undefined);
  const criteria = await getCriteria(contest.active_criteria_version_id);
  const current = queue.find((item) => item.id === requestedId) ?? queue.find((item) => !item.complete) ?? queue[0] ?? null;

  if (!current) {
    return {
      contest,
      criteria,
      queue,
      current: null,
      scoreRows: [],
      categories,
      activeCategoryId,
    };
  }

  const scoreRows = await query<{ criterion_id: string; score: number; comment: string; version: number }>(
    "SELECT criterion_id,score::float8 AS score,comment,version FROM scores WHERE contest_id=$1 AND submission_id=$2 AND judge_id=$3 AND criteria_version_id=$4 AND is_active=TRUE",
    [contestId, current.id, judgeId, contest.active_criteria_version_id],
  );
  return { contest, criteria, queue, current, scoreRows, categories, activeCategoryId };
}

export interface ScoreWrite {
  contestId: string;
  submissionId: string;
  judgeId: string;
  criteriaVersionId: string;
  scores: { criterionId: string; score: number; expectedVersion?: number }[];
  comment?: string;
  actorId: string;
  reason?: string;
}

export async function saveCriterionScores(input: ScoreWrite) {
  const database = await getDb();
  return database.transaction(async (tx) => {
    const contestRows = await tx.query<Contest>("SELECT * FROM contests WHERE id=$1 FOR UPDATE", [input.contestId]);
    const contest = contestRows[0];
    if (!contest) throw new Error("CONTEST_NOT_FOUND");
    if (contest.results_locked_at) throw new Error("RESULTS_LOCKED");
    if (input.actorId === input.judgeId && contest.status !== "JUDGING") throw new Error("JUDGING_NOT_OPEN");
    if (contest.active_criteria_version_id !== input.criteriaVersionId) throw new Error("CRITERIA_VERSION_CHANGED");
    if (contest.comment_mode === "REQUIRED" && !input.comment?.trim()) throw new Error("COMMENT_REQUIRED");

    const membership = await tx.query<{ exists: boolean }>(
      `SELECT EXISTS(
        SELECT 1 FROM contest_judges cj JOIN submissions s ON s.contest_id=cj.contest_id
        WHERE cj.contest_id=$1 AND cj.user_id=$2 AND cj.status='ACTIVE' AND s.id=$3 AND s.status='ACTIVE'
      ) AS exists`,
      [input.contestId, input.judgeId, input.submissionId],
    );
    if (!membership[0]?.exists) throw new Error("NOT_ELIGIBLE");

    const criteria = await tx.query<{ id: string; max_score: number }>(
      "SELECT id,max_score::float8 AS max_score FROM criteria WHERE criteria_version_id=$1 AND enabled=TRUE ORDER BY display_order",
      [input.criteriaVersionId],
    );
    const criteriaMap = new Map(criteria.map((item) => [item.id, Number(item.max_score)]));
    const submittedIds = new Set(input.scores.map((item) => item.criterionId));
    if (input.scores.length !== criteria.length || submittedIds.size !== criteria.length || criteria.some((criterion) => !submittedIds.has(criterion.id))) throw new Error("INCOMPLETE_SCORES");
    for (const item of input.scores) {
      const max = criteriaMap.get(item.criterionId);
      if (max === undefined || !Number.isFinite(item.score) || item.score < 0 || item.score > max) throw new Error("INVALID_SCORE");
    }

    const changed: { criterionId: string; score: number; version: number }[] = [];
    for (const item of input.scores) {
      const existing = (await tx.query<{ id: string; score: number; version: number; comment: string }>(
        "SELECT id,score::float8 AS score,version,comment FROM scores WHERE submission_id=$1 AND judge_id=$2 AND criterion_id=$3 AND criteria_version_id=$4 AND is_active=TRUE FOR UPDATE",
        [input.submissionId, input.judgeId, item.criterionId, input.criteriaVersionId],
      ))[0];
      const nextComment = input.comment?.trim() ?? "";
      if (existing) {
        if (input.actorId === input.judgeId && item.expectedVersion === undefined) throw new Error("SCORE_CONFLICT");
        if (item.expectedVersion !== undefined && Number(existing.version) !== item.expectedVersion) throw new Error("SCORE_CONFLICT");
        if (Number(existing.score) !== item.score || existing.comment !== nextComment) {
          if (input.actorId === input.judgeId && !contest.allow_judge_editing) throw new Error("JUDGE_EDITING_DISABLED");
          const nextVersion = Number(existing.version) + 1;
          await tx.query("UPDATE scores SET score=$1,comment=$2,version=$3,updated_at=NOW() WHERE id=$4", [item.score, nextComment, nextVersion, existing.id]);
          await tx.query(
            "INSERT INTO score_revisions (id,score_id,previous_score,new_score,changed_by,change_reason) VALUES ($1,$2,$3,$4,$5,$6)",
            [crypto.randomUUID(), existing.id, existing.score, item.score, input.actorId, input.reason ?? null],
          );
          await writeAudit(tx, input.contestId, input.actorId, "SCORE_UPDATED", "score", existing.id, { score: existing.score, version: existing.version }, { score: item.score, version: nextVersion });
          changed.push({ criterionId: item.criterionId, score: item.score, version: nextVersion });
        } else {
          changed.push({ criterionId: item.criterionId, score: item.score, version: Number(existing.version) });
        }
      } else {
        const id = crypto.randomUUID();
        await tx.query(
          `INSERT INTO scores (id,contest_id,submission_id,judge_id,criterion_id,criteria_version_id,score,comment)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [id, input.contestId, input.submissionId, input.judgeId, item.criterionId, input.criteriaVersionId, item.score, nextComment],
        );
        await writeAudit(tx, input.contestId, input.actorId, "SCORE_CREATED", "score", id, null, { score: item.score, criterionId: item.criterionId });
        changed.push({ criterionId: item.criterionId, score: item.score, version: 1 });
      }
    }
    return { savedAt: new Date().toISOString(), versions: changed };
  });
}

export async function setJudgeFlag(contestId: string, judgeId: string, submissionId: string, flagged: boolean) {
  const rows = await query<{ id: string }>("UPDATE judge_submission_order SET flagged=$1 WHERE contest_id=$2 AND judge_id=$3 AND submission_id=$4 RETURNING id", [flagged, contestId, judgeId, submissionId]);
  if (!rows[0]) throw new Error("ORDER_NOT_FOUND");
  return { flagged };
}

async function writeAudit(tx: Queryable, contestId: string, actorId: string, action: string, entityType: string, entityId: string, before: unknown, after: unknown) {
  await tx.query(
    "INSERT INTO audit_logs (id,contest_id,actor_user_id,action_type,entity_type,entity_id,before_data,after_data) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb)",
    [crypto.randomUUID(), contestId, actorId, action, entityType, entityId, before === null ? null : JSON.stringify(before), after === null ? null : JSON.stringify(after)],
  );
}

export type JudgeTopPickItem = {
  id: string;
  submission_id: string;
  rank_order: number;
  note: string;
  submission_number: string;
  artwork_title: string;
  image_url: string;
  thumbnail_url: string | null;
  category_name: string | null;
  my_total_score: number;
};

export async function getJudgeTopPicks(contestId: string, judgeId: string): Promise<JudgeTopPickItem[]> {
  const rows = await query<JudgeTopPickItem>(
    `SELECT p.id, p.submission_id, p.rank_order, p.note,
            s.submission_number, s.artwork_title, s.image_url, s.thumbnail_url,
            cat.name AS category_name,
            COALESCE((SELECT SUM(sc.score)::float8 FROM scores sc WHERE sc.submission_id=s.id AND sc.judge_id=$2 AND sc.is_active=TRUE), 0) AS my_total_score
     FROM judge_top_picks p
     JOIN submissions s ON s.id=p.submission_id
     LEFT JOIN submission_categories cat ON cat.id=s.category_id
     WHERE p.contest_id=$1 AND p.judge_id=$2
     ORDER BY p.rank_order ASC`,
    [contestId, judgeId]
  );
  return rows.map((r) => ({
    ...r,
    rank_order: Number(r.rank_order),
    my_total_score: Number(r.my_total_score ?? 0),
  }));
}

export async function saveJudgeTopPicks(
  contestId: string,
  judgeId: string,
  picks: { submissionId: string; rankOrder: number; note?: string }[]
) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const contest = (await tx.query<{ results_locked_at: string | null }>("SELECT results_locked_at FROM contests WHERE id=$1", [contestId]))[0];
    if (contest?.results_locked_at) throw new Error("RESULTS_LOCKED");

    const existing = await tx.query<{ submission_id: string; rank_order: number }>(
      "SELECT submission_id, rank_order FROM judge_top_picks WHERE contest_id=$1 AND judge_id=$2 ORDER BY rank_order",
      [contestId, judgeId]
    );

    await tx.query("DELETE FROM judge_top_picks WHERE contest_id=$1 AND judge_id=$2", [contestId, judgeId]);

    for (const item of picks) {
      await tx.query(
        `INSERT INTO judge_top_picks (id, contest_id, judge_id, submission_id, rank_order, note)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [crypto.randomUUID(), contestId, judgeId, item.submissionId, item.rankOrder, item.note ?? ""]
      );
    }

    await writeAudit(
      tx,
      contestId,
      judgeId,
      "JUDGE_TOP_PICKS_SAVED",
      "judge_top_picks",
      judgeId,
      existing,
      picks
    );

    return { success: true, count: picks.length };
  });
}

