import { Activity, CircleAlert, ClipboardCheck, ImageIcon, Trophy, UsersRound } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { getAdminDashboard } from "@/lib/services/admin";
import { Badge, Card, Progress } from "@/components/ui";
import { LiveRefresh } from "@/components/admin/live-refresh";

export default async function AdminDashboardPage() {
  const session = await requireSession(["ADMIN","SUPER_ADMIN"]);
  const data = await getAdminDashboard(session.contestId!);
  const cards = [
    ["Total submissions", data.submissions.total, ImageIcon, "text-sky-600 bg-sky-50"],
    ["Judging progress", `${Math.round(data.progress)}%`, ClipboardCheck, "text-emerald-600 bg-emerald-50"],
    ["Active judges", data.judges.filter((j) => j.status === "ACTIVE").length, UsersRound, "text-violet-600 bg-violet-50"],
    ["Incomplete runs", Math.max(0, data.totalAssignments - data.completedScores), CircleAlert, "text-amber-600 bg-amber-50"],
  ] as const;
  return <main className="p-4 sm:p-7 lg:p-9"><div className="mx-auto max-w-7xl">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-[.16em] text-sky-600">Operations dashboard</p><h1 className="mt-1 text-3xl font-black sm:text-4xl">ภาพรวมสนามตัดสิน</h1><p className="mt-2 text-slate-500">ตอบได้ทันทีว่าใครตัดสินถึงไหน และรายการใดต้องตามต่อ</p></div><div className="flex gap-2"><LiveRefresh/><Badge tone={data.contest.status === "JUDGING" ? "green" : "amber"}>{data.contest.status}</Badge></div></div>
    <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label,value,Icon,colors]) => <Card key={label} className="p-5"><div className={`grid h-11 w-11 place-items-center rounded-2xl ${colors}`}><Icon size={22}/></div><p className="mt-4 text-sm font-bold text-slate-500">{label}</p><p className="mt-1 text-3xl font-black">{value}</p></Card>)}</section>
    <section className="mt-6 grid gap-5 xl:grid-cols-[1.45fr_.75fr]">
      <Card className="p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-black uppercase tracking-wider text-sky-600">Per-judge progress</p><h2 className="mt-1 text-xl font-black">ใครยังไม่ถึงเส้นชัย?</h2></div><a className="text-sm font-bold text-sky-700" href="/admin/progress">ดูทั้งหมด →</a></div><div className="mt-5 space-y-5">{data.judges.map((judge) => { const percent=Number(judge.total_submissions)?Number(judge.completed_submissions)/Number(judge.total_submissions)*100:0; return <div key={judge.id}><div className="mb-2 flex items-center gap-3"><span className="h-9 w-9 rounded-full" style={{background:judge.avatar_color}}/><div className="min-w-0 flex-1"><div className="flex justify-between gap-3 text-sm"><strong>{judge.name}</strong><span className="font-bold text-slate-500">{judge.completed_submissions}/{judge.total_submissions}</span></div><Progress className="mt-1.5" value={percent}/></div>{percent===100&&<Trophy size={18} className="text-amber-500"/>}</div></div>})}</div></Card>
      <Card className="p-5 sm:p-6"><div className="flex items-center gap-2"><Activity size={19} className="text-sky-600"/><h2 className="text-xl font-black">ล่าสุด</h2></div><div className="mt-4 divide-y divide-blue-100">{data.activity.map((item,index)=><div key={`${item.created_at}-${index}`} className="py-3"><p className="text-sm font-black">{item.action_type.replaceAll("_"," ")}</p><p className="mt-1 text-xs text-slate-500">{item.actor_name ?? "System"} · {new Intl.DateTimeFormat("th-TH",{dateStyle:"medium",timeStyle:"short"}).format(new Date(item.created_at))}</p></div>)}</div></Card>
    </section>
  </div></main>;
}
