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

async function main() {
  const adminCookie = makeSessionCookie({
    id: "admin-01",
    name: "Admin01",
    role: "SUPER_ADMIN",
    contestId: "contest-demo",
  });
  const res = await fetch("http://localhost:3000/admin/results", {
    headers: { Cookie: adminCookie },
  });
  const html = await res.text();
  console.log("Results Status:", res.status);
  console.log("Has Leaderboard:", html.includes("Leaderboard") || html.includes("จัดอันดับ"));
  console.log("Has Podium:", html.includes("Podium") || html.includes("podium") || html.includes("Top 3"));
  console.log("Has Artwork images:", html.includes("/demo-art/") || html.includes("images.unsplash.com"));
  console.log("Has Lock Results:", html.includes("LOCK"));
}

main().catch(console.error);
