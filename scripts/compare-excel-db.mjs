import fs from "node:fs";
import path from "node:path";
import * as xlsx from "xlsx";
import { PGlite } from "@electric-sql/pglite";

// Read Desktop Excel
const filePath = "C:/Users/almon/Desktop/(ส่งผลงาน) Tales Artventure  _ Animal Village with Friends (1).xlsx";
const buf = fs.readFileSync(filePath);
const workbook = xlsx.read(buf, { type: "buffer" });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const excelEntries = [];
for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  if (!r || r.length === 0 || !r[1]) continue;
  excelEntries.push({
    excelRow: i + 1,
    index: excelEntries.length + 1,
    email: String(r[1]).trim(),
    facebookName: String(r[4] || "").trim(),
    penName: String(r[5] || "").trim(),
    trUsername: String(r[6] || "").trim(),
    uid: String(r[7] || "").trim(),
    phone: String(r[8] || "").trim(),
    category: String(r[10] || "").trim(),
    driveUrl: String(r[12] || "").trim(),
    title: String(r[14] || "").trim(),
    status: String(r[15] || "").trim(),
  });
}

const dbPath = path.join(process.cwd(), "data", "pglite");
const db = new PGlite(dbPath);

const subQuery = await db.query(
  "SELECT id, submission_number, artwork_title, display_name, contestant_name, source_image_url, image_url, category_id FROM submissions ORDER BY display_order ASC"
);
const dbSubmissions = subQuery.rows;

console.log(`Current DB Submissions: ${dbSubmissions.length}`);
console.log(`Desktop Excel Submissions: ${excelEntries.length}`);

console.log("\n==============================================");
console.log("1. SUBMISSIONS IN CURRENT DB NOT IN EXCEL:");
console.log("==============================================");
const notInExcel = [];
for (const sub of dbSubmissions) {
  const driveId = sub.source_image_url ? (sub.source_image_url.split("id=")[1] || "").split("&")[0] : null;
  const match = excelEntries.find(e => {
    const eDriveId = (e.driveUrl.split("id=")[1] || "").split("&")[0];
    return (driveId && eDriveId && driveId === eDriveId) ||
      (sub.artwork_title && e.title && sub.artwork_title.trim().toLowerCase() === e.title.trim().toLowerCase()) ||
      (sub.display_name && e.penName && sub.display_name.trim().toLowerCase() === e.penName.trim().toLowerCase());
  });
  if (!match) {
    notInExcel.push(sub);
  }
}
console.log(`Total: ${notInExcel.length}`);
notInExcel.forEach(s => {
  console.log(`  - #${s.submission_number}: [${s.display_name}] "${s.artwork_title}"`);
});

console.log("\n==============================================");
console.log("2. EXCEL ENTRIES NOT IN CURRENT DB:");
console.log("==============================================");
const notInDb = [];
for (const e of excelEntries) {
  const eDriveId = (e.driveUrl.split("id=")[1] || "").split("&")[0];
  const match = dbSubmissions.find(s => {
    const driveId = s.source_image_url ? (s.source_image_url.split("id=")[1] || "").split("&")[0] : null;
    return (driveId && eDriveId && driveId === eDriveId) ||
      (s.artwork_title && e.title && s.artwork_title.trim().toLowerCase() === e.title.trim().toLowerCase()) ||
      (s.display_name && e.penName && s.display_name.trim().toLowerCase() === e.penName.trim().toLowerCase());
  });
  if (!match) {
    notInDb.push(e);
  }
}
console.log(`Total: ${notInDb.length}`);
notInDb.forEach(e => {
  console.log(`  - Row ${e.excelRow}: [${e.penName}] "${e.title}" (Drive: ${e.driveUrl})`);
});

console.log("\n==============================================");
console.log("3. CATEGORIES IN EXCEL:");
console.log("==============================================");
const digitals = excelEntries.filter(e => e.category.includes("Digital"));
const traditionals = excelEntries.filter(e => e.category.includes("Traditional"));
console.log(`Digital Art: ${digitals.length} entries`);
console.log(`Traditional Art: ${traditionals.length} entries`);
console.log(`Total: ${excelEntries.length}`);

await db.close();
