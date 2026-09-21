import postgres from "postgres";
import { PGlite } from "@electric-sql/pglite";
import path from "node:path";

const connStr = "postgresql://neondb_owner:npg_XzoIP1EsmK3d@ep-cold-sky-b4yiy5jl-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";
const neon = postgres(connStr, { max: 4 });
const localDb = new PGlite(path.join(process.cwd(), "data", "pglite"));

console.log("Bulk syncing judge_submission_order...");
const localOrders = (await localDb.query("SELECT * FROM judge_submission_order")).rows;

// Clean existing judge_submission_order on Neon
await neon.unsafe("DELETE FROM judge_submission_order WHERE contest_id = 'contest-demo'");

// Chunk in batches of 50
for (let i = 0; i < localOrders.length; i += 50) {
  const batch = localOrders.slice(i, i + 50);
  const values = [];
  const valueClauses = [];

  batch.forEach((row, rowIdx) => {
    const offset = rowIdx * 5;
    valueClauses.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`);
    values.push(row.id, row.contest_id, row.judge_id, row.submission_id, row.position);
  });

  const sqlText = `
    INSERT INTO judge_submission_order (id, contest_id, judge_id, submission_id, position)
    VALUES ${valueClauses.join(", ")}
  `;
  await neon.unsafe(sqlText, values);
}

const finalCount = await neon`SELECT count(*)::int as count FROM judge_submission_order`;
console.log(`✓ judge_submission_order synced: ${finalCount[0].count} rows!`);

await localDb.close();
await neon.end();
process.exit(0);
