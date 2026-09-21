import { spawnSync } from "node:child_process";

const envVars = {
  DATABASE_URL: "postgresql://neondb_owner:npg_XzoIP1EsmK3d@ep-cold-sky-b4yiy5jl-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require",
  SESSION_SECRET: "talesrunner-artventure-secret-key-super-safe-2026",
  NODE_VERSION: "20"
};

for (const [key, value] of Object.entries(envVars)) {
  console.log(`Setting ${key}...`);
  const res = spawnSync("cmd.exe", ["/c", "npx", "netlify", "env:set", key, value], {
    encoding: "utf8"
  });
  console.log(res.stdout || res.stderr);
}

console.log("Verification:");
for (const key of Object.keys(envVars)) {
  const check = spawnSync("cmd.exe", ["/c", "npx", "netlify", "env:get", key], {
    encoding: "utf8"
  });
  console.log(`${key} = ${check.stdout?.trim()}`);
}
