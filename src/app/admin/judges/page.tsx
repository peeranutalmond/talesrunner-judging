import { Trash2, UserCheck, UserRound, Users, UserX } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { getJudgeProgress } from "@/lib/services/admin";
import {
  deleteJudgeAction,
  toggleJudgeAction,
  toggleJudgeRequiredAction,
  updateJudgeProfileAction,
} from "@/lib/services/admin-actions";
import { AddJudgeModal } from "@/components/admin/add-judge-modal";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Badge, Button, Card, EmptyState, Input, Progress } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function JudgesPage() {
  const session = await requireSession(["ADMIN", "SUPER_ADMIN"]);
  const judges = await getJudgeProgress(session.contestId!);

  return (
    <main className="p-4 sm:p-7 lg:p-9">
      <div className="mx-auto max-w-6xl">
        {/* Header & Action Bar */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-slate-900 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-rowdies rounded-md border border-slate-900 bg-sky-400 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-[1px_1px_0_#0f172a]">
                Runner Roster
              </span>
              <Badge tone="blue">
                <Users size={13} className="inline mr-1" />
                {judges.length} กรรมการ
              </Badge>
            </div>
            <h1 className="font-rowdies mt-2 text-3xl font-black text-slate-950 sm:text-4xl drop-shadow-[0_1px_0_#ffffff]">
              ทีมกรรมการตัดสิน
            </h1>
            <p className="mt-1.5 text-sm font-bold text-slate-600">
              เพิ่ม ลบ และกำหนดรหัสผ่าน PIN ของกรรมการแต่ละท่านได้อย่างอิสระ
            </p>
          </div>

          {/* Add Judge Modal */}
          <AddJudgeModal />
        </div>

        {/* Empty State */}
        {judges.length === 0 && (
          <div className="mt-8">
            <EmptyState
              icon={<UserRound size={36} />}
              title="ยังไม่มีกรรมการในการประกวดนี้"
              detail="กดปุ่ม 'เพิ่มกรรมการใหม่' ด้านบน เพื่อกำหนดชื่อและรหัส PIN ให้กรรมการเข้าตัดสินผลงาน"
            />
          </div>
        )}

        {/* Judges Grid */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {judges.map((judge) => {
            const total = Number(judge.total_submissions);
            const done = Number(judge.completed_submissions);
            const percent = total ? (done / total) * 100 : 0;

            return (
              <Card
                key={judge.id}
                className="relative overflow-hidden border-3 border-slate-900 bg-white p-5 shadow-[4px_4px_0_#0f172a]"
              >
                <div className="flex items-start gap-4">
                  {judge.avatar_url ? (
                    <img
                      src={judge.avatar_url}
                      alt={`โปรไฟล์ ${judge.name}`}
                      className="h-16 w-16 shrink-0 rounded-2xl border-2 border-slate-900 bg-slate-100 object-cover shadow-[2px_2px_0_#0f172a]"
                    />
                  ) : (
                    <span
                      className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border-2 border-slate-900 text-white shadow-[2px_2px_0_#0f172a]"
                      style={{ background: judge.avatar_color }}
                    >
                      <UserRound size={30} />
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="font-rowdies truncate text-xl font-black text-slate-950">
                        {judge.name}
                      </h2>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone={judge.required ? "blue" : "slate"}>
                          {judge.required ? "REQUIRED" : "OPTIONAL"}
                        </Badge>
                        <Badge tone={judge.status === "ACTIVE" ? "green" : "red"}>
                          {judge.status}
                        </Badge>
                      </div>
                    </div>

                    <p className="mt-1 font-mono text-xs font-bold text-slate-600">
                      ตรวจแล้ว {done}/{total} ชิ้น · ธง {judge.flagged} ชิ้น
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>ความคืบหน้าการตรวจ</span>
                    <span>{Math.round(percent)}%</span>
                  </div>
                  <Progress value={percent} />
                </div>

                {/* Status Toggle Actions */}
                <div className="mt-4 grid grid-cols-2 gap-2 border-t-2 border-slate-100 pt-3">
                  <form action={toggleJudgeRequiredAction}>
                    <input type="hidden" name="judgeId" value={judge.id} />
                    <input
                      type="hidden"
                      name="required"
                      value={judge.required ? "false" : "true"}
                    />
                    <Button variant="secondary" className="w-full text-xs">
                      {judge.required ? "เปลี่ยนเป็น Optional" : "เปลี่ยนเป็น Required"}
                    </Button>
                  </form>

                  <form action={toggleJudgeAction}>
                    <input type="hidden" name="judgeId" value={judge.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={judge.status === "ACTIVE" ? "DISABLED" : "ACTIVE"}
                    />
                    <Button
                      variant={judge.status === "ACTIVE" ? "secondary" : "success"}
                      className="w-full text-xs"
                    >
                      {judge.status === "ACTIVE" ? (
                        <>
                          <UserX size={14} /> ปิดใช้งาน
                        </>
                      ) : (
                        <>
                          <UserCheck size={14} /> เปิดใช้งาน
                        </>
                      )}
                    </Button>
                  </form>
                </div>

                {/* Profile Edit Dropdown */}
                <details className="mt-3">
                  <summary className="font-rowdies cursor-pointer text-xs font-black text-sky-700 hover:text-sky-800">
                    ✏️ แก้ไขชื่อและรูปโปรไฟล์
                  </summary>
                  <form
                    action={updateJudgeProfileAction}
                    className="mt-3 grid gap-3 rounded-2xl border-2 border-slate-900 bg-sky-50/70 p-4 shadow-[2px_2px_0_#0f172a]"
                  >
                    <input type="hidden" name="judgeId" value={judge.id} />
                    <div>
                      <label className="font-rowdies block text-xs font-black text-slate-700">
                        ชื่อกรรมการ
                      </label>
                      <Input
                        name="name"
                        defaultValue={judge.name}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="font-rowdies block text-xs font-black text-slate-700">
                        รูปโปรไฟล์
                      </label>
                      <ImageUploadField
                        inputName="avatarUrl"
                        thumbnailInputName="avatarThumbnail"
                        variant="avatar"
                        initialImageUrl={judge.avatar_url ?? ""}
                      />
                    </div>
                    <div>
                      <label className="font-rowdies block text-xs font-black text-slate-700">
                        สีสำรองเมื่อไม่มีรูป
                      </label>
                      <input
                        name="avatarColor"
                        type="color"
                        defaultValue={judge.avatar_color}
                        className="mt-1 h-10 w-full cursor-pointer rounded-xl border-2 border-slate-900 bg-white p-1"
                      />
                    </div>
                    <Button variant="primary" className="w-full text-xs">
                      บันทึกโปรไฟล์
                    </Button>
                  </form>
                </details>

                {/* Delete Judge Danger Action */}
                <details className="mt-2">
                  <summary className="font-rowdies cursor-pointer text-xs font-black text-rose-600 hover:text-rose-700">
                    🗑️ ลบกรรมการนี้ออกจากระบบ
                  </summary>
                  <div className="mt-2 rounded-2xl border-2 border-rose-600 bg-rose-50 p-4 shadow-[2px_2px_0_#e11d48]">
                    <p className="text-xs font-bold text-rose-900">
                      ⚠️ ยืนยันการลบกรรมการ <strong>{judge.name}</strong> หรือไม่?
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-rose-700">
                      ระบบจะนำกรรมการ คะแนนที่เคยให้ และคิวตรวจออกจากการประกวดนี้ทันที การดำเนินการนี้ไม่สามารถยกเลิกได้
                    </p>
                    <form action={deleteJudgeAction} className="mt-3">
                      <input type="hidden" name="judgeId" value={judge.id} />
                      <Button variant="danger" className="font-rowdies w-full text-xs">
                        <Trash2 size={14} /> ยืนยันลบกรรมการนี้
                      </Button>
                    </form>
                  </div>
                </details>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
