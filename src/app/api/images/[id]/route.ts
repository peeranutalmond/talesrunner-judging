import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return new Response("Invalid image ID", { status: 400 });
  }

  try {
    const rows = await query<{ mime_type: string; data: Buffer }>(
      "SELECT mime_type, data FROM uploaded_files WHERE id = $1 LIMIT 1",
      [id]
    );

    const image = rows[0];
    if (!image || !image.data) {
      return new Response("Image not found", { status: 404 });
    }

    return new Response(new Uint8Array(image.data), {
      status: 200,
      headers: {
        "Content-Type": image.mime_type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });

  } catch (error) {
    console.error("Error serving uploaded image:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
