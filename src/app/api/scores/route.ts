import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireApiSession } from "@/lib/auth/session";
import { saveCriterionScores } from "@/lib/services/judging";
import { isTrustedMutation } from "@/lib/auth/origin";

const bodySchema = z.object({
  contestId: z.string().min(1),
  submissionId: z.string().min(1),
  criteriaVersionId: z.string().min(1),
  scores: z.array(z.object({ criterionId: z.string().min(1), score: z.number().finite().min(0), expectedVersion: z.number().int().positive().optional() })).min(1),
  comment: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  if(!isTrustedMutation(request))return NextResponse.json({error:"UNTRUSTED_ORIGIN"},{status:403});
  const session = await requireApiSession(["JUDGE", "ADMIN", "SUPER_ADMIN"]);

  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || session.contestId !== parsed.data?.contestId) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  try {
    const result = await saveCriterionScores({ ...parsed.data, judgeId: session.id, actorId: session.id });
    revalidatePath("/admin");
    revalidatePath("/admin/judges");
    revalidatePath("/admin/progress");
    revalidatePath("/admin/results");
    revalidatePath(`/admin/results/${parsed.data.submissionId}`);
    revalidatePath("/judge");
    revalidatePath("/judge/review");
    return NextResponse.json(result);

  } catch (error) {
    const code = error instanceof Error ? error.message : "SAVE_FAILED";
    const status = code === "SCORE_CONFLICT" ? 409 : code === "RESULTS_LOCKED" ? 423 : 400;
    return NextResponse.json({ error: code }, { status });
  }
}
