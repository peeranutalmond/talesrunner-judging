import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import postgres from "postgres";

const baseUrl = "https://talesrunner-artventure.netlify.app";
const sql = postgres("postgresql://neondb_owner:npg_XzoIP1EsmK3d@ep-cold-sky-b4yiy5jl-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require");

const pin1234 = await bcrypt.hash("1234", 10);
await sql`UPDATE users SET pin_hash = ${pin1234} WHERE role = 'JUDGE'`;
await sql`UPDATE contest_judges SET pin_hash = ${pin1234} WHERE user_id IN (SELECT id FROM users WHERE role = 'JUDGE')`;
console.log("All judges updated to PIN 1234 successfully in Neon DB!");

const secret = "talesrunner-artventure-secret-key-super-safe-2026";

function sign(input) {
  return crypto.createHmac("sha256", secret).update(input).digest("base64url");
}

function createCookie(session) {
  const payload = Buffer.from(JSON.stringify({ ...session, exp: Date.now() + 3600 * 1000 })).toString("base64url");
  return `artventure_session=${payload}.${sign(payload)}`;
}

// 1. Test Admin session accessing /admin
console.log("--- 1. Testing Admin access to /admin and /admin/criteria ---");
const adminCookie = createCookie({ id: "admin-01", name: "Admin01", role: "SUPER_ADMIN", contestId: "contest-demo" });
const adminRes = await fetch(`${baseUrl}/admin`, {
  headers: { Cookie: adminCookie }
});
console.log("Admin /admin status:", adminRes.status);

const criteriaRes = await fetch(`${baseUrl}/admin/criteria`, {
  headers: { Cookie: adminCookie }
});
console.log("Admin /admin/criteria status:", criteriaRes.status);

// 2. Test Judge accessing /judge
console.log("\n--- 2. Testing Judge TOY accessing /judge ---");
const toyCookie = createCookie({ id: "c2418989-412e-40b4-928a-00d07e58f60a", name: "TOY ", role: "JUDGE", contestId: "contest-demo" });
const judgeRes = await fetch(`${baseUrl}/judge`, {
  headers: { Cookie: toyCookie }
});
console.log("Judge /judge status:", judgeRes.status);

// 3. Test submitting score via /api/scores as Judge TOY
console.log("\n--- 3. Testing POST /api/scores as Judge TOY ---");
// First, get the active criteria version and submission
const [contest] = await sql`SELECT * FROM contests WHERE id = 'contest-demo'`;
const criteria = await sql`SELECT * FROM criteria WHERE criteria_version_id = ${contest.active_criteria_version_id} ORDER BY display_order`;
const [sub] = await sql`SELECT * FROM submissions WHERE contest_id = 'contest-demo' AND status = 'ACTIVE' LIMIT 1`;

console.log(`Contest: ${contest.name}, Active Version: ${contest.active_criteria_version_id}`);
console.log(`Criteria count: ${criteria.length}, Submission: #${sub.submission_number} (${sub.artwork_title})`);

const scoreBody = {
  contestId: "contest-demo",
  submissionId: sub.id,
  criteriaVersionId: contest.active_criteria_version_id,
  comment: "ทดสอบการให้คะแนนแบบเรียลไทม์จากระบบ",
  scores: criteria.map(c => ({
    criterionId: c.id,
    score: Math.round(Number(c.max_score) * 0.8)
  }))
};

const postScoreRes = await fetch(`${baseUrl}/api/scores`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Origin": baseUrl,
    "Referer": `${baseUrl}/judge`,
    "Cookie": toyCookie
  },
  body: JSON.stringify(scoreBody)
});

console.log("Judge POST /api/scores status:", postScoreRes.status);
const scoreResult = await postScoreRes.text();
console.log("Judge POST /api/scores response:", scoreResult);

// 4. Test submitting score as Admin01
console.log("\n--- 4. Testing POST /api/scores as Admin01 (SUPER_ADMIN) ---");
const adminScoreRes = await fetch(`${baseUrl}/api/scores`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Origin": baseUrl,
    "Referer": `${baseUrl}/judge`,
    "Cookie": adminCookie
  },
  body: JSON.stringify(scoreBody)
});
console.log("Admin POST /api/scores status:", adminScoreRes.status);
const adminScoreResult = await adminScoreRes.text();
console.log("Admin POST /api/scores response:", adminScoreResult);

await sql.end();

