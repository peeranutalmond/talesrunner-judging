import { spawnSync } from "node:child_process";

const siteId = "9ce11ab0-1b55-4863-9546-e1d003c60fcc";
const res = spawnSync("cmd.exe", ["/c", "npx", "netlify", "api", "listSiteDeploys", "--data", JSON.stringify({ site_id: siteId })], {
  encoding: "utf8"
});

try {
  const deploys = JSON.parse(res.stdout);
  console.log(`Found ${deploys.length} deploys.`);
  for (const d of deploys.slice(0, 3)) {
    console.log("-----------------------------------------");
    console.log("ID:", d.id);
    console.log("State:", d.state);
    console.log("Error message:", d.error_message);
    console.log("Context:", d.context);
    console.log("Branch:", d.branch);
    console.log("Created at:", d.created_at);
    console.log("Deploy URL:", d.deploy_ssl_url);
    console.log("Log URL:", `https://app.netlify.com/projects/talesrunner-artventure/deploys/${d.id}`);
  }
} catch (e) {
  console.log("Raw output:", res.stdout || res.stderr);
}
