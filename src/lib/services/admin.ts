import { query } from "@/lib/db";
import type { AggregationMethod, Contest } from "@/lib/db/types";

export async function getAdminDashboard(contestId: string) {
  const [contestRows, submissionStats, judgeRows, activity] = await Promise.all([
    query<Contest>("SELECT * FROM contests WHERE id=$1", [contestId]),
    query<{ total: number; active: number; disqualified: number }>(`SELECT COUNT(*)::int AS total,COUNT(*) FILTER (WHERE status='ACTIVE')::int AS active,COUNT(*) FILTER (WHERE status='DISQUALIFIED')::int AS disqualified FROM submissions WHERE contest_id=$1`, [contestId]),
    getJudgeProgress(contestId),
    query<{ action_type: string; entity_type: string; created_at: string; actor_name: string | null }>(`SELECT a.action_type,a.entity_type,a.created_at,u.name AS actor_name FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_user_id WHERE a.contest_id=$1 ORDER BY a.created_at DESC LIMIT 8`, [contestId]),
  ]);
  const judges = judgeRows;
  const completedScores = judges.reduce((sum, judge) => sum + Number(judge.completed_submissions), 0);
  const totalAssignments = judges.reduce((sum, judge) => sum + Number(judge.total_submissions), 0);
  return { contest: contestRows[0], submissions: submissionStats[0], judges, activity, completedScores, totalAssignments, progress: totalAssignments ? (completedScores / totalAssignments) * 100 : 0 };
}

export async function getJudgeProgress(contestId: string) {
  return query<{ id: string; name: string; status: string; required: boolean; avatar_color: string; avatar_url: string | null; total_submissions: number; completed_submissions: number; flagged: number }>(
    `SELECT u.id,u.name,cj.status,cj.required,u.avatar_color,u.avatar_url,
      COUNT(DISTINCT o.submission_id)::int AS total_submissions,
      COUNT(DISTINCT CASE WHEN score_counts.score_count=criteria_counts.criteria_count THEN o.submission_id END)::int AS completed_submissions,
      COUNT(DISTINCT CASE WHEN o.flagged THEN o.submission_id END)::int AS flagged
     FROM contest_judges cj JOIN users u ON u.id=cj.user_id
     LEFT JOIN judge_submission_order o ON o.contest_id=cj.contest_id AND o.judge_id=u.id
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS score_count FROM scores s WHERE s.submission_id=o.submission_id AND s.judge_id=u.id AND s.is_active=TRUE AND s.criteria_version_id=(SELECT active_criteria_version_id FROM contests WHERE id=$1)
     ) score_counts ON TRUE
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS criteria_count FROM criteria c WHERE c.criteria_version_id=(SELECT active_criteria_version_id FROM contests WHERE id=$1) AND c.enabled=TRUE
     ) criteria_counts ON TRUE
     WHERE cj.contest_id=$1 AND u.role='JUDGE'
     GROUP BY u.id,u.name,cj.status,cj.required,u.avatar_color,u.avatar_url,cj.display_order ORDER BY cj.display_order`,
    [contestId],
  );
}

