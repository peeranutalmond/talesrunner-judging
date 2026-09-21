import postgres from "postgres";

const connStr = "postgresql://neondb_owner:npg_XzoIP1EsmK3d@ep-cold-sky-b4yiy5jl-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";

console.log("Connecting to Neon...");
const sql = postgres(connStr, { max: 1 });

try {
  const result = await sql`SELECT 1 as connected, current_database() as db, version() as ver`;
  console.log("SUCCESSFULLY CONNECTED TO NEON!", result);
  await sql.end();
  process.exit(0);
} catch (err) {
  console.error("Neon connection failed:", err.message);
  process.exit(1);
}
