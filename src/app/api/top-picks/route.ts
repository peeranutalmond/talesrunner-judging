import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireApiSession } from "@/lib/auth/session";
import { isTrustedMutation } from "@/lib/auth/origin";
import { getJudgeTopPicks, saveJudgeTopPicks } from "@/lib/services/judging";

const postSchema = z.object({
  contestId: z.string().min(1),
  picks: z
    .array(
      z.object({
        submissionId: z.string().min(1),
        rankOrder: z.number().int().min(1).max(10),
        note: z.string().max(500).optional(),
      }),
    )
    .min(1)
    .max(10),
});

export async function GET(request: Request) {
  const session = await requireApiSession(["JUDGE", "ADMIN", "SUPER_ADMIN"]);
  if (!session || !session.contestId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const url = new URL(request.url);
  const judgeId = url.searchParams.get("judgeId") || session.id;
  const picks = await getJudgeTopPicks(session.contestId, judgeId);
  return NextResponse.json({ picks });
}

export async function POST(request: Request) {
  if (!isTrustedMutation(request)) {
    return NextResponse.json({ error: "UNTRUSTED_ORIGIN" }, { status: 403 });
  }
  const session = await requireApiSession(["JUDGE"]);
  if (!session || !session.contestId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || session.contestId !== parsed.data.contestId) {
    return NextResponse.json({ error: "INVALID_REQUEST", details: parsed.error }, { status: 400 });
  }

  try {
    const result = await saveJudgeTopPicks(session.contestId, session.id, parsed.data.picks);
    revalidatePath("/judge/review");
    revalidatePath("/judge");
    revalidatePath("/admin/results");
    return NextResponse.json(result);
  } catch (err) {
    const code = err instanceof Error ? err.message : "SAVE_FAILED";
    const status = code === "RESULTS_LOCKED" ? 423 : 400;
    return NextResponse.json({ error: code }, { status });
  }
}