export async function getSubmissionAdminRows(contestId: string) {
  return query<{ id: string; submission_number: string; artwork_title: string; display_name: string; player_id: string; image_url: string; thumbnail_url: string | null; source_image_url: string | null; status: string; category_id: string | null; category_name: string | null; category_color: string | null; category_icon: string | null; completed_judges: number; assigned_judges: number; average: number | null }>(
    `WITH judge_totals AS (
      SELECT s.submission_id,s.judge_id,SUM(s.score)::float8 AS total,COUNT(*)::int AS score_count
      FROM scores s JOIN contest_judges cj ON cj.contest_id=s.contest_id AND cj.user_id=s.judge_id
      WHERE s.contest_id=$1 AND s.is_active=TRUE AND cj.status='ACTIVE' AND cj.required=TRUE
      AND s.criteria_version_id=(SELECT active_criteria_version_id FROM contests WHERE id=$1)
      GROUP BY s.submission_id,s.judge_id
    ), criterion_count AS (
      SELECT COUNT(*)::int AS count FROM criteria WHERE criteria_version_id=(SELECT active_criteria_version_id FROM contests WHERE id=$1) AND enabled=TRUE
    ), judge_count AS (
      SELECT COUNT(*)::int AS count FROM contest_judges cj JOIN users u ON u.id=cj.user_id WHERE cj.contest_id=$1 AND cj.status='ACTIVE' AND cj.required=TRUE AND u.role='JUDGE'
    )
    SELECT sub.id,sub.submission_number,sub.artwork_title,sub.display_name,sub.player_id,sub.image_url,sub.thumbnail_url,sub.source_image_url,sub.status,
      sub.category_id,cat.name AS category_name,cat.color AS category_color,cat.icon AS category_icon,
      COUNT(jt.judge_id) FILTER (WHERE jt.score_count=(SELECT count FROM criterion_count))::int AS completed_judges,
      (SELECT count FROM judge_count) AS assigned_judges,
      AVG(jt.total) FILTER (WHERE jt.score_count=(SELECT count FROM criterion_count))::float8 AS average
    FROM submissions sub LEFT JOIN judge_totals jt ON jt.submission_id=sub.id LEFT JOIN submission_categories cat ON cat.id=sub.category_id
    WHERE sub.contest_id=$1 GROUP BY sub.id,cat.id ORDER BY sub.display_order,sub.submission_number`,
    [contestId],
  );
}

type JudgeTotal = { submission_id: string; judge_id: string; total: number; criterion_count: number };
export type RankingRow = {
  rank: number | null;
  submission_id: string;
  submission_number: string;
  artwork_title: string;
  display_name: string;
  status: string;
  image_url: string;
  thumbnail_url: string | null;
  judgeCount: number;
  requiredJudges: number;
  complete: boolean;
  total: number;
  average: number;
  aggregate: number;
  tied: boolean;
  tieBreakerValue: number;
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  categoryOrder: number;
};

function aggregate(values: number[], method: AggregationMethod) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  if (method === "AVERAGE") return values.reduce((a, b) => a + b, 0) / values.length;
  if (method === "MEDIAN") return sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  if (method === "DROP_HIGHEST_LOWEST") {
    const kept = sorted.length > 2 ? sorted.slice(1, -1) : sorted;
    return kept.reduce((a, b) => a + b, 0) / kept.length;
  }
  return values.reduce((a, b) => a + b, 0);
}

