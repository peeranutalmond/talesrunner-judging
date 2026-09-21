const baseUrl = "https://talesrunner-artventure.netlify.app";

console.log("1. Testing login on live site...");
const loginRes = await fetch(`${baseUrl}/login`, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "Origin": baseUrl,
    "Referer": `${baseUrl}/login`,
  },
  body: new URLSearchParams({
    userId: "admin-01",
    pin: "2468"
  }),
  redirect: "manual"
});

console.log("Login HTTP Status:", loginRes.status);
const setCookie = loginRes.headers.get("set-cookie");
console.log("Set-Cookie:", setCookie ? setCookie.split(";")[0] : "NONE");

if (!setCookie) {
  const text = await loginRes.text();
  console.log("Login body:", text.slice(0, 500));
}

// Check /admin/criteria page
const cookie = setCookie ? setCookie.split(";")[0] : "";
const criteriaRes = await fetch(`${baseUrl}/admin/criteria`, {
  headers: {
    "Cookie": cookie,
  }
});
console.log("/admin/criteria HTTP Status:", criteriaRes.status);

// Now test submitting a score as judge Chowon
console.log("\n2. Testing login as Judge Chowon...");
const judgeLoginRes = await fetch(`${baseUrl}/login`, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "Origin": baseUrl,
    "Referer": `${baseUrl}/login`,
  },
  body: new URLSearchParams({
    userId: "judge-chowon",
    pin: "1234"
  }),
  redirect: "manual"
});

console.log("Judge Login Status:", judgeLoginRes.status);
const judgeCookie = judgeLoginRes.headers.get("set-cookie")?.split(";")[0] || "";
console.log("Judge Cookie:", judgeCookie);

// Test posting a score
const scoreRes = await fetch(`${baseUrl}/api/scores`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Origin": baseUrl,
    "Referer": `${baseUrl}/judge`,
    "Cookie": judgeCookie
  },
  body: JSON.stringify({
    contestId: "contest-demo",
    submissionId: "any",
    criteriaVersionId: "any",
    scores: []
  })
});

console.log("Score API Status:", scoreRes.status);
console.log("Score API Response:", await scoreRes.text());
