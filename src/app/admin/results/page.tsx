import Link from "next/link";
import { AlertTriangle, Lock, Sparkles, Trophy, Unlock } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { getAllJudgeTopPicks, getRanking } from "@/lib/services/admin";
import { createSnapshotAction, lockResultsAction } from "@/lib/services/admin-actions";
import { LiveRefresh } from "@/components/admin/live-refresh";
import { Badge, Button, Card, Input } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const session = await requireSession(["ADMIN", "SUPER_ADMIN"]);
  const [rankingData, judgeTopPicks] = await Promise.all([
    getRanking(session.contestId!),
    getAllJudgeTopPicks(session.contestId!),
  ]);
  const { contest, rows } = rankingData;
  const incomplete = rows.filter((row) => !row.complete).length;

  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = row.categoryId ?? "uncategorized";
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  const picksByJudge = new Map<string, typeof judgeTopPicks>();
  for (const pick of judgeTopPicks) {
    picksByJudge.set(pick.judge_name, [...(picksByJudge.get(pick.judge_name) ?? []), pick]);
  }

  return (
    <main className="p-4 sm:p-7 lg:p-9">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-rowdies rounded-md border border-slate-900 bg-sky-400 px-2 py-0.5 text-[10px] font-black uppercase text-slate-950 shadow-[1px_1px_0_#0f172a]">
                Leaderboard · {contest.aggregation_method}
              </span>
            </div>
            <h1 className="font-rowdies mt-1 text-3xl font-black text-slate-950 sm:text-4xl">
              🏆 ตารางจัดอันดับผลงาน (Rankings)
            </h1>
            <p className="mt-1 text-sm font-bold text-slate-600">
              ดูรูปผลงานจริงและคะแนนแยกตามสนามประกวด · คำนวณสดใหม่จากคะแนนดิบของกรรมการ
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LiveRefresh />
            <Badge tone={contest.results_locked_at ? "red" : "green"}>
              {contest.results_locked_at ? "🔒 RESULTS LOCKED" : "⚡ EDITABLE"}
            </Badge>
          </div>
        </div>

        {incomplete > 0 && (
          <div className="comic-card-yellow mt-5 p-4 text-sm font-black text-amber-950 flex items-center gap-2">
            <AlertTriangle className="shrink-0 text-amber-600" size={20} />
            <span>
              มี {incomplete} ผลงานที่กรรมการยังให้คะแนนไม่ครบตามเกณฑ์ที่กำหนด จึงยังไม่ได้รับอันดับในหมวด
            </span>
          </div>
        )}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
          {/* Main Ranking by Category */}
          <div className="space-y-8">
            {[...groups.values()].map((categoryRows) => {
              const first = categoryRows[0];
              const topThree = categoryRows.filter((r) => r.complete && r.rank !== null && r.rank <= 3);

              return (
                <div key={first.categoryId ?? "uncategorized"} className="space-y-4">
                  {/* Category Header Banner */}
                  <div
                    className="comic-card flex items-center justify-between p-4"
                    style={{ background: `${first.categoryColor}15` }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-slate-900 text-2xl text-white shadow-[2px_2px_0_#0f172a]"
                        style={{ background: first.categoryColor }}
                      >
                        {first.categoryIcon}
                      </span>
                      <div>
                        <h2 className="font-rowdies text-2xl font-black text-slate-950">
                          {first.categoryName}
                        </h2>
                        <p className="text-xs font-bold text-slate-600">
                          {categoryRows.length} ผลงานส่งเข้าประกวด · จัดอันดับเฉพาะในหมวดนี้
                        </p>
                      </div>
                    </div>
                    <span className="font-rowdies rounded-xl border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black text-slate-950 shadow-[1px_1px_0_#0f172a]">
                      {categoryRows.filter((r) => r.complete).length} เสร็จสิ้น
                    </span>
                  </div>

                  {/* Top 3 Podium Cards (Visual Preview Showcase) */}
                  {topThree.length > 0 && (
                    <div>
                      <div className="mb-2 flex items-center gap-1.5 font-rowdies text-xs font-black uppercase text-amber-900">
                        <Sparkles size={14} className="text-amber-500" />
                        <span>TOP WINNERS · 3 อันดับแรก</span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {topThree.map((item) => {
                          const medal = item.rank === 1 ? "🥇 1st Place" : item.rank === 2 ? "🥈 2nd Place" : "🥉 3rd Place";
                          const medalBg =
                            item.rank === 1
                              ? "bg-amber-300 text-amber-950 border-amber-600"
                              : item.rank === 2
                              ? "bg-slate-200 text-slate-950 border-slate-500"
                              : "bg-orange-200 text-orange-950 border-orange-600";

                          return (
                            <Link
                              key={item.submission_id}
                              href={`/admin/results/${item.submission_id}`}
                              className="group block"
                            >
                              <div className="comic-card h-full overflow-hidden bg-white p-3 transition duration-150 group-hover:-translate-y-1.5 group-hover:shadow-[6px_6px_0_#0f172a]">
                                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border-2 border-slate-900 bg-slate-900">
                                  <img
                                    src={item.thumbnail_url || item.image_url}
                                    alt={item.artwork_title}
                                    referrerPolicy="no-referrer"
                                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                  />
                                  <span
                                    className={`font-rowdies absolute left-2 top-2 rounded-lg border-2 border-slate-900 px-2 py-0.5 text-xs font-black shadow-[1px_1px_0_#0f172a] ${medalBg}`}
                                  >
                                    {medal}
                                  </span>
                                  <span className="font-rowdies absolute bottom-2 right-2 rounded-md border border-slate-900 bg-slate-950/85 px-1.5 py-0.5 text-[10px] font-black text-white">
                                    #{item.submission_number}
                                  </span>
                                </div>
                                <div className="mt-2.5">
                                  <h3 className="font-rowdies truncate text-base font-black text-slate-950 group-hover:text-sky-600">
                                    {item.artwork_title}
                                  </h3>
                                  <p className="truncate text-xs font-bold text-slate-500">
                                    โดย {item.display_name}
                                  </p>
                                  <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
                                    <span className="text-xs font-bold text-slate-500">คะแนนเฉลี่ย</span>
                                    <span className="font-rowdies rounded-lg border border-slate-900 bg-yellow-200 px-2 py-0.5 text-sm font-black text-slate-950">
                                      ★ {item.average.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Full Ranking Table with Picture Rows */}
                  <div className="comic-card overflow-hidden bg-white p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[880px] text-left">
                        <thead className="border-b-2 border-slate-900 bg-slate-900 text-xs font-black uppercase text-white">
                          <tr>
                            <th className="px-4 py-3 text-center w-16">Rank</th>
                            <th className="px-4 py-3">ผลงาน (Artwork)</th>
                            <th className="px-4 py-3">ผู้เข้าประกวด</th>
                            <th className="px-4 py-3 text-center">คะแนนรวม</th>
                            <th className="px-4 py-3 text-center">ค่าเฉลี่ย</th>
                            <th className="px-4 py-3 text-center">คะแนนจัดอันดับ</th>
                            <th className="px-4 py-3 text-center">กรรมการ</th>
                            <th className="px-4 py-3 text-center">สถานะ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-100 font-bold">
                          {categoryRows.map((row) => {
                            const medalEmoji =
                              row.rank === 1
                                ? "🥇"
                                : row.rank === 2
                                ? "🥈"
                                : row.rank === 3
                                ? "🥉"
                                : null;

                            return (
                              <tr
                                key={row.submission_id}
                                className="transition hover:bg-sky-50/80"
                              >
                                {/* Rank Medal / Number */}
                                <td className="px-4 py-3 text-center">
                                  {row.rank ? (
                                    medalEmoji ? (
                                      <span className="text-2xl" title={`อันดับ ${row.rank}`}>
                                        {medalEmoji}
                                      </span>
                                    ) : (
                                      <span className="font-rowdies inline-block h-8 w-8 place-content-center rounded-xl border-2 border-slate-900 bg-slate-100 text-sm font-black text-slate-900 shadow-[1px_1px_0_#0f172a]">
                                        {row.rank}
                                      </span>
                                    )
                                  ) : (
                                    <span className="font-rowdies text-slate-400">—</span>
                                  )}
                                </td>

                                {/* Artwork Thumbnail + Title */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <Link
                                      href={`/admin/results/${row.submission_id}`}
                                      className="group relative shrink-0 block"
                                    >
                                      <img
                                        src={row.thumbnail_url || row.image_url}
                                        alt={row.artwork_title}
                                        referrerPolicy="no-referrer"
                                        className="h-16 w-24 rounded-xl border-2 border-slate-900 object-cover shadow-[2px_2px_0_#0f172a] transition duration-150 group-hover:scale-105 group-hover:border-sky-500"
                                      />
                                      <span className="font-rowdies absolute bottom-1 right-1 rounded bg-slate-950/85 px-1 py-0.2 text-[9px] font-black text-white">
                                        #{row.submission_number}
                                      </span>
                                    </Link>
                                    <div className="min-w-0 max-w-xs">
                                      <Link
                                        href={`/admin/results/${row.submission_id}`}
                                        className="font-rowdies block truncate text-base font-black text-slate-950 hover:text-sky-600 transition"
                                      >
                                        {row.artwork_title}
                                      </Link>
                                      <span className="text-xs font-bold text-slate-500 block truncate">
                                        #{row.submission_number} · โดย {row.display_name}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Contestant Name */}
                                <td className="px-4 py-3 text-sm text-slate-700">
                                  {row.display_name}
                                </td>

                                {/* Total Score */}
                                <td className="px-4 py-3 text-center font-rowdies text-base font-black text-slate-950">
                                  {row.total.toFixed(0)}
                                </td>

                                {/* Average Score */}
                                <td className="px-4 py-3 text-center font-rowdies text-sm font-black text-sky-700">
                                  {row.average.toFixed(2)}
                                </td>

                                {/* Aggregate Ranking Value */}
                                <td className="px-4 py-3 text-center font-rowdies text-base font-black text-slate-950">
                                  <span className="rounded-lg border border-slate-900 bg-amber-200 px-2 py-0.5">
                                    {row.aggregate.toFixed(2)}
                                  </span>
                                </td>

                                {/* Judges Count */}
                                <td className="px-4 py-3 text-center text-sm font-black text-slate-600">
                                  {row.judgeCount}/{row.requiredJudges}
                                </td>

                                {/* Status */}
                                <td className="px-4 py-3 text-center">
                                  {row.tied ? (
                                    <Badge tone="amber">⚠ TIE</Badge>
                                  ) : (
                                    <Badge tone={row.complete ? "green" : "red"}>
                                      {row.complete ? "COMPLETE" : "INCOMPLETE"}
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Judges' Choice / Top Picks Section */}
            {picksByJudge.size > 0 && (
              <div className="comic-card bg-white p-5 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-slate-900 bg-amber-400 text-slate-950 shadow-[2px_2px_0_#0f172a]">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="font-rowdies text-2xl font-black text-slate-950">
                      ⭐ รางวัลขวัญใจกรรมการ (Judges&apos; Choice Awards)
                    </h2>
                    <p className="text-xs font-bold text-slate-500">
                      ผลงานที่กรรมการแต่ละท่านติ๊กเลือกเป็น Top Picks (3 - 5 อันดับที่ชื่นชอบที่สุด)
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  {[...picksByJudge.entries()].map(([judgeName, picks]) => (
                    <div
                      key={judgeName}
                      className="rounded-2xl border-2 border-slate-900 bg-amber-50/40 p-4 space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-rowdies rounded-lg border border-slate-900 bg-sky-400 px-2.5 py-1 text-xs font-black text-slate-950 shadow-sm">
                          กรรมการ: {judgeName}
                        </span>
                        <span className="text-xs font-bold text-slate-600">
                          เลือก {picks.length} ผลงาน
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                        {picks.map((pick) => {
                          const medals = ["🥇", "🥈", "🥉", "⭐", "⭐"];
                          const medal = medals[pick.rank_order - 1] ?? "⭐";
                          return (
                            <div
                              key={pick.submission_id}
                              className="comic-card flex flex-col justify-between p-2.5 bg-white overflow-hidden"
                            >
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="inline-flex items-center gap-1 rounded-md border border-slate-900 bg-amber-300 px-1.5 py-0.2 text-[11px] font-black text-slate-950">
                                    <span>{medal}</span>
                                    <span>อันดับ {pick.rank_order}</span>
                                  </span>
                                  <span className="font-rowdies text-[11px] font-black text-sky-700">
                                    #{pick.submission_number}
                                  </span>
                                </div>
                                <div className="aspect-video w-full overflow-hidden rounded-lg border border-slate-900 bg-slate-950 mb-1.5">
                                  <img
                                    src={pick.thumbnail_url || pick.image_url}
                                    alt={pick.artwork_title}
                                    referrerPolicy="no-referrer"
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <h4
                                  className="font-rowdies truncate text-xs font-black text-slate-900"
                                  title={pick.artwork_title}
                                >
                                  {pick.artwork_title}
                                </h4>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Snapshots & Locking */}
          <div className="space-y-4">
            {/* Snapshot Card */}
            <Card className="p-5 bg-white">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-amber-500" />
                <h2 className="font-rowdies text-lg font-black text-slate-950">
                  Result Snapshot
                </h2>
              </div>
              <p className="mt-1 text-xs font-bold text-slate-500">
                เก็บสำเนาตารางอันดับทุกหมวดพร้อมสูตรคำนวณในขณะนี้ไว้เป็นหลักฐาน
              </p>
              <form action={createSnapshotAction} className="mt-4 space-y-3">
                <Input name="name" placeholder="เช่น Final Result รอบชิง" required />
                <Button className="w-full" variant="primary">
                  บันทึก Snapshot
                </Button>
              </form>
            </Card>

            {/* Lock Results Card */}
            <Card className="p-5 bg-white">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600" />
                <h2 className="font-rowdies text-lg font-black text-slate-950">
                  {contest.results_locked_at ? "Unlock Results" : "Lock Final Results"}
                </h2>
              </div>
              <p className="mt-2 text-xs font-bold text-slate-500">
                {contest.results_locked_at
                  ? "การปลดล็อกจะถูกบันทึกลงใน Audit Log"
                  : "เมื่อล็อกผลแล้ว กรรมการจะไม่สามารถบันทึกหรือแก้ไขคะแนนได้อีก"}
              </p>
              <form action={lockResultsAction} className="mt-4 space-y-3">
                <input
                  type="hidden"
                  name="mode"
                  value={contest.results_locked_at ? "unlock" : "lock"}
                />
                <Input
                  name="confirmation"
                  placeholder={`พิมพ์ ${contest.results_locked_at ? "UNLOCK" : "LOCK"}`}
                  required
                />
                <Button
                  className="w-full"
                  variant={contest.results_locked_at ? "secondary" : "danger"}
                >
                  {contest.results_locked_at ? <Unlock size={16} /> : <Lock size={16} />}{" "}
                  {contest.results_locked_at ? "ปลดล็อกผล" : "ล็อกผลการตัดสิน"}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