export async function getRanking(contestId: string): Promise<{ contest: Contest; rows: RankingRow[] }> {
  const [contestRows, submissions, totals, requiredRows] = await Promise.all([
    query<Contest>("SELECT * FROM contests WHERE id=$1", [contestId]),
    query<{ id: string; submission_number: string; artwork_title: string; display_name: string; status: string; image_url: string; thumbnail_url: string | null; category_id: string | null; category_name: string | null; category_color: string | null; category_icon: string | null; category_order: number | null }>(`SELECT sub.id,sub.submission_number,sub.artwork_title,sub.display_name,sub.status,sub.image_url,sub.thumbnail_url,sub.category_id,cat.name AS category_name,cat.color AS category_color,cat.icon AS category_icon,cat.display_order AS category_order FROM submissions sub LEFT JOIN submission_categories cat ON cat.id=sub.category_id WHERE sub.contest_id=$1 AND sub.status NOT IN ('HIDDEN','ARCHIVED') ORDER BY COALESCE(cat.display_order,999999),sub.display_order`, [contestId]),
    query<JudgeTotal>(`SELECT s.submission_id,s.judge_id,SUM(s.score)::float8 AS total,COUNT(*)::int AS criterion_count
      FROM scores s JOIN contest_judges cj ON cj.contest_id=s.contest_id AND cj.user_id=s.judge_id
      WHERE s.contest_id=$1 AND s.is_active=TRUE AND cj.status='ACTIVE' AND cj.required=TRUE
      AND s.criteria_version_id=(SELECT active_criteria_version_id FROM contests WHERE id=$1)
      GROUP BY s.submission_id,s.judge_id`, [contestId]),
    query<{ required: number }>(`SELECT COUNT(*)::int AS required FROM contest_judges cj JOIN users u ON u.id=cj.user_id WHERE cj.contest_id=$1 AND cj.status='ACTIVE' AND cj.required=TRUE AND u.role='JUDGE'`, [contestId]),
  ]);
  const contest = contestRows[0];
  const criteriaCountRows = await query<{ count: number }>("SELECT COUNT(*)::int AS count FROM criteria WHERE criteria_version_id=$1 AND enabled=TRUE", [contest.active_criteria_version_id]);
  const criteriaCount = Number(criteriaCountRows[0]?.count ?? 0);
  const requiredJudges = contest.required_judges ?? Number(requiredRows[0]?.required ?? 0);
  const tieCriterionId=contest.tie_breaker.startsWith("CRITERION:")?contest.tie_breaker.slice("CRITERION:".length):null;
  const tieRows=tieCriterionId?await query<{submission_id:string;value:number}>(`SELECT s.submission_id,SUM(s.score)::float8 AS value FROM scores s JOIN contest_judges cj ON cj.contest_id=s.contest_id AND cj.user_id=s.judge_id WHERE s.contest_id=$1 AND s.criterion_id=$2 AND s.is_active=TRUE AND cj.status='ACTIVE' AND cj.required=TRUE GROUP BY s.submission_id`,[contestId,tieCriterionId]):[];
  const tieMap=new Map(tieRows.map(row=>[row.submission_id,Number(row.value)]));
  const unranked = submissions.map((submission) => {
    const completeTotals = totals.filter((row) => row.submission_id === submission.id && Number(row.criterion_count) === criteriaCount).map((row) => Number(row.total));
    const total = completeTotals.reduce((a, b) => a + b, 0);
    const average = completeTotals.length ? total / completeTotals.length : 0;
    return { rank: null, submission_id: submission.id, submission_number: submission.submission_number, artwork_title: submission.artwork_title, display_name: submission.display_name, status: submission.status, image_url: submission.image_url, thumbnail_url: submission.thumbnail_url, judgeCount: completeTotals.length, requiredJudges, complete: requiredJudges > 0 && completeTotals.length >= requiredJudges, total, average, aggregate: aggregate(completeTotals, contest.aggregation_method), tied: false, tieBreakerValue:tieMap.get(submission.id)??0, categoryId:submission.category_id, categoryName:submission.category_name??"ยังไม่จัดหมวด", categoryColor:submission.category_color??"#64748B", categoryIcon:submission.category_icon??"🗂️", categoryOrder:Number(submission.category_order??999999) } satisfies RankingRow;
  }).sort((a, b) => a.categoryOrder-b.categoryOrder || a.categoryName.localeCompare(b.categoryName,"th") || Number(b.complete) - Number(a.complete) || b.aggregate - a.aggregate || (tieCriterionId?b.tieBreakerValue-a.tieBreakerValue:0) || a.submission_number.localeCompare(b.submission_number));
  const byCategory = new Map<string, RankingRow[]>();
  for (const row of unranked) { const key=row.categoryId??"uncategorized"; byCategory.set(key,[...(byCategory.get(key)??[]),row]); }
  const ranked: RankingRow[]=[];
  for(const categoryRows of byCategory.values()){
    let previous: {aggregate:number;tieBreakerValue:number}|null = null; let previousRank=0;
    categoryRows.forEach((row,index)=>{const sameAsPrevious=previous!==null&&Math.abs(previous.aggregate-row.aggregate)<0.000001&&(!tieCriterionId||Math.abs(previous.tieBreakerValue-row.tieBreakerValue)<0.000001);const rank=row.complete?(sameAsPrevious?previousRank:index+1):null;if(row.complete&&!sameAsPrevious){previous={aggregate:row.aggregate,tieBreakerValue:row.tieBreakerValue};previousRank=rank!;}ranked.push({...row,rank,tied:row.complete&&categoryRows.filter(candidate=>candidate.complete&&Math.abs(candidate.aggregate-row.aggregate)<0.000001&&(!tieCriterionId||Math.abs(candidate.tieBreakerValue-row.tieBreakerValue)<0.000001)).length>1});});
  }
  return { contest, rows: ranked };
}

