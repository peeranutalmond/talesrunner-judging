import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { hash } from "bcryptjs";

async function main() {
  const db = new PGlite(path.join(process.cwd(), "data", "pglite"));
  const contestId = "contest-demo";
  const judgeId = "judge-chowon";
  const pinHash = await hash("1234", 10);
  const avatarUrl = "https://talesrunner.thehof.gg/asset/images/dt-crt-01.webp";

  // Check if judge exists
  const existing = await db.query("SELECT id FROM users WHERE id = $1", [judgeId]);
  if (existing.rows.length === 0) {
    await db.query(
      "INSERT INTO users (id, name, email, role, avatar_color, avatar_url, pin_hash) VALUES ($1, $2, $3, 'JUDGE', '#27B8FF', $4, $5)",
      [judgeId, "โชวอน (Chowon)", "chowon@talesrunner.local", avatarUrl, pinHash]
    );
    await db.query(
      "INSERT INTO contest_judges (id, contest_id, user_id, pin_hash, status, required, display_order) VALUES ($1, $2, $3, $4, 'ACTIVE', TRUE, 1)",
      [`cj-${judgeId}`, contestId, judgeId, pinHash]
    );
  }

  // Clear & Populate queue for Chowon
  await db.query("DELETE FROM judge_submission_order WHERE contest_id = $1 AND judge_id = $2", [contestId, judgeId]);
  const subs = await db.query("SELECT id FROM submissions WHERE contest_id = $1 AND status = 'ACTIVE' ORDER BY display_order", [contestId]);
  for (const [pos, sub] of subs.rows.entries()) {
    await db.query(
      "INSERT INTO judge_submission_order (id, contest_id, judge_id, submission_id, position, flagged) VALUES ($1, $2, $3, $4, $5, FALSE)",
      [`order-${judgeId}-${sub.id}`, contestId, judgeId, sub.id, pos]
    );
  }

  console.log(`Created test judge Chowon (PIN: 1234) with ${subs.rows.length} submissions in queue!`);
  const users = await db.query("SELECT id, name, role FROM users");
  console.log("Current DB Users:", users.rows);

  await db.close();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
