import { Trophy } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { getJudgeWorkspace } from "@/lib/services/judging";
import { EmptyState } from "@/components/ui";
import { ScoringWorkspace } from "@/components/judge/scoring-workspace";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function JudgePage({
  searchParams,
}: {
  searchParams: Promise<{ submission?: string; category?: string; track?: string }>;
}) {
  const session = await requireSession(["JUDGE"]);
  const params = await searchParams;
  const categoryParam = params.category || params.track;
  const workspace = await getJudgeWorkspace(session.contestId!, session.id, params.submission, categoryParam);

  if (!workspace?.current) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <EmptyState
          icon={<Trophy size={30} />}
          title="ไม่มีผลงานในหมวดนี้ หรือตรวจครบทุกผลงานแล้ว"
          detail="คุณสามารถเลือกสลับไปตรวจสนามอื่นได้ทันที"
        />
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <a
            href="/judge"
            className="arcade-btn arcade-btn-primary px-4 py-2 text-sm font-black"
          >
            🏁 ตรวจทุกสนาม
          </a>
          <a
            href="/judge/review"
            className="arcade-btn arcade-btn-secondary px-4 py-2 text-sm font-black"
          >
            📋 ดูหน้าสรุปผลการตรวจ
          </a>
        </div>
      </main>
    );
  }

  const profile = (
    await query<{ avatar_url: string | null; avatar_color: string }>(
      "SELECT avatar_url,avatar_color FROM users WHERE id=$1",
      [session.id],
    )
  )[0];

  return (
    <ScoringWorkspace
      key={workspace.current.id}
      contest={workspace.contest}
      criteria={workspace.criteria}
      queue={workspace.queue}
      current={workspace.current}
      initialRows={workspace.scoreRows}
      judgeName={session.name}
      judgeAvatarUrl={profile?.avatar_url ?? null}
      judgeAvatarColor={profile?.avatar_color ?? "#27B8FF"}
      categories={workspace.categories}
      activeCategoryId={workspace.activeCategoryId}
    />
  );
}
