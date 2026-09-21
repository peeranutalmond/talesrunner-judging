import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

async function run() {
  const dbPath = path.join(process.cwd(), "data", "pglite");
  const db = new PGlite(dbPath);

  console.log("Applying migrations for judge_top_picks...");
  await db.exec(`
    ALTER TABLE contests ADD COLUMN IF NOT EXISTS top_picks_min INTEGER NOT NULL DEFAULT 3;
    ALTER TABLE contests ADD COLUMN IF NOT EXISTS top_picks_max INTEGER NOT NULL DEFAULT 5;

    CREATE TABLE IF NOT EXISTS judge_top_picks (
      id TEXT PRIMARY KEY,
      contest_id TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
      judge_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
      rank_order INTEGER NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (contest_id, judge_id, submission_id),
      UNIQUE (contest_id, judge_id, rank_order)
    );

    CREATE INDEX IF NOT EXISTS idx_judge_top_picks_lookup ON judge_top_picks(contest_id, judge_id, rank_order);
    CREATE INDEX IF NOT EXISTS idx_judge_top_picks_submission ON judge_top_picks(submission_id);
  `);

  console.log("✓ judge_top_picks table and columns migrated successfully!");
  await db.close();
}

run().catch(console.error);
