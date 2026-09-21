import { Activity, Flag, History, Target } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { getContestAnalytics } from "@/lib/services/admin";
import { Card } from "@/components/ui";

export default async function AnalyticsPage() {
  const session = await requireSession(["ADMIN", "SUPER_ADMIN"]);
  const data = await getContestAnalytics(session.contestId!);
  const cards = [
    ["Complete artworks", data.completed, Target],
    ["Incomplete artworks", data.incomplete, Activity],
    ["Score revisions", data.scoreEdits, History],
    ["Judge flags", data.flags, Flag],
  ] as const;
  return <main className="p-4 sm:p-7 lg:p-9"><div className="mx-auto max-w-6xl">
    <p className="text-sm font-black uppercase tracking-[.16em] text-sky-600">Analytics</p><h1 className="mt-1 text-3xl font-black">คุณภาพและภาพรวมคะแนน</h1><p className="mt-2 text-slate-500">คำนวณจาก raw score ของ Criteria Version ที่ใช้งานอยู่</p>
    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label,value,Icon])=><Card className="p-5" key={label}><Icon className="text-sky-600" size={20}/><p className="mt-3 text-sm font-bold text-slate-500">{label}</p><p className="mt-1 text-3xl font-black">{value}</p></Card>)}</div>
    <Card className="mt-5 p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-black">Criterion averages</h2><p className="mt-1 text-sm text-slate-500">ค่าเฉลี่ยรวมของผลงานที่ตัดสินแล้ว: {data.average.toFixed(2)} / 100</p></div></div><div className="mt-5 space-y-4">{data.criteria.map((criterion)=>{const average=Number(criterion.average??0);const percent=average/Number(criterion.max_score)*100;return <div key={criterion.id}><div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><strong>{criterion.name}</strong><span>{average.toFixed(2)} / {criterion.max_score} · {criterion.score_count} records</span></div><div className="h-3 overflow-hidden rounded-full bg-blue-100"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500" style={{width:`${Math.max(0,Math.min(100,percent))}%`}}/></div><p className="mt-1 text-xs text-slate-400">Range {criterion.minimum??"—"}–{criterion.maximum??"—"}</p></div>})}</div></Card>
  </div></main>;
}
