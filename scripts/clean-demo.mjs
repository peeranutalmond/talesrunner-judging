import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

async function main() {
  const db = new PGlite(path.join(process.cwd(), "data", "pglite"));
  await db.query("UPDATE audit_logs SET actor_user_id = NULL WHERE actor_user_id IN ('judge-venus', 'judge-zelfur')");
  await db.query("DELETE FROM score_revisions WHERE changed_by IN ('judge-venus', 'judge-zelfur')");
  await db.query("UPDATE scores SET reset_by = NULL WHERE reset_by IN ('judge-venus', 'judge-zelfur')");
  await db.query("DELETE FROM scores WHERE judge_id IN ('judge-venus', 'judge-zelfur')");
  await db.query("DELETE FROM judging_sessions WHERE judge_id IN ('judge-venus', 'judge-zelfur')");
  await db.query("DELETE FROM judge_submission_order WHERE judge_id IN ('judge-venus', 'judge-zelfur')");
  await db.query("DELETE FROM contest_judges WHERE user_id IN ('judge-venus', 'judge-zelfur')");
  await db.query("DELETE FROM users WHERE id IN ('judge-venus', 'judge-zelfur')");
  const res = await db.query("SELECT id, name, role FROM users");
  console.log("Current DB Users:", res.rows);
  await db.close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
