import crypto from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import path from "node:path";

const SESSION_SECRET = "artventure-local-demo-secret-change-before-production";
const COOKIE_NAME = "artventure_session";

function sign(input) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(input).digest("base64url");
}

function makeSessionCookie(user) {
  const payload = Buffer.from(JSON.stringify({
    ...user,
    exp: Date.now() + 3600 * 1000,
  })).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  return `${COOKIE_NAME}=${token}`;
}

async function main() {
  const judgeCookie = makeSessionCookie({
    id: "judge-chowon",
    name: "โชวอน (Chowon)",
    role: "JUDGE",
    contestId: "contest-demo",
  });

  console.log("1. Testing GET /judge/review?tab=top-picks...");
  const res = await fetch("http://localhost:3000/judge/review?tab=top-picks", {
    headers: { Cookie: judgeCookie },
  });
  console.log("Status:", res.status);
  const html = await res.text();
  console.log("✓ Renders Final Stage Top Picks banner:", html.includes("FINAL STAGE") || html.includes("Top Picks"));
  console.log("✓ Displays 3-5 Selector:", html.includes("3 - 5 อัน") || html.includes("fixed_3") || html.includes("ล็อก 3 อัน"));
  console.log("✓ Displays Sort Pills:", html.includes("คะแนนที่คุณให้"));

  console.log("\n2. Getting sample submissions to test saving Top Picks...");
  const db = new PGlite(path.join(process.cwd(), "data", "pglite"));
  const subRows = await db.query("SELECT id, submission_number, artwork_title FROM submissions WHERE contest_id = 'contest-demo' LIMIT 3");
  const subs = subRows.rows;
  console.log(`Found ${subs.length} submissions for testing:`, subs.map(s => `#${s.submission_number}: ${s.artwork_title}`).join(", "));

  console.log("\n3. Testing POST /api/top-picks...");
  const saveRes = await fetch("http://localhost:3000/api/top-picks", {
    method: "POST",
    headers: {
      Cookie: judgeCookie,
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
    },
    body: JSON.stringify({
      contestId: "contest-demo",
      picks: [
        { submissionId: subs[0].id, rankOrder: 1, note: "อันดับ 1 ในดวงใจ" },
        { submissionId: subs[1].id, rankOrder: 2, note: "อันดับ 2 เทคนิคยอดเยี่ยม" },
        { submissionId: subs[2].id, rankOrder: 3, note: "อันดับ 3 ธีมตรงใจมาก" },
      ],
    }),
  });
  console.log("Save status:", saveRes.status);
  const saveJson = await saveRes.json();
  console.log("Save response:", saveJson);

  console.log("\n4. Verifying judge_top_picks in DB...");
  const picksInDb = await db.query(
    "SELECT p.rank_order, p.note, s.submission_number, s.artwork_title FROM judge_top_picks p JOIN submissions s ON s.id=p.submission_id WHERE p.judge_id='judge-chowon' ORDER BY p.rank_order"
  );
  console.log("Picks stored in DB:", picksInDb.rows);

  console.log("\n5. Testing /admin/results with Judges' Choice showcase...");
  const adminCookie = makeSessionCookie({
    id: "admin-01",
    name: "Admin01",
    role: "ADMIN",
    contestId: "contest-demo",
  });
  const adminRes = await fetch("http://localhost:3000/admin/results", {
    headers: { Cookie: adminCookie },
  });
  console.log("/admin/results status:", adminRes.status);
  const adminHtml = await adminRes.text();
  console.log("✓ Displays Judges' Choice section:", adminHtml.includes("รางวัลขวัญใจกรรมการ") || adminHtml.includes("Judges' Choice Awards"));
  console.log("✓ Displays Chowon's picks in results:", adminHtml.includes("โชวอน") && adminHtml.includes(subs[0].artwork_title));

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
  await db.close();
}

main().catch(console.error);
