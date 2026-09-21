import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { PGlite } from "@electric-sql/pglite";

const connStr = "postgresql://neondb_owner:npg_XzoIP1EsmK3d@ep-cold-sky-b4yiy5jl-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";


// Extract INITIAL_SCHEMA_SQL from schema.ts
const schemaFile = fs.readFileSync(path.join(process.cwd(), "src", "lib", "db", "schema.ts"), "utf8");
const match = schemaFile.match(/export const INITIAL_SCHEMA_SQL = String\.raw`([\s\S]*?)`;/);
if (!match) throw new Error("Could not extract INITIAL_SCHEMA_SQL");
const INITIAL_SCHEMA_SQL = match[1];


console.log("1. Connecting to Neon PostgreSQL...");
const neon = postgres(connStr, { max: 4 });

console.log("2. Running INITIAL_SCHEMA_SQL on Neon...");
await neon.unsafe(INITIAL_SCHEMA_SQL);
console.log("✓ Initial schema created successfully on Neon!");

console.log("3. Reading local PGlite database...");
const localDb = new PGlite(path.join(process.cwd(), "data", "pglite"));

// Tables to sync in order
const tables = [
  "contests",
  "users",
  "submission_categories",
  "contest_judges",
  "criteria_sets",
  "criteria_versions",
  "criteria",
  "submissions",
  "judge_submission_order",
];

for (const table of tables) {
  const localRows = (await localDb.query(`SELECT * FROM ${table}`)).rows;
  console.log(`Syncing ${table} (${localRows.length} rows)...`);

  for (const row of localRows) {
    const keys = Object.keys(row);
    const values = Object.values(row);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    const updateCols = keys.filter(k => k !== "id").map(k => `${k} = EXCLUDED.${k}`).join(", ");

    const queryText = `
      INSERT INTO ${table} (${keys.join(", ")})
      VALUES (${placeholders})
      ON CONFLICT (id) DO UPDATE SET ${updateCols || "id = EXCLUDED.id"}
    `;
    await neon.unsafe(queryText, values);
  }
}

console.log("4. Verifying Neon database...");
const neonSubCount = await neon`SELECT count(*)::int as count FROM submissions`;
const neonUserCount = await neon`SELECT count(*)::int as count FROM users`;
const neonQueueCount = await neon`SELECT count(*)::int as count FROM judge_submission_order`;

console.log("🎉 NEON SYNC COMPLETE!");
console.log(`- Submissions on Neon: ${neonSubCount[0].count}`);
console.log(`- Users on Neon: ${neonUserCount[0].count}`);
console.log(`- Queue items on Neon: ${neonQueueCount[0].count}`);

await localDb.close();
await neon.end();
process.exit(0);
