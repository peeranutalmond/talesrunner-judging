import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

async function syncLocalArtworks() {
  const artworksDir = path.join(process.cwd(), "public", "artworks");
  if (!fs.existsSync(artworksDir)) {
    fs.mkdirSync(artworksDir, { recursive: true });
  }

  const files = fs.readdirSync(artworksDir);
  console.log(`Scanning public/artworks folder... found ${files.length} files.`);

  if (files.length === 0) {
    console.log("No image files found in public/artworks yet.");
    console.log("Tip: Place images like '001.png', '008.jpg', '008_title.png' into public/artworks/");
    return;
  }

  const dbPath = path.join(process.cwd(), "data", "pglite");
  const db = new PGlite(dbPath);

  const subQuery = await db.query(
    "SELECT id, submission_number, artwork_title, image_url FROM submissions ORDER BY display_order"
  );
  const submissions = subQuery.rows;

  let matchedCount = 0;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (![".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) continue;

    const base = path.basename(file, ext);
    // match number e.g. "008", "8", "sub-008", "008_title"
    const numMatch = base.match(/\b(\d{1,3})\b/) || base.match(/^(\d{1,3})/);
    if (!numMatch) continue;

    const parsedNum = parseInt(numMatch[1], 10);
    const subNumFormatted = String(parsedNum).padStart(3, "0");

    const targetSub = submissions.find(
      (s) => s.submission_number === subNumFormatted || parseInt(s.submission_number, 10) === parsedNum
    );

    if (targetSub) {
      const localPath = `/artworks/${file}`;
      await db.query(
        "UPDATE submissions SET image_url = $1, thumbnail_url = $1, updated_at = NOW() WHERE id = $2",
        [localPath, targetSub.id]
      );
      matchedCount++;
      console.log(`✓ Updated #${targetSub.submission_number} (${targetSub.artwork_title}) -> ${localPath}`);
    }
  }

  console.log(`\n🎉 Successfully synced ${matchedCount} artwork images to local files!`);
  await db.close();
}

syncLocalArtworks().catch(console.error);
