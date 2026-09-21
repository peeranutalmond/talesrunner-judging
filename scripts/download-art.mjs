import fs from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

const ARTWORKS = [
  {
    num: "001",
    url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=80",
    title: "Skyline Sprint",
  },
  {
    num: "002",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80",
    title: "Forest Checkpoint",
  },
  {
    num: "003",
    url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80",
    title: "Moonlit Relay",
  },
  {
    num: "004",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=80",
    title: "Cloud Harbor",
  },
  {
    num: "005",
    url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&auto=format&fit=crop&q=80",
    title: "Starfall Village",
  },
  {
    num: "006",
    url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop&q=80",
    title: "Mint Meadow Dash",
  },
  {
    num: "007",
    url: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200&auto=format&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&auto=format&fit=crop&q=80",
    title: "Dragon Kite Day",
  },
  {
    num: "008",
    url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&auto=format&fit=crop&q=80",
    title: "Sunset Shortcut",
  },
  {
    num: "009",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80",
    title: "Crystal Finish",
  },
  {
    num: "010",
    url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&auto=format&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&auto=format&fit=crop&q=80",
    title: "Festival Lap",
  },
];

async function main() {
  const targetDir = path.join(process.cwd(), "public", "demo-art");
  await fs.mkdir(targetDir, { recursive: true });

  console.log("Downloading 10 artwork images...");
  for (const item of ARTWORKS) {
    const filePath = path.join(targetDir, `${item.num}.jpg`);
    try {
      const res = await fetch(item.url);
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        await fs.writeFile(filePath, buffer);
        console.log(`✓ Saved ${item.num}.jpg (${buffer.length} bytes)`);
      } else {
        console.warn(`Failed to download ${item.num}: ${res.status}`);
      }
    } catch (e) {
      console.warn(`Error downloading ${item.num}:`, e.message);
    }
  }

  // Update DB submissions to point to these beautiful images
  const db = new PGlite(path.join(process.cwd(), "data", "pglite"));
  for (const item of ARTWORKS) {
    const localUrl = `/demo-art/${item.num}.jpg`;
    await db.query(
      "UPDATE submissions SET image_url = $1, thumbnail_url = $2, source_image_url = $3 WHERE submission_number = $4",
      [localUrl, item.thumb, item.url, item.num]
    );
  }

  const rows = await db.query("SELECT submission_number, artwork_title, image_url, thumbnail_url FROM submissions ORDER BY display_order");
  console.log("Updated Submissions in DB:", rows.rows);

  await db.close();
  console.log("Done!");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
