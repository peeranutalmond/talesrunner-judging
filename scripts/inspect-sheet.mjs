import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { PGlite } from "@electric-sql/pglite";
import { hash } from "bcryptjs";

function resolveImage(url) {
  const input = (url || "").trim();
  if (!input) return { imageUrl: "/api/demo-art/001", thumbnailUrl: "/api/demo-art/001", sourceUrl: input };
  const match = input.match(/\/d\/([a-zA-Z0-9_-]+)/) || input.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const fileId = match ? match[1] : null;
  if (fileId) {
    const encoded = encodeURIComponent(fileId);
    return {
      imageUrl: `https://drive.google.com/thumbnail?id=${encoded}&sz=w2400`,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${encoded}&sz=w800`,
      sourceUrl: input,
      fileId
    };
  }
  return {
    imageUrl: input,
    thumbnailUrl: input,
    sourceUrl: input
  };
}

async function main() {
  const csvPath = path.join(process.cwd(), "data", "submissions_google_sheet.csv");
  if (!fs.existsSync(csvPath)) {
    throw new Error("CSV not found at " + csvPath);
  }
  const csvText = fs.readFileSync(csvPath, "utf8");
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  console.log("Parsed Google Sheet rows:", parsed.data.length);

  const cols = Object.keys(parsed.data[0]);
  const emailCol = cols[1];
  const socialCol = cols[4];
  const penNameCol = cols[5];
  const trUserCol = cols[6];
  const uidCol = cols[7];
  const catCol = cols[10];
  const postUrlCol = cols[11];
  const artworkCol = cols[12];
  const titleCol = cols[14];

  const dbPath = path.join(process.cwd(), "data", "pglite");
  const db = new PGlite(dbPath);

  // Read schema SQL from schema.ts
  const schemaFile = fs.readFileSync(path.join(process.cwd(), "src", "lib", "db", "schema.ts"), "utf8");
  const sqlMatch = schemaFile.match(/export const INITIAL_SCHEMA_SQL = String\.raw`([\s\S]*?)`;/);
  if (!sqlMatch) throw new Error("Could not extract INITIAL_SCHEMA_SQL");
  const initialSql = sqlMatch[1];

  console.log("Applying INITIAL_SCHEMA_SQL...");
  await db.exec(initialSql);

  const contestId = "contest-demo";
  const criteriaSetId = "criteria-set-demo";
  const criteriaVersionId = "criteria-v1-demo";

  // Check if contest exists
  const existingContest = await db.query("SELECT id FROM contests WHERE id = $1", [contestId]);
  if (existingContest.rows.length === 0) {
    console.log("Creating contest, users, criteria...");
    const adminPin = await hash("2468", 10);
    const chowonPin = await hash("1234", 10);

    await db.query(
      "INSERT INTO users (id, name, email, role, avatar_color, avatar_url, pin_hash) VALUES ($1, $2, $3, 'SUPER_ADMIN', '#FF873A', $4, $5)",
      ["admin-01", "Admin01", "admin@example.local", "https://talesrunner.thehof.gg/asset/images/dt-crt-01.webp", adminPin]
    );

    await db.query(
      "INSERT INTO users (id, name, email, role, avatar_color, avatar_url, pin_hash) VALUES ($1, $2, $3, 'JUDGE', '#27B8FF', $4, $5)",
      ["judge-chowon", "โชวอน (Chowon)", "chowon@talesrunner.local", "https://talesrunner.thehof.gg/asset/images/dt-crt-01.webp", chowonPin]
    );

    await db.query(
      `INSERT INTO contests (
        id, name, internal_name, description, status, active_criteria_version_id, judge_login_mode,
        aggregation_method, tie_breaker, required_judges, anonymous_judging, judging_order,
        comment_mode, input_mode, allow_judge_editing, result_visibility, progress_animations, metadata_visibility
      ) VALUES ($1, $2, $3, $4, 'JUDGING', $5, 'PICKER_PIN', 'SUM', 'Creativity', NULL, TRUE, 'RANDOM_PER_JUDGE', 'OPTIONAL', 'STEPPER', TRUE, FALSE, TRUE, FALSE)`,
      [contestId, "Tales Artventure Demo", "tales-artventure-demo", "สนามตัดสินผลงานแฟนอาร์ตสำหรับทีมงาน", criteriaVersionId]
    );

    await db.query(
      "INSERT INTO contest_judges (id, contest_id, user_id, pin_hash, status, required, display_order) VALUES ($1, $2, $3, $4, 'ACTIVE', FALSE, 0)",
      ["cj-admin-01", contestId, "admin-01", adminPin]
    );

    await db.query(
      "INSERT INTO contest_judges (id, contest_id, user_id, pin_hash, status, required, display_order) VALUES ($1, $2, $3, $4, 'ACTIVE', TRUE, 1)",
      ["cj-judge-chowon", contestId, "judge-chowon", chowonPin]
    );

    await db.query("INSERT INTO criteria_sets (id, contest_id, name) VALUES ($1, $2, $3)", [criteriaSetId, contestId, "Fan Art Criteria"]);
    await db.query(
      "INSERT INTO criteria_versions (id, criteria_set_id, version_number, status, total_max, created_by) VALUES ($1, $2, 1, 'ACTIVE', 100, $3)",
      [criteriaVersionId, criteriaSetId, "admin-01"]
    );

    const criteria = [
      ["criterion-theme", "Theme & Concept", "ความสอดคล้องกับธีมและความชัดเจนของแนวคิด", 30],
      ["criterion-composition", "Composition & Storytelling", "องค์ประกอบภาพและการเล่าเรื่อง", 25],
      ["criterion-creativity", "Creativity", "ความคิดสร้างสรรค์และความสดใหม่", 20],
      ["criterion-technique", "Technique & Completion", "เทคนิค ความประณีต และความสมบูรณ์", 15],
      ["criterion-expression", "Character Expression", "อารมณ์และบุคลิกของตัวละคร", 10],
    ];
    for (const [index, item] of criteria.entries()) {
      await db.query(
        "INSERT INTO criteria (id, criteria_version_id, name, description, max_score, display_order) VALUES ($1, $2, $3, $4, $5, $6)",
        [item[0], criteriaVersionId, item[1], item[2], item[3], index]
      );
    }
  }

  // Ensure categories
  const defaults = [
    { slug: "traditional", name: "วาดบนกระดาษ", description: "Traditional art / งานวาดและลงสีบนกระดาษ", color: "#FF873A", icon: "✏️" },
    { slug: "digital", name: "วาดด้วยเครื่องมือดิจิทัล", description: "Digital art / งานที่สร้างด้วยอุปกรณ์และซอฟต์แวร์", color: "#27B8FF", icon: "🖥️" },
    { slug: "unspecified", name: "ยังไม่จัดหมวด", description: "ผลงานที่รอทีมงานตรวจสอบและจัดประเภท", color: "#64748B", icon: "🗂️" },
  ];
  for (const [index, item] of defaults.entries()) {
    await db.query(
      `INSERT INTO submission_categories (id, contest_id, name, slug, description, color, icon, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (contest_id, slug) DO NOTHING`,
      [`${contestId}-category-${item.slug}`, contestId, item.name, item.slug, item.description, item.color, item.icon, index]
    );
  }

  const digitalCatId = `${contestId}-category-digital`;
  const traditionalCatId = `${contestId}-category-traditional`;

  // Clear previous demo scores, orders and submissions for contest-demo
  await db.query("DELETE FROM scores WHERE contest_id = $1", [contestId]);
  await db.query("DELETE FROM judge_submission_order WHERE contest_id = $1", [contestId]);
  await db.query("DELETE FROM submissions WHERE contest_id = $1", [contestId]);
  console.log("Cleared old demo submissions and judge queues.");

  let importedCount = 0;
  const submissionsList = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    const subNum = String(i + 1).padStart(3, "0");
    const id = `sub-sheet-${subNum}`;

    const penName = (row[penNameCol] || "").trim();
    const social = (row[socialCol] || "").trim();
    const trUser = (row[trUserCol] || "").trim();
    const uid = (row[uidCol] || "").trim();
    const email = (row[emailCol] || "").trim() || null;
    const postUrl = (row[postUrlCol] || "").trim() || null;
    const title = (row[titleCol] || "").trim() || `ผลงานชิ้นที่ ${i + 1}`;
    const driveUrl = (row[artworkCol] || "").trim();
    const categoryRaw = (row[catCol] || "").trim();

    const isTraditional = categoryRaw.toLowerCase().includes("traditional");
    const categoryId = isTraditional ? traditionalCatId : digitalCatId;
    const categoryName = isTraditional ? "Traditional Art" : "Digital Art";

    const displayName = penName || social || `Contestant ${i + 1}`;
    const contestantName = penName ? `${penName} (@${social || trUser})` : (social || `Contestant ${i + 1}`);
    const playerId = uid || trUser || `TR-${subNum}`;
    const description = `สายการประกวด: ${categoryName} | นามปากกา: ${displayName} | Tales Runner Username: ${trUser || "-"} | UID: ${uid || "-"}`;

    const img = resolveImage(driveUrl);

    await db.query(
      `INSERT INTO submissions (
        id, contest_id, submission_number, contestant_name, display_name, player_id,
        email, social_url, artwork_title, description, image_url, thumbnail_url,
        source_image_url, category_id, status, display_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'ACTIVE', $15)`,
      [
        id, contestId, subNum, contestantName, displayName, playerId,
        email, postUrl, title, description, img.imageUrl, img.thumbnailUrl,
        img.sourceUrl, categoryId, i
      ]
    );

    submissionsList.push(id);
    importedCount++;
  }

  console.log(`Successfully imported ${importedCount} submissions from Google Sheet!`);

  // Populate judge_submission_order for all active contest judges
  const judges = await db.query(
    "SELECT user_id FROM contest_judges WHERE contest_id = $1 AND status = 'ACTIVE'",
    [contestId]
  );
  console.log("Active judges to populate queue for:", judges.rows.map(j => j.user_id));

  for (const judge of judges.rows) {
    for (let pos = 0; pos < submissionsList.length; pos++) {
      const subId = submissionsList[pos];
      await db.query(
        "INSERT INTO judge_submission_order (id, contest_id, judge_id, submission_id, position, flagged) VALUES ($1, $2, $3, $4, $5, FALSE)",
        [`order-${judge.user_id}-${subId}`, contestId, judge.user_id, subId, pos]
      );
    }
    console.log(`Populated queue with ${submissionsList.length} submissions for judge ${judge.user_id}`);
  }

  await db.close();
  console.log("Import finished successfully!");
}

main().catch(err => {
  console.error("Import error:", err);
  process.exit(1);
});
