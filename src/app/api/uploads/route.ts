import sharp from "sharp";

import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { isTrustedMutation } from "@/lib/auth/origin";

const allowedTypes = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

async function uploadSupabase(objectPath: string, data: Uint8Array, contentType: string) {
  const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_ARTWORK_BUCKET ?? "artworks";
  if (!baseUrl || !serviceKey) return null;
  const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, "Content-Type": contentType, "x-upsert": "false" },
    body: Buffer.from(data),
  });
  if (!response.ok) throw new Error(`Storage upload failed (${response.status})`);
  return `${baseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`;
}

export async function POST(request: Request) {
  if(!isTrustedMutation(request))return NextResponse.json({error:"UNTRUSTED_ORIGIN"},{status:403});
  const session = await requireApiSession(["ADMIN", "SUPER_ADMIN"]);
  if (!session?.contestId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File)) return NextResponse.json({ error: "IMAGE_REQUIRED" }, { status: 400 });
  const extension = allowedTypes.get(file.type);
  if (!extension) return NextResponse.json({ error: "UNSUPPORTED_FILE_TYPE" }, { status: 415 });
  const maximumBytes = Number(process.env.MAX_UPLOAD_MB ?? 15) * 1024 * 1024;
  if (file.size <= 0 || file.size > maximumBytes) return NextResponse.json({ error: "FILE_TOO_LARGE", maximumBytes }, { status: 413 });

  try {
    const original = new Uint8Array(await file.arrayBuffer());
    const metadata = await sharp(original, { limitInputPixels: 100_000_000 }).metadata();
    if (!metadata.width || !metadata.height) throw new Error("INVALID_IMAGE");
    const thumbnail = await sharp(original, { limitInputPixels: 100_000_000 }).rotate().resize({ width: 720, height: 720, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    const originalId = crypto.randomUUID();
    const thumbnailId = crypto.randomUUID();
    const originalPath = `${session.contestId}/original/${originalId}.${extension}`;
    const thumbnailPath = `${session.contestId}/thumbnail/${thumbnailId}.webp`;
    let imageUrl = await uploadSupabase(originalPath, original, file.type);
    let thumbnailUrl = await uploadSupabase(thumbnailPath, thumbnail, "image/webp");

    if (!imageUrl || !thumbnailUrl) {
      // Persist permanently in Neon Cloud PostgreSQL (works on serverless without read-only filesystem issues)
      await query(
        "INSERT INTO uploaded_files (id, mime_type, data, size_bytes) VALUES ($1, $2, $3, $4)",
        [originalId, file.type, Buffer.from(original), original.length]
      );
      await query(
        "INSERT INTO uploaded_files (id, mime_type, data, size_bytes) VALUES ($1, $2, $3, $4)",
        [thumbnailId, "image/webp", Buffer.from(thumbnail), thumbnail.length]
      );
      imageUrl = `/api/images/${originalId}`;
      thumbnailUrl = `/api/images/${thumbnailId}`;
    }

    await query("INSERT INTO audit_logs (id,contest_id,actor_user_id,action_type,entity_type,entity_id,after_data) VALUES ($1,$2,$3,'IMAGE_UPLOADED','upload',$4,$5::jsonb)", [crypto.randomUUID(),session.contestId,session.id,originalId,JSON.stringify({ imageUrl,thumbnailUrl,width:metadata.width,height:metadata.height,size:file.size,type:file.type })]);
    return NextResponse.json({ imageUrl, thumbnailUrl, width: metadata.width, height: metadata.height });

  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "UPLOAD_FAILED" }, { status: 400 });
  }
}
