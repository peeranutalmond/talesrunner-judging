import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/session";
import { setJudgeFlag } from "@/lib/services/judging";
import { isTrustedMutation } from "@/lib/auth/origin";

const schema = z.object({ contestId: z.string(), submissionId: z.string(), flagged: z.boolean() });

export async function POST(request: Request) {
  if(!isTrustedMutation(request))return NextResponse.json({error:"UNTRUSTED_ORIGIN"},{status:403});
  const session = await requireApiSession(["JUDGE"]);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.contestId !== session.contestId) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  try {
    return NextResponse.json(await setJudgeFlag(parsed.data.contestId, session.id, parsed.data.submissionId, parsed.data.flagged));
  } catch {
    return NextResponse.json({ error: "FLAG_FAILED" }, { status: 400 });
  }
}
