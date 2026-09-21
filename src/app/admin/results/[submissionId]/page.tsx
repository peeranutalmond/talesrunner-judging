import Link from "next/link";
import { ArrowLeft, History, ShieldCheck } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { getSubmissionScoreDetail } from "@/lib/services/admin";
import { reviseJudgeScoresAction } from "@/lib/services/admin-actions";
import { Badge, Button, Card, Input } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SubmissionResultPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const session = await requireSession(["ADMIN", "SUPER_ADMIN"]);
  const { submissionId } = await params;
  const detail = await getSubmissionScoreDetail(session.contestId!, submissionId);
  if (!detail) return <main className="p-8"><p>ไม่พบผลงาน</p></main>;
  const { contest, submission, criteria, judges, scores, revisions } = detail;
  const scoreMap = new Map(scores.map((score) => [`${score.judge_id}:${score.criterion_id}`, score]));
  const requiredJudges=judges.filter(judge=>judge.required&&judge.status==="ACTIVE");
  const completeJudgeTotals=requiredJudges.map(judge=>criteria.map(criterion=>scoreMap.get(`${judge.id}:${criterion.id}`))).filter(rows=>rows.every(Boolean)).map(rows=>rows.reduce((sum,row)=>sum+Number(row?.score??0),0));
  const overallTotal=completeJudgeTotals.reduce((sum,value)=>sum+value,0); const overallAverage=completeJudgeTotals.length?overallTotal/completeJudgeTotals.length:0;

  return <main className="p-4 sm:p-7 lg:p-9"><div className="mx-auto max-w-6xl">
    <Link href="/admin/results" className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm font-bold text-sky-700"><ArrowLeft size={16}/> กลับไปผลคะแนน</Link>
    <div className="mt-5 grid gap-5 lg:grid-cols-[300px_1fr]">
      <Card className="h-fit overflow-hidden p-3"><img src={submission.image_url} alt={submission.artwork_title} className="aspect-square w-full rounded-2xl bg-slate-100 object-cover"/><div className="p-3"><p className="text-sm font-black uppercase tracking-widest text-sky-600">Artwork #{submission.submission_number}</p><h1 className="mt-1 text-2xl font-black">{submission.artwork_title}</h1><p className="mt-2 text-sm text-slate-500">{submission.display_name} · {submission.player_id}</p><div className="mt-3 flex gap-2"><Badge tone={submission.status === "ACTIVE" ? "green" : "red"}>{submission.status}</Badge><Badge tone={contest.results_locked_at ? "red" : "blue"}>{contest.results_locked_at ? "LOCKED" : "EDITABLE"}</Badge></div></div></Card>
      <div className="space-y-4">
        <div><p className="text-sm font-black uppercase tracking-[.16em] text-sky-600">Raw score breakdown</p><h2 className="mt-1 text-3xl font-black">คะแนนรายกรรมการ × รายเกณฑ์</h2><p className="mt-2 text-slate-500">ทุกการแก้ไขต้องระบุเหตุผล และจะสร้าง Score Revision + Audit Log โดยอัตโนมัติ</p></div>
        <Card className="p-5"><div className="grid gap-4 sm:grid-cols-3"><div><p className="text-sm font-bold text-slate-500">Overall total</p><p className="mt-1 text-3xl font-black">{overallTotal} <span className="text-sm text-slate-400">/ {completeJudgeTotals.length*100}</span></p></div><div><p className="text-sm font-bold text-slate-500">Average</p><p className="mt-1 text-3xl font-black">{overallAverage.toFixed(2)}</p></div><div><p className="text-sm font-bold text-slate-500">Required judges</p><p className="mt-1 text-3xl font-black">{completeJudgeTotals.length}/{requiredJudges.length}</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{criteria.map(criterion=>{const values=requiredJudges.map(judge=>scoreMap.get(`${judge.id}:${criterion.id}`)?.score).filter((value):value is number=>value!==undefined);const average=values.length?values.reduce((sum,value)=>sum+Number(value),0)/values.length:0;return <div key={criterion.id} className="rounded-xl bg-sky-50 p-3"><div className="flex justify-between gap-3 text-sm"><strong>{criterion.name}</strong><span>{average.toFixed(2)} / {criterion.max_score}</span></div></div>})}</div></Card>
        {judges.map((judge) => {
          const judgeScores = criteria.map((criterion) => scoreMap.get(`${judge.id}:${criterion.id}`));
          const total = judgeScores.reduce((sum, row) => sum + Number(row?.score ?? 0), 0);
          const complete = judgeScores.every(Boolean);
          const comment = judgeScores.find(Boolean)?.comment ?? "";
          return <Card key={judge.id} className="p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><h3 className="text-xl font-black">{judge.name}</h3><Badge tone={complete ? "green" : "amber"}>{complete ? "COMPLETE" : "NOT SCORED"}</Badge></div><p className="mt-1 text-sm text-slate-500">Raw total {total} / {criteria.reduce((sum, criterion) => sum + Number(criterion.max_score), 0)}</p></div><span className="text-3xl font-black">{total}</span></div>
            <form action={reviseJudgeScoresAction} className="mt-5 space-y-4">
              <input type="hidden" name="submissionId" value={submission.id}/><input type="hidden" name="judgeId" value={judge.id}/><input type="hidden" name="criteriaVersionId" value={contest.active_criteria_version_id}/>
              <div className="grid gap-3 sm:grid-cols-2">{criteria.map((criterion, index) => {const score=judgeScores[index];return <label key={criterion.id} className="rounded-2xl border border-blue-100 bg-white p-3"><span className="flex items-center justify-between gap-3 text-sm font-black"><span>{criterion.name}</span><span className="text-slate-400">/ {criterion.max_score}</span></span><Input className="mt-2" name={`score_${criterion.id}`} type="number" min={0} max={criterion.max_score} step="0.01" defaultValue={score?.score ?? ""} required/><input type="hidden" name={`version_${criterion.id}`} value={score?.version ?? ""}/></label>})}</div>
              <label className="block"><span className="mb-1.5 block text-sm font-bold">Internal comment</span><textarea name="comment" defaultValue={comment} className="focus-ring min-h-20 w-full rounded-xl border border-blue-200 bg-white p-3"/></label>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]"><label><span className="mb-1.5 flex items-center gap-2 text-sm font-bold"><ShieldCheck size={15}/> เหตุผลที่แก้ไข <span className="text-red-500">*</span></span><Input name="reason" minLength={3} maxLength={500} placeholder="เช่น แก้ตามใบคะแนนที่กรรมการยืนยัน" required/></label><Button className="self-end" disabled={Boolean(contest.results_locked_at)}>Save revision</Button></div>
            </form>
          </Card>;
        })}
        <Card className="p-5"><div className="flex items-center gap-2"><History className="text-sky-600"/><h2 className="text-xl font-black">Score revision history</h2></div>{revisions.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr className="border-b border-blue-100 text-slate-500"><th className="py-2 pr-3">Time</th><th className="py-2 pr-3">Change</th><th className="py-2 pr-3">Changed by</th><th className="py-2">Reason</th></tr></thead><tbody>{revisions.map((revision)=><tr key={revision.id} className="border-b border-blue-50"><td className="py-3 pr-3">{new Intl.DateTimeFormat("th-TH",{dateStyle:"short",timeStyle:"short"}).format(new Date(revision.changed_at))}</td><td className="py-3 pr-3 font-black">{revision.previous_score ?? "—"} → {revision.new_score}</td><td className="py-3 pr-3">{revision.changed_by_name}</td><td className="py-3">{revision.change_reason ?? "—"}</td></tr>)}</tbody></table></div>:<p className="mt-3 text-sm text-slate-500">ยังไม่มีการแก้ไขคะแนนของผลงานนี้</p>}</Card>
      </div>
    </div>
  </div></main>;
}
