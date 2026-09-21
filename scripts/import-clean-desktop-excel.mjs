import fs from "node:fs";
import path from "node:path";
import * as xlsx from "xlsx";
import { PGlite } from "@electric-sql/pglite";
import crypto from "node:crypto";

const filePath = "C:/Users/almon/Desktop/(ส่งผลงาน) Tales Artventure  _ Animal Village with Friends (1).xlsx";

if (!fs.existsSync(filePath)) {
  console.error("File does not exist:", filePath);
  process.exit(1);
}

const buf = fs.readFileSync(filePath);
const workbook = xlsx.read(buf, { type: "buffer" });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log("Reading desktop Excel, total rows:", rows.length);

const entries = [];
for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  if (!r || r.length === 0 || !r[1]) continue;
  entries.push({
    excelRow: i + 1,
    timestamp: r[0],
    email: String(r[1] || "").trim(),
    fbName: String(r[4] || "").trim(),
    penName: String(r[5] || "").trim(),
    trUsername: String(r[6] || "").trim(),
    uid: String(r[7] || "").trim(),
    phone: String(r[8] || "").trim(),
    categoryStr: String(r[10] || "").trim(),
    fbPost: String(r[11] || "").trim(),
    driveUrl: String(r[12] || "").trim(),
    title: String(r[14] || "").trim(),
    status: String(r[15] || "").trim(),
  });
}

console.log(`Parsed ${entries.length} submissions from Excel.`);

const dbPath = path.join(process.cwd(), "data", "pglite");
const db = new PGlite(dbPath);

// 1. Backup old submissions
const oldSubmissions = await db.query("SELECT * FROM submissions WHERE contest_id = 'contest-demo'");
fs.writeFileSync(
  path.join(process.cwd(), "data", "submissions_backup_69.json"),
  JSON.stringify(oldSubmissions.rows, null, 2),
  "utf8"
);
console.log(`Backed up ${oldSubmissions.rows.length} old submissions to data/submissions_backup_69.json`);

// 2. Fetch categories
const categoriesRes = await db.query("SELECT id, name, slug FROM submission_categories WHERE contest_id = 'contest-demo'");
const catDigital = categoriesRes.rows.find(c => c.slug === "digital")?.id;
const catTraditional = categoriesRes.rows.find(c => c.slug === "traditional")?.id;
const catUnspecified = categoriesRes.rows.find(c => c.slug === "unspecified")?.id;

console.log("Categories:", { catDigital, catTraditional, catUnspecified });

// 3. Fetch active judges
const judgesRes = await db.query("SELECT user_id FROM contest_judges WHERE contest_id = 'contest-demo' AND status = 'ACTIVE'");
const judgeIds = judgesRes.rows.map(j => j.user_id);
console.log("Active judges:", judgeIds);

// 4. Delete existing submissions, scores, judge_submission_order, top_picks
console.log("Cleaning old contest data...");
await db.query("DELETE FROM judge_top_picks WHERE contest_id = 'contest-demo'");
await db.query("DELETE FROM scores WHERE contest_id = 'contest-demo'");
await db.query("DELETE FROM judge_submission_order WHERE contest_id = 'contest-demo'");
await db.query("DELETE FROM submissions WHERE contest_id = 'contest-demo'");


