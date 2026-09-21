import { CheckCircle2, Flag, Timer } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { getJudgeProgress } from "@/lib/services/admin";
import { LiveRefresh } from "@/components/admin/live-refresh";
import { Badge, Card, Progress } from "@/components/ui";

export default async function ProgressPage(){
  const session=await requireSession(["ADMIN","SUPER_ADMIN"]); const judges=await getJudgeProgress(session.contestId!);
  return <main className="p-4 sm:p-7 lg:p-9"><div className="mx-auto max-w-5xl"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black uppercase tracking-[.16em] text-sky-600">Judging progress</p><h1 className="mt-1 text-3xl font-black">เส้นทางของกรรมการ</h1><p className="mt-2 text-slate-500">รายการนี้อิงจากคะแนนครบทุกเกณฑ์ของแต่ละผลงาน</p></div><LiveRefresh/></div><div className="mt-6 space-y-4">{judges.map(judge=>{const total=Number(judge.total_submissions),done=Number(judge.completed_submissions),percent=total?done/total*100:0;return <Card key={judge.id} className="p-5"><div className="flex flex-wrap items-center gap-4"><span className="h-12 w-12 rounded-full" style={{background:judge.avatar_color}}/><div className="min-w-40 flex-1"><div className="flex justify-between gap-3"><h2 className="font-black">{judge.name}</h2><strong>{done}/{total}</strong></div><Progress className="mt-2" value={percent}/></div><div className="flex gap-2"><Badge tone={done===total?"green":"amber"}>{done===total?<><CheckCircle2 size={13}/> Complete</>:<><Timer size={13}/> {total-done} remaining</>}</Badge>{Number(judge.flagged)>0&&<Badge tone="amber"><Flag size={13}/> {judge.flagged}</Badge>}</div></div></Card>})}</div></div></main>;
}
