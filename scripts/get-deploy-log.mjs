import { spawnSync } from "node:child_process";

const deployId = "6ab0fdf54267642e2a174cb3";
const res = spawnSync("cmd.exe", ["/c", "npx", "netlify", "api", "getDeploy", "--data", JSON.stringify({ deploy_id: deployId })], {
  encoding: "utf8"
});

try {
  const data = JSON.parse(res.stdout);
  console.log("Error message:", data.error_message);
  console.log("Summary:", data.summary);
  console.log("Log:", data.log);
} catch (e) {
  console.log(res.stdout || res.stderr);
}
