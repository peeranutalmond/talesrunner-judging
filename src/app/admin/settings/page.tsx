import { ShieldCheck } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { getContest, getCriteria } from "@/lib/services/judging";
import { updateSettingsAction } from "@/lib/services/admin-actions";
import { Button, Card } from "@/components/ui";

const Select=({name,label,value,options}:{name:string;label:string;value:string;options:string[]})=><label className="text-sm font-bold">{label}<select name={name} defaultValue={value} className="focus-ring mt-2 min-h-11 w-full rounded-xl border border-blue-200 bg-white px-3">{options.map(option=><option key={option}>{option}</option>)}</select></label>;
const Toggle=({name,label,checked}:{name:string;label:string;checked:boolean})=><label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-blue-100 bg-white p-3"><span className="text-sm font-bold">{label}</span><input type="checkbox" name={name} defaultChecked={checked} className="h-5 w-5 accent-sky-500"/></label>;

export default async function SettingsPage(){
  const session=await requireSession(["ADMIN","SUPER_ADMIN"]); const contest=await getContest(session.contestId!); const criteria=await getCriteria(contest!.active_criteria_version_id);
  return <main className="p-4 sm:p-7 lg:p-9"><div className="mx-auto max-w-4xl">
    <p className="text-sm font-black uppercase tracking-[.16em] text-sky-600">Settings</p><h1 className="mt-1 text-3xl font-black">ตั้งค่าการตัดสิน</h1><p className="mt-2 text-slate-500">การเปลี่ยนแปลงสำคัญทั้งหมดถูกบันทึกใน Audit Log</p>
    <form action={updateSettingsAction}><Card className="mt-6 p-5 sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2"><Select name="contestStatus" label="Contest status" value={contest!.status} options={["DRAFT","OPEN","JUDGING","COMPLETED","ARCHIVED"]}/><Select name="aggregationMethod" label="Aggregation method" value={contest!.aggregation_method} options={["SUM","AVERAGE","MEDIAN","DROP_HIGHEST_LOWEST"]}/><label className="text-sm font-bold">Tie breaker<select name="tieBreaker" defaultValue={contest!.tie_breaker} className="focus-ring mt-2 min-h-11 w-full rounded-xl border border-blue-200 bg-white px-3"><option value="MANUAL">Manual admin decision</option>{criteria.map(item=><option key={item.id} value={`CRITERION:${item.id}`}>Higher total: {item.name}</option>)}</select></label><Select name="loginMode" label="Judge login mode" value={contest!.judge_login_mode} options={["PICKER","PICKER_PIN","ACCOUNT"]}/><Select name="judgingOrder" label="Judging order" value={contest!.judging_order} options={["SUBMISSION_NUMBER","RANDOM_PER_JUDGE","SAME_RANDOM"]}/><Select name="inputMode" label="Score input mode" value={contest!.input_mode} options={["SLIDER","STEPPER","NUMBER","QUICK"]}/><Select name="commentMode" label="Comment requirement" value={contest!.comment_mode} options={["DISABLED","OPTIONAL","REQUIRED"]}/></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2"><Toggle name="anonymousJudging" label="Anonymous judging" checked={contest!.anonymous_judging}/><Toggle name="allowJudgeEditing" label="Allow judge editing" checked={contest!.allow_judge_editing}/><Toggle name="progressAnimations" label="Progress animations" checked={contest!.progress_animations}/><Toggle name="metadataVisibility" label="Artwork metadata visibility" checked={contest!.metadata_visibility}/></div>
      <div className="mt-6 flex items-center justify-between rounded-2xl bg-sky-50 p-4"><div className="flex items-center gap-3"><ShieldCheck className="text-sky-700"/><p className="text-sm font-bold text-slate-600">ระบบตรวจสิทธิ์ซ้ำบนเซิร์ฟเวอร์ทุกครั้ง</p></div><Button>Save settings</Button></div>
    </Card></form>
  </div></main>;
}
