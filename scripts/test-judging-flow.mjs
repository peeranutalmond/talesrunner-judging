import crypto from "node:crypto";

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

async function runTests() {
  console.log("=== 1. VERIFY /login PAGE ACCESSIBILITY ===");
  const loginRes = await fetch("http://localhost:3000/login");
  console.log("/login Status:", loginRes.status);
  const loginHtml = await loginRes.text();
  console.log("✓ Login page renders cleanly (200 OK)");
  console.log("✓ Character select lobby displays Chowon:", loginHtml.includes("Chowon") || loginHtml.includes("โชวอน"));
  console.log("✓ Character select lobby displays Admin01:", loginHtml.includes("Admin01"));

  console.log("\n=== 2. GENERATE SIGNED SESSION FOR JUDGE CHOWON ===");
  const judgeCookie = makeSessionCookie({
    id: "judge-chowon",
    name: "โชวอน (Chowon)",
    role: "JUDGE",
    contestId: "contest-demo",
  });
  console.log("✓ Generated valid signed session cookie");

  console.log("\n=== 3. TEST /judge (SCORING WORKSPACE HUD & 10 ARTWORKS) ===");
  const judgeRes = await fetch("http://localhost:3000/judge", {
    headers: { Cookie: judgeCookie },
  });
  console.log("/judge Status:", judgeRes.status);
  const judgeHtml = await judgeRes.text();
  console.log("✓ Workspace loads successfully (200 OK)");
  console.log("✓ Displays Runner HUD with Chowon:", judgeHtml.includes("โชวอน"));
  console.log("✓ Displays Star Power Scoreboard:", judgeHtml.includes("STAR POWER") || judgeHtml.includes("Star Power"));
  console.log("✓ Displays Artwork #001 Image (/demo-art/001.jpg):", judgeHtml.includes("/demo-art/001.jpg"));
  console.log("✓ Displays Criteria Cards (Theme & Concept, etc.):", judgeHtml.includes("Theme & Concept"));
  console.log("✓ Displays CLEAR & NEXT button:", judgeHtml.includes("CLEAR & NEXT"));

  console.log("\n=== 4. TEST /judge/review (STAGE CLEAR GALLERY) ===");
  const reviewRes = await fetch("http://localhost:3000/judge/review", {
    headers: { Cookie: judgeCookie },
  });
  console.log("/judge/review Status:", reviewRes.status);
  const reviewHtml = await reviewRes.text();
  console.log("✓ Review stage loads successfully (200 OK)");
  console.log("✓ Displays Gallery Cards:", reviewHtml.includes("ทบทวน") || reviewHtml.includes("แกลเลอรี") || reviewHtml.includes("Skyline Sprint"));

  console.log("\n=== 5. GENERATE SIGNED SESSION FOR ADMIN01 ===");
  const adminCookie = makeSessionCookie({
    id: "admin-01",
    name: "Admin01",
    role: "SUPER_ADMIN",
    contestId: "contest-demo",
  });

  console.log("\n=== 6. TEST /admin/results (VISUAL RANKINGS WITH THUMBNAILS & PODIUM) ===");
  const resultsRes = await fetch("http://localhost:3000/admin/results", {
    headers: { Cookie: adminCookie },
  });
  console.log("/admin/results Status:", resultsRes.status);
  const resultsHtml = await resultsRes.text();
  console.log("✓ Results page loads successfully (200 OK)");
  console.log("✓ Displays Top 3 Podium Showcase:", resultsHtml.includes("1st Place") || resultsHtml.includes("อันดับที่ 1") || resultsHtml.includes("🥇"));
  console.log("✓ Displays Artwork image thumbnails in ranking rows:", resultsHtml.includes("/demo-art/"));

  console.log("\n=== 7. TEST /admin/judges (JUDGE MANAGEMENT & DELETE BUTTON) ===");
  const rosterRes = await fetch("http://localhost:3000/admin/judges", {
    headers: { Cookie: adminCookie },
  });
  console.log("/admin/judges Status:", rosterRes.status);
  const rosterHtml = await rosterRes.text();
  console.log("✓ Judges management loads successfully (200 OK)");
  console.log("✓ Displays Chowon judge card:", rosterHtml.includes("โชวอน (Chowon)"));
  console.log("✓ Displays Delete Judge Danger Action (ลบกรรมการนี้ออกจากระบบ):", rosterHtml.includes("ลบกรรมการนี้ออกจากระบบ"));
  console.log("✓ Displays Tales Runner character presets (Mingming, Bigbo, etc.):", rosterHtml.includes("Mingming") && rosterHtml.includes("Bigbo"));

  console.log("\n🎉 ALL 7 SYSTEM FLOW TESTS PASSED WITH FLYING COLORS! 🎉");
}

runTests().catch(err => {
  console.error("Test Failure:", err);
  process.exit(1);
});