// Helper for Drive IDs
function getDriveFileId(url) {
  if (!url) return null;
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// 5. Insert new 61 submissions
const contestId = "contest-demo";
const driveList = [];

for (let i = 0; i < entries.length; i++) {
  const e = entries[i];
  const numInt = i + 1;
  const submissionNumber = String(numInt).padStart(3, "0");
  const subId = crypto.randomUUID();

  const isDigital = e.categoryStr.includes("Digital");
  const isTraditional = e.categoryStr.includes("Traditional");
  const categoryId = isDigital ? catDigital : isTraditional ? catTraditional : catUnspecified;
  const categoryName = isDigital ? "Digital Art (วาดด้วยเครื่องมือดิจิทัล)" : isTraditional ? "Traditional Art (วาดบนกระดาษ)" : "ไม่ระบุ";

  const driveId = getDriveFileId(e.driveUrl);
  let imageUrl = e.driveUrl;
  let thumbnailUrl = e.driveUrl;

  if (driveId) {
    const encoded = encodeURIComponent(driveId);
    imageUrl = `https://drive.google.com/thumbnail?id=${encoded}&sz=w2400`;
    thumbnailUrl = `https://drive.google.com/thumbnail?id=${encoded}&sz=w800`;
  }

  // Check if local image exists in public/artworks
  const localCandidates = [
    `${submissionNumber}.png`, `${submissionNumber}.jpg`, `${submissionNumber}.jpeg`, `${submissionNumber}.webp`,
    `${numInt}.png`, `${numInt}.jpg`, `${numInt}.jpeg`, `${numInt}.webp`
  ];
  for (const c of localCandidates) {
    if (fs.existsSync(path.join(process.cwd(), "public", "artworks", c))) {
      imageUrl = `/artworks/${c}`;
      thumbnailUrl = `/artworks/${c}`;
      break;
    }
  }

  await db.query(`
    INSERT INTO submissions (
      id, contest_id, submission_number, contestant_name, display_name, player_id,
      email, social_url, artwork_title, description, image_url, thumbnail_url,
      source_image_url, category_id, status, display_order, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'ACTIVE', $15, NOW(), NOW())
  `, [
    subId,
    contestId,
    submissionNumber,
    e.fbName || e.penName,
    e.penName,
    e.uid || e.trUsername,
    e.email || null,
    e.fbPost || null,
    e.title,
    `Tales Runner: ${e.trUsername} | UID: ${e.uid} | Tel: ${e.phone}`,
    imageUrl,
    thumbnailUrl,
    e.driveUrl,
    categoryId,
    i
  ]);

  // Insert into judge queue for each judge
  for (const judgeId of judgeIds) {
    await db.query(`
      INSERT INTO judge_submission_order (id, contest_id, judge_id, submission_id, position)
      VALUES ($1, $2, $3, $4, $5)
    `, [crypto.randomUUID(), contestId, judgeId, subId, i]);
  }

  driveList.push({
    submission_number: submissionNumber,
    title: e.title,
    artist_name: e.penName,
    category: categoryName,
    drive_url: e.driveUrl,
    drive_id: driveId || "",
    expected_local_filename: `${submissionNumber}.png`,
    facebook_post: e.fbPost,
    player_uid: e.uid,
    tr_username: e.trUsername
  });
}

console.log(`Successfully inserted ${entries.length} submissions!`);

// 6. Write CSV & JSON lists
const csvHeader = "submission_number,title,artist_name,category,drive_url,drive_id,expected_local_filename,player_uid,tr_username\n";
const csvRows = driveList.map(item =>
  `"${item.submission_number}","${item.title.replace(/"/g, '""')}","${item.artist_name.replace(/"/g, '""')}","${item.category}","${item.drive_url}","${item.drive_id}","${item.expected_local_filename}","${item.player_uid}","${item.tr_username}"`
).join("\n");

fs.writeFileSync(path.join(process.cwd(), "data", "drive_files_list.csv"), csvHeader + csvRows, "utf8");
fs.writeFileSync(path.join(process.cwd(), "public", "drive_files_list.csv"), csvHeader + csvRows, "utf8");
fs.writeFileSync(path.join(process.cwd(), "data", "drive_files_list.json"), JSON.stringify(driveList, null, 2), "utf8");
fs.writeFileSync(path.join(process.cwd(), "public", "drive_files_list.json"), JSON.stringify(driveList, null, 2), "utf8");

console.log("Updated CSV and JSON drive files lists.");

// 7. Regenerate public/drive-links.html
import("./generate-drive-html.mjs").then(() => {
  console.log("Regenerated drive-links.html successfully.");
  db.close();
}).catch(err => {
  console.log("Generate html note:", err.message);
  db.close();
});
