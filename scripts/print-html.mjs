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
  const judgeCookie = makeSessionCookie({
    id: "judge-chowon",
    name: "โชวอน (Chowon)",
    role: "JUDGE",
    contestId: "contest-demo",
  });
  const res = await fetch("http://localhost:3000/judge", {
    headers: { Cookie: judgeCookie },
  });
  const html = await res.text();
  console.log("Has Theme:", html.includes("Theme"));
  console.log("Has Concept:", html.includes("Concept"));
  console.log("Has CLEAR:", html.includes("CLEAR"));
  console.log("Has NEXT:", html.includes("NEXT"));
  console.log("Has STAR POWER:", html.includes("STAR POWER"));
}

main().catch(console.error);
