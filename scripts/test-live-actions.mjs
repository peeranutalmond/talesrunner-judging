import postgres from "postgres";
import sharp from "sharp";

const sql = postgres("postgresql://neondb_owner:npg_XzoIP1EsmK3d@ep-cold-sky-b4yiy5jl-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require");

const testBuffer = await sharp({
  create: {
    width: 100,
    height: 100,
    channels: 4,
    background: { r: 255, g: 0, b: 0, alpha: 1 }
  }
}).png().toBuffer();

const id = "test-" + Date.now();
await sql`INSERT INTO uploaded_files (id, mime_type, data, size_bytes) VALUES (${id}, 'image/png', ${testBuffer}, ${testBuffer.length})`;
console.log("Inserted test image with ID:", id);

const rows = await sql`SELECT id, mime_type, size_bytes, OCTET_LENGTH(data) AS bytes_len FROM uploaded_files WHERE id = ${id}`;
console.log("Read back from Neon DB:", rows);

await sql`DELETE FROM uploaded_files WHERE id = ${id}`;
console.log("Cleaned up test image.");

await sql.end();
process.exit(0);




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

// Fetch existing scores for submission to get expectedVersion
const existingScores = await sql`SELECT criterion_id, version FROM scores WHERE contest_id = 'contest-demo' AND submission_id = ${sub.id} AND judge_id = 'c2418989-412e-40b4-928a-00d07e58f60a' AND is_active = TRUE`;
const versionMap = new Map(existingScores.map(r => [r.criterion_id, r.version]));

const scoreBody = {
  contestId: "contest-demo",
  submissionId: sub.id,
  criteriaVersionId: contest.active_criteria_version_id,
  comment: "แก้ไขคะแนนรอบที่ 2 สำเร็จ",
  scores: criteria.map(c => ({
    criterionId: c.id,
    score: Math.round(Number(c.max_score) * 0.9),
    expectedVersion: versionMap.get(c.id)
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

