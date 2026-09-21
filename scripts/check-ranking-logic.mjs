import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

async function main() {
  const db = new PGlite(path.join(process.cwd(), "data", "pglite"));
  const contestId = "contest-demo";

  const contestRows = await db.query("SELECT * FROM contests WHERE id=$1", [contestId]);
  const contest = contestRows.rows[0];

  const totals = await db.query(`
    SELECT s.submission_id,s.judge_id,SUM(s.score)::float8 AS total,COUNT(*)::int AS criterion_count
    FROM scores s JOIN contest_judges cj ON cj.contest_id=s.contest_id AND cj.user_id=s.judge_id
    WHERE s.contest_id=$1 AND s.is_active=TRUE AND cj.status='ACTIVE' AND cj.required=TRUE
    AND s.criteria_version_id=(SELECT active_criteria_version_id FROM contests WHERE id=$1)
    GROUP BY s.submission_id,s.judge_id
  `, [contestId]);

  const requiredRows = await db.query(`
    SELECT COUNT(*)::int AS required FROM contest_judges cj JOIN users u ON u.id=cj.user_id
    WHERE cj.contest_id=$1 AND cj.status='ACTIVE' AND cj.required=TRUE AND u.role='JUDGE'
  `, [contestId]);

  const criteriaCountRows = await db.query("SELECT COUNT(*)::int AS count FROM criteria WHERE criteria_version_id=$1 AND enabled=TRUE", [contest.active_criteria_version_id]);
  const criteriaCount = Number(criteriaCountRows.rows[0]?.count ?? 0);

  const requiredJudges = contest.required_judges ?? Number(requiredRows.rows[0]?.required ?? 0);

  console.log("criteriaCount:", criteriaCount);
  console.log("requiredJudges:", requiredJudges);
  console.log("Totals count:", totals.rows.length);

  for (const subId of ["submission-001", "submission-002", "submission-003"]) {
    const completeTotals = totals.rows.filter((row) => row.submission_id === subId && Number(row.criterion_count) === criteriaCount).map((row) => Number(row.total));
    const isComplete = requiredJudges > 0 && completeTotals.length >= requiredJudges;
    console.log(`Sub ${subId}: completeTotals=${completeTotals.length}, required=${requiredJudges}, isComplete=${isComplete}`);
  }

  await db.close();
  process.exit(0);
}

main().catch(console.error);
