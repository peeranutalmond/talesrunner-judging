import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

async function main() {
  const db = new PGlite(path.join(process.cwd(), "data", "pglite"));
  const contestId = "contest-demo";

  const contest = await db.query("SELECT * FROM contests WHERE id=$1", [contestId]);
  console.log("Contest active_criteria_version_id:", contest.rows[0].active_criteria_version_id);
  console.log("Contest required_judges:", contest.rows[0].required_judges);

  const criteria = await db.query("SELECT id FROM criteria WHERE criteria_version_id=$1 AND enabled=TRUE", [contest.rows[0].active_criteria_version_id]);
  console.log("Criteria count:", criteria.rows.length);

  const judges = await db.query("SELECT * FROM contest_judges WHERE contest_id=$1", [contestId]);
  console.log("Contest judges:", judges.rows);

  const scores = await db.query("SELECT * FROM scores WHERE contest_id=$1", [contestId]);
  console.log("Scores count:", scores.rows.length);
  if (scores.rows.length > 0) {
    console.log("Sample score row:", scores.rows[0]);
  }

  const totals = await db.query(`
    SELECT s.submission_id,s.judge_id,SUM(s.score)::float8 AS total,COUNT(*)::int AS criterion_count
    FROM scores s JOIN contest_judges cj ON cj.contest_id=s.contest_id AND cj.user_id=s.judge_id
    WHERE s.contest_id=$1 AND s.is_active=TRUE AND cj.status='ACTIVE' AND cj.required=TRUE
    AND s.criteria_version_id=(SELECT active_criteria_version_id FROM contests WHERE id=$1)
    GROUP BY s.submission_id,s.judge_id
  `, [contestId]);
  console.log("Totals rows:", totals.rows);

  await db.close();
  process.exit(0);
}

main().catch(console.error);