export async function getSubmissionCategories(contestId: string, includeInactive = false) {
  return query<{ id: string; name: string; slug: string; description: string; color: string; icon: string; display_order: number; active: boolean; submission_count: number }>(
    `SELECT cat.id,cat.name,cat.slug,cat.description,cat.color,cat.icon,cat.display_order,cat.active,COUNT(sub.id)::int AS submission_count
     FROM submission_categories cat LEFT JOIN submissions sub ON sub.category_id=cat.id AND sub.status<>'ARCHIVED'
     WHERE cat.contest_id=$1 ${includeInactive ? "" : "AND cat.active=TRUE"}
     GROUP BY cat.id ORDER BY cat.display_order,cat.name`, [contestId],
  );
}

export async function getAuditLogs(contestId: string) {
  return query<{ id: string; action_type: string; entity_type: string; entity_id: string; before_data: unknown; after_data: unknown; created_at: string; actor_name: string | null }>(`SELECT a.*,u.name AS actor_name FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_user_id WHERE a.contest_id=$1 ORDER BY a.created_at DESC LIMIT 200`, [contestId]);
}

export async function getCriteriaVersions(contestId: string) {
  return query<{ id: string; version_number: number; status: string; total_max: number; created_at: string; score_count: number }>(`SELECT cv.id,cv.version_number,cv.status,cv.total_max::float8 AS total_max,cv.created_at,COUNT(s.id)::int AS score_count FROM criteria_versions cv JOIN criteria_sets cs ON cs.id=cv.criteria_set_id LEFT JOIN scores s ON s.criteria_version_id=cv.id AND s.is_active=TRUE WHERE cs.contest_id=$1 GROUP BY cv.id ORDER BY cv.version_number DESC`, [contestId]);
}

export async function getSubmissionScoreDetail(contestId: string, submissionId: string) {
  const [contestRows, submissionRows, criteria, judges, scores, revisions] = await Promise.all([
    query<Contest>("SELECT * FROM contests WHERE id=$1", [contestId]),
    query<{ id: string; submission_number: string; artwork_title: string; display_name: string; player_id: string; image_url: string; status: string; category_name: string | null; category_color: string | null; category_icon: string | null }>(
      "SELECT sub.id,sub.submission_number,sub.artwork_title,sub.display_name,sub.player_id,sub.image_url,sub.status,cat.name AS category_name,cat.color AS category_color,cat.icon AS category_icon FROM submissions sub LEFT JOIN submission_categories cat ON cat.id=sub.category_id WHERE sub.id=$1 AND sub.contest_id=$2",
      [submissionId, contestId],
    ),
    query<{ id: string; name: string; description: string; max_score: number; display_order: number }>(
      `SELECT c.id,c.name,c.description,c.max_score::float8 AS max_score,c.display_order
       FROM criteria c JOIN contests ct ON ct.active_criteria_version_id=c.criteria_version_id
       WHERE ct.id=$1 AND c.enabled=TRUE ORDER BY c.display_order`,
      [contestId],
    ),
    query<{ id: string; name: string; status: string; required: boolean; display_order: number }>(
      `SELECT u.id,u.name,cj.status,cj.required,cj.display_order FROM contest_judges cj
       JOIN users u ON u.id=cj.user_id
       WHERE cj.contest_id=$1 AND u.role='JUDGE' ORDER BY cj.display_order`,
      [contestId],
    ),
    query<{ id: string; judge_id: string; criterion_id: string; score: number; comment: string; version: number; updated_at: string }>(
      `SELECT s.id,s.judge_id,s.criterion_id,s.score::float8 AS score,s.comment,s.version,s.updated_at
       FROM scores s JOIN contests ct ON ct.id=s.contest_id
       WHERE s.contest_id=$1 AND s.submission_id=$2 AND s.criteria_version_id=ct.active_criteria_version_id AND s.is_active=TRUE`,
      [contestId, submissionId],
    ),
    query<{ id: string; score_id: string; previous_score: number | null; new_score: number; change_reason: string | null; changed_at: string; changed_by_name: string }>(
      `SELECT sr.id,sr.score_id,sr.previous_score::float8 AS previous_score,sr.new_score::float8 AS new_score,
        sr.change_reason,sr.changed_at,u.name AS changed_by_name
       FROM score_revisions sr JOIN scores s ON s.id=sr.score_id JOIN users u ON u.id=sr.changed_by
       WHERE s.contest_id=$1 AND s.submission_id=$2 ORDER BY sr.changed_at DESC LIMIT 100`,
      [contestId, submissionId],
    ),
  ]);
  const contest = contestRows[0];
  const submission = submissionRows[0];
  if (!contest || !submission) return null;
  return { contest, submission, criteria, judges, scores, revisions };
}

