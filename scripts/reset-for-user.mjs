import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

async function main() {
  const db = new PGlite(path.join(process.cwd(), "data", "pglite"));
  // Clear scores so user starts completely fresh at Artwork #001
  await db.query("DELETE FROM score_revisions");
  await db.query("DELETE FROM scores");
  await db.query("DELETE FROM judging_sessions");
  await db.query("UPDATE judge_submission_order SET flagged = FALSE");

  const subs = await db.query("SELECT COUNT(*)::int AS count FROM submissions WHERE status = 'ACTIVE'");
  const users = await db.query("SELECT id, name, role FROM users");

  console.log("Ready for user testing!");
  console.log(`Active submissions: ${subs.rows[0].count}`);
  console.log("Users available:", users.rows);

  await db.close();
  process.exit(0);
}

main().catch(console.error);
