import { CheckCircle2, Flag, LogOut, Sparkles, Star, Trophy } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import { requireSession } from "@/lib/auth/session";
import { getContest, getJudgeCategoryStats, getJudgeQueue, getJudgeTopPicks } from "@/lib/services/judging";
import { Badge, Button, Progress } from "@/components/ui";
import { FinalTopPicks } from "@/components/judge/final-top-picks";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    complete?: string;
    filter?: string;
    category?: string;
    track?: string;
    tab?: string;
  }>;
}) {
  const session = await requireSession(["JUDGE"]);
  const params = await searchParams;
  const categoryParam = params.category || params.track;
  const isSpecificCat = Boolean(categoryParam && categoryParam !== "all");

  const [queue, categories, contest, initialTopPicks] = await Promise.all([
    getJudgeQueue(session.contestId!, session.id, isSpecificCat ? categoryParam : undefined),
    getJudgeCategoryStats(session.contestId!, session.id),
    getContest(session.contestId!),
    getJudgeTopPicks(session.contestId!, session.id),
  ]);
  const completed = queue.filter((item) => item.complete);
  const flagged = queue.filter((item) => item.flagged);
  const incomplete = queue.filter((item) => !item.complete);
  const filter = params.filter ?? "all";
  const visible =
    filter === "completed"
      ? completed
      : filter === "incomplete"
      ? incomplete
      : filter === "flagged"
      ? flagged
      : queue;
  const done = queue.length > 0 && completed.length === queue.length;
  const progressPct = Math.round((completed.length / Math.max(queue.length, 1)) * 100);
  const catQuery = isSpecificCat ? `&category=${categoryParam}` : "";
  const activeTab = params.tab ?? (done || params.complete ? "top-picks" : "top-picks");

  return (
    <main className="min-h-screen px-4 py-8 sm:px-7">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-rowdies rounded-md border border-slate-900 bg-sky-400 px-2 py-0.5 text-[10px] font-black uppercase text-slate-950 shadow-[1px_1px_0_#0f172a]">
                Judging Review
              </span>
              <span className="font-rowdies text-xs font-black text-slate-500">
                RUNNER: {session.name}
              </span>
            </div>
            <h1 className="font-rowdies mt-1 text-3xl font-black text-slate-950 sm:text-4xl">
              {done ? "🏆 ALL STAGES CLEARED!" : "🏁 ตรวจสอบผลงานก่อนเข้าเส้นชัย"}
            </h1>
            <p className="mt-1 text-sm font-bold text-slate-600">
              ให้คะแนนแล้ว {completed.length} จาก {queue.length} ผลงาน
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={isSpecificCat ? `/judge?category=${categoryParam}` : "/judge"}
              className="arcade-btn arcade-btn-primary px-4 py-2 text-sm font-black"
            >
              ← กลับไปตัดสิน
            </a>
            <form action={logoutAction}>
              <Button variant="secondary" className="flex items-center gap-1.5">
                <LogOut size={16} /> ออกจากระบบ
              </Button>
            </form>
          </div>
        </div>

        {/* Track / Stadium Selector */}
        {categories.length > 1 && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border-2 border-slate-900 bg-white p-2.5 shadow-[3px_3px_0_#0f172a]">
            <div className="flex items-center gap-2 pl-1.5">
              <span className="text-base">🏟️</span>
              <span className="font-rowdies text-xs font-black uppercase tracking-wider text-slate-800">
                เลือกสนามตรวจทาน:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => {
                const isActive = isSpecificCat
                  ? cat.id === categoryParam || cat.slug === categoryParam
                  : cat.id === "all";
                const href = cat.id === "all" ? "/judge/review" : `/judge/review?category=${cat.id}`;
                return (
                  <a
                    key={cat.id}
                    href={href}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition-all ${
                      isActive
                        ? "border-2 border-slate-900 bg-sky-400 text-slate-950 shadow-[2px_2px_0_#0f172a] -translate-y-0.5"
                        : "border border-slate-300 bg-slate-100 text-slate-700 hover:bg-white hover:border-slate-800"
                    }`}
                  >
                    <span>{cat.icon || "🎨"}</span>
                    <span>{cat.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                        isActive
                          ? "border border-slate-900 bg-yellow-300 text-slate-950"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {cat.count}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Progress Card */}
        <div className="comic-card mt-5 p-5 bg-white">
          <div className="flex items-center justify-between">
            <span className="font-rowdies text-sm font-black text-slate-900 flex items-center gap-1.5">
              <span>ความคืบหน้ารวม</span>
              <Sparkles size={16} className="text-amber-500" />
            </span>
            <span className="font-rowdies text-base font-black text-sky-700">
              {progressPct}% XP
            </span>
          </div>
          <Progress className="mt-2.5" value={progressPct} />
        </div>

        {/* Completion Celebration Banner */}
        {params.complete && done && (
          <div className="comic-card-yellow mt-5 p-5 animate-pop-in">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-slate-900 bg-amber-400 text-slate-950 shadow-[2px_2px_0_#0f172a]">
                <Trophy size={26} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-rowdies text-lg font-black text-slate-950">
                  ยินดีด้วย! คุณให้คะแนนครบทุกผลงานแล้ว 🎉
                </h3>
                <p className="text-xs font-bold text-slate-700">
                  คุณสามารถตรวจทานผลงานที่ Flag ไว้เพื่อแก้ไข หรือออกจากระบบได้อย่างปลอดภัย
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stage Tabs (Top Picks vs Criteria Scores) */}
        <div className="mt-6 flex flex-wrap gap-2.5">
          <a
            href={`/judge/review?tab=top-picks${catQuery}`}
            className={`arcade-btn px-5 py-2.5 text-xs sm:text-sm font-black flex items-center gap-2 ${
              activeTab === "top-picks"
                ? "arcade-btn-warning shadow-[4px_4px_0_#0f172a] -translate-y-0.5"
                : "arcade-btn-secondary"
            }`}
          >
            <Star size={16} className="text-amber-500 fill-amber-400" />
            <span>⭐ จัดอันดับ &amp; ติ๊กเลือก Top Picks (3-5 อัน)</span>
            {initialTopPicks.length > 0 && (
              <span className="rounded-full bg-slate-900 text-amber-300 px-2 py-0.5 text-[11px] font-black">
                {initialTopPicks.length} อัน
              </span>
            )}
          </a>
          <a
            href={`/judge/review?tab=scores${catQuery}`}
            className={`arcade-btn px-5 py-2.5 text-xs sm:text-sm font-black flex items-center gap-2 ${
              activeTab === "scores"
                ? "arcade-btn-warning shadow-[4px_4px_0_#0f172a] -translate-y-0.5"
                : "arcade-btn-secondary"
            }`}
          >
            <span>📋 ตรวจทานคะแนนรายเกณฑ์</span>
          </a>
        </div>

        {activeTab === "top-picks" ? (
          <div className="mt-6">
            <FinalTopPicks
              contestId={session.contestId!}
              judgeId={session.id}
              judgeName={session.name}
              queue={queue}
              categories={categories}
              initialTopPicks={initialTopPicks}
              contest={contest!}
            />
          </div>
        ) : (
          <div>
            {/* Filter Tabs */}
            <nav className="mt-6 flex flex-wrap gap-2.5">
              {[
                ["all", `ทั้งหมด (${queue.length})`],
                ["completed", `ให้คะแนนแล้ว (${completed.length})`],
                ["incomplete", `ยังไม่เสร็จ (${incomplete.length})`],
                ["flagged", `★ ติดธงไว้ (${flagged.length})`],
              ].map(([key, label]) => (
                <a
                  key={key}
                  href={`/judge/review?tab=scores&filter=${key}${catQuery}`}
                  className={`arcade-btn px-4 py-2 text-xs font-black sm:text-sm ${
                    filter === key
                      ? "arcade-btn-warning"
                      : "arcade-btn-secondary"
                  }`}
                >
                  {label}
                </a>
              ))}
            </nav>

            {/* Artwork Gallery Grid */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((item) => (
                <a href={`/judge?submission=${item.id}${catQuery}`} key={item.id} className="group">
                  <div className="comic-card flex h-full gap-3.5 p-3.5 bg-white transition duration-150 group-hover:-translate-y-1 group-hover:border-sky-600 group-hover:shadow-[6px_6px_0_#0f172a]">
                    <div className="relative shrink-0 overflow-hidden rounded-xl border-2 border-slate-900 bg-slate-900">
                      <img
                        src={item.thumbnail_url ?? item.image_url}
                        alt={item.artwork_title}
                        referrerPolicy="no-referrer"
                        className="h-24 w-32 object-cover transition duration-200 group-hover:scale-105"
                      />
                      {item.flagged && (
                        <span className="absolute left-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full border border-slate-900 bg-amber-400 text-slate-950 shadow-sm">
                          <Flag size={13} fill="currentColor" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge tone={item.complete ? "green" : "amber"}>
                            {item.complete ? (
                              <>
                                <CheckCircle2 size={12} strokeWidth={3} /> Complete
                              </>
                            ) : (
                              "Incomplete"
                            )}
                          </Badge>
                          {item.top_pick_rank && (
                            <span className="rounded-md border border-slate-900 bg-amber-400 text-slate-950 px-1.5 py-0.2 text-[10px] font-black">
                              Top #{item.top_pick_rank}
                            </span>
                          )}
                        </div>
                        <h2 className="font-rowdies mt-1.5 truncate text-base font-black text-slate-950">
                          #{item.submission_number} {item.artwork_title}
                        </h2>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                        <span>
                          {item.score_count}/{item.criterion_count} เกณฑ์ (⭐ {item.my_total_score} คะแนน)
                        </span>
                        <span className="font-rowdies text-sky-600 group-hover:underline">
                          แก้ไข →
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
