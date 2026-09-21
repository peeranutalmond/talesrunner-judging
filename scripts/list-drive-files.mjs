import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { PGlite } from "@electric-sql/pglite";

async function run() {
  const csvPath = path.join(process.cwd(), "data", "submissions_google_sheet.csv");
  const csvText = fs.readFileSync(csvPath, "utf8");
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const rows = parsed.data;
  console.log(`Total rows in CSV: ${rows.length}`);

  const cols = Object.keys(rows[0]);
  const penNameCol = cols[5];
  const trUserCol = cols[6];
  const uidCol = cols[7];
  const catCol = cols[10];
  const artworkCol = cols[12];
  const titleCol = cols[14];

  const dbPath = path.join(process.cwd(), "data", "pglite");
  const db = new PGlite(dbPath);
  const subRows = await db.query(
    "SELECT id, submission_number, artwork_title, category_id, image_url, thumbnail_url, source_image_url FROM submissions ORDER BY display_order"
  );
  console.log(`Total submissions in DB: ${subRows.rows.length}`);

  const driveItems = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const link = (r[artworkCol] || "").trim();
    const title = (r[titleCol] || "").trim() || `Submission #${i + 1}`;
    const penName = (r[penNameCol] || "").trim();
    const trUser = (r[trUserCol] || "").trim();
    const uid = (r[uidCol] || "").trim();
    const cat = (r[catCol] || "").trim();

    // extract fileId
    const match = link.match(/\/d\/([a-zA-Z0-9_-]+)/) || link.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    const fileId = match ? match[1] : null;

    driveItems.push({
      index: i + 1,
      submissionNumber: String(i + 1).padStart(3, "0"),
      title,
      penName,
      trUser,
      uid,
      category: cat,
      driveLink: link,
      fileId,
      downloadDirectUrl: fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : null,
      thumbnailDirectUrl: fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600` : null
    });
  }

  // Save to JSON and CSV for the user
  const jsonPath = path.join(process.cwd(), "data", "drive_files_list.json");
  fs.writeFileSync(jsonPath, JSON.stringify(driveItems, null, 2), "utf8");

  const summaryCsvLines = [
    "No,SubmissionNumber,Title,Category,PenName,TalesRunnerUser,UID,FileID,DriveLink,DirectDownloadLink"
  ];
  for (const item of driveItems) {
    summaryCsvLines.push(
      [
        item.index,
        item.submissionNumber,
        `"${(item.title || "").replace(/"/g, '""')}"`,
        `"${(item.category || "").replace(/"/g, '""')}"`,
        `"${(item.penName || "").replace(/"/g, '""')}"`,
        `"${(item.trUser || "").replace(/"/g, '""')}"`,
        `"${(item.uid || "").replace(/"/g, '""')}"`,
        item.fileId || "",
        `"${item.driveLink || ""}"`,
        `"${item.downloadDirectUrl || ""}"`
      ].join(",")
    );
  }
  const summaryCsvPath = path.join(process.cwd(), "data", "drive_files_list.csv");
  fs.writeFileSync(summaryCsvPath, summaryCsvLines.join("\n"), "utf8");

  console.log(`Saved drive list to data/drive_files_list.json & data/drive_files_list.csv`);
  console.log(`Sample item 1:`, driveItems[0]);
  console.log(`Sample item 8 (first real):`, driveItems[7]);
}

run().catch(console.error);