export async function getContestAnalytics(contestId: string) {
  const [criteria, editRows, flagRows] = await Promise.all([
    query<{ id: string; name: string; max_score: number; average: number | null; minimum: number | null; maximum: number | null; score_count: number }>(
      `SELECT c.id,c.name,c.max_score::float8 AS max_score,AVG(s.score)::float8 AS average,
       MIN(s.score)::float8 AS minimum,MAX(s.score)::float8 AS maximum,COUNT(s.id)::int AS score_count
       FROM criteria c LEFT JOIN scores s ON s.criterion_id=c.id AND s.is_active=TRUE
       WHERE c.criteria_version_id=(SELECT active_criteria_version_id FROM contests WHERE id=$1) AND c.enabled=TRUE
       GROUP BY c.id ORDER BY c.display_order`,
      [contestId],
    ),
    query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM score_revisions sr JOIN scores s ON s.id=sr.score_id WHERE s.contest_id=$1`, [contestId]),
    query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM judge_submission_order WHERE contest_id=$1 AND flagged=TRUE`, [contestId]),
  ]);
  const ranking = await getRanking(contestId);
  const completed = ranking.rows.filter((row) => row.complete);
  const average = completed.length ? completed.reduce((sum, row) => sum + row.average, 0) / completed.length : 0;
  return { criteria, scoreEdits: Number(editRows[0]?.count ?? 0), flags: Number(flagRows[0]?.count ?? 0), completed: completed.length, incomplete: ranking.rows.length - completed.length, average };
}

export async function getAdminContests(userId: string) {
  return query<{ id: string; name: string; internal_name: string; description: string; status: string; created_at: string; submissions: number; judges: number }>(
    `SELECT c.id,c.name,c.internal_name,c.description,c.status,c.created_at,
      COUNT(DISTINCT s.id)::int AS submissions,
      COUNT(DISTINCT cj2.user_id) FILTER (WHERE u2.role='JUDGE' AND cj2.status='ACTIVE')::int AS judges
     FROM contests c JOIN contest_judges access ON access.contest_id=c.id AND access.user_id=$1
     LEFT JOIN submissions s ON s.contest_id=c.id
     LEFT JOIN contest_judges cj2 ON cj2.contest_id=c.id
     LEFT JOIN users u2 ON u2.id=cj2.user_id
     GROUP BY c.id ORDER BY c.created_at DESC`,
    [userId],
  );
}

export type AdminJudgeTopPickRow = {
  judge_id: string;
  judge_name: string;
  avatar_url: string | null;
  avatar_color: string;
  submission_id: string;
  submission_number: string;
  artwork_title: string;
  image_url: string;
  thumbnail_url: string | null;
  category_name: string | null;
  category_icon: string | null;
  rank_order: number;
  note: string;
};

export async function getAllJudgeTopPicks(contestId: string): Promise<AdminJudgeTopPickRow[]> {
  return query<AdminJudgeTopPickRow>(
    `SELECT u.id AS judge_id, u.name AS judge_name, u.avatar_url, u.avatar_color,
            s.id AS submission_id, s.submission_number, s.artwork_title, s.image_url, s.thumbnail_url,
            cat.name AS category_name, cat.icon AS category_icon,
            p.rank_order, p.note
     FROM judge_top_picks p
     JOIN users u ON u.id = p.judge_id
     JOIN submissions s ON s.id = p.submission_id
     LEFT JOIN submission_categories cat ON cat.id = s.category_id
     WHERE p.contest_id = $1
     ORDER BY u.name ASC, p.rank_order ASC`,
    [contestId]
  );
}
