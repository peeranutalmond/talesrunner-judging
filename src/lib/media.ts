export type ResolvedImageSource = {
  imageUrl: string;
  thumbnailUrl: string | null;
  sourceUrl: string;
  provider: "GOOGLE_DRIVE" | "DIRECT" | "LOCAL";
};

export function getGoogleDriveFileId(value: string) {
  const input = value.trim();
  if (!input) return null;
  try {
    const url = new URL(input);
    const googleHost = url.hostname === "drive.google.com" || url.hostname === "docs.google.com" || url.hostname.endsWith(".googleusercontent.com");
    if (!googleHost) return null;
    const pathMatch = url.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ?? url.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return pathMatch?.[1] ?? url.searchParams.get("id");
  } catch {
    return null;
  }
}

export function resolveImageSource(value: string, suppliedThumbnail?: string | null): ResolvedImageSource {
  const sourceUrl = value.trim();
  const driveId = getGoogleDriveFileId(sourceUrl);
  if (driveId) {
    const encoded = encodeURIComponent(driveId);
    return {
      imageUrl: `https://drive.google.com/thumbnail?id=${encoded}&sz=w2400`,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${encoded}&sz=w800`,
      sourceUrl,
      provider: "GOOGLE_DRIVE",
    };
  }
  const local = sourceUrl.startsWith("/");
  return {
    imageUrl: sourceUrl,
    thumbnailUrl: suppliedThumbnail?.trim() || null,
    sourceUrl,
    provider: local ? "LOCAL" : "DIRECT",
  };
}
