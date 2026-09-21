/* eslint-disable @next/next/no-html-link-for-pages */
import { Ban, Link2, Plus, RotateCcw, Search, SortAsc } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { getSubmissionAdminRows, getSubmissionCategories } from "@/lib/services/admin";
import { createSubmissionAction, resetSubmissionScoresAction, sortSubmissionsAction, syncLocalArtworksAction, updateSubmissionStatusAction } from "@/lib/services/admin-actions";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Badge, Button, Card, Input } from "@/components/ui";

export default async function SubmissionsPage({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string; category?: string; page?: string }> }) {
  const session = await requireSession(["ADMIN", "SUPER_ADMIN"]);
  const [allRows, categories, params] = await Promise.all([getSubmissionAdminRows(session.contestId!), getSubmissionCategories(session.contestId!), searchParams]);
  const search = (params.q ?? "").trim().toLocaleLowerCase();
  const filter = params.filter ?? "all";
  const category = params.category ?? "all";
  const filtered = allRows.filter((row) => {
    const matchesSearch = !search || [row.submission_number, row.artwork_title, row.display_name, row.player_id].some((value) => value.toLocaleLowerCase().includes(search));
    const matchesCategory = category === "all" || row.category_id === category || (category === "none" && !row.category_id);
    const matchesFilter = filter === "all" ||
      (filter === "not-judged" && row.completed_judges === 0 && row.status === "ACTIVE") ||
      (filter === "partial" && row.completed_judges > 0 && row.completed_judges < row.assigned_judges) ||
      (filter === "complete" && row.assigned_judges > 0 && row.completed_judges >= row.assigned_judges) ||
      (filter === "disqualified" && row.status === "DISQUALIFIED");
    return matchesSearch && matchesCategory && matchesFilter;
  });
  const pageSize = 50;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(pageCount, Math.max(1, Number(params.page) || 1));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const queryBase = `q=${encodeURIComponent(params.q ?? "")}&filter=${filter}&category=${encodeURIComponent(category)}`;

  return <main className="p-4 sm:p-7 lg:p-9"><div className="mx-auto max-w-7xl">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-black uppercase tracking-[.16em] text-sky-600">Submissions</p><h1 className="mt-1 text-3xl font-black">คลังผลงานและลำดับสนาม</h1><p className="mt-2 text-slate-500">{filtered.length} จาก {allRows.length} รายการ · แยกหมวด กรอง และเรียงคิวใหม่ได้</p></div>
      <div className="flex flex-wrap gap-2">
        <a href="/drive-links.html" target="_blank"><Button variant="secondary" className="border-2 border-sky-400 bg-sky-50 font-black text-sky-900 shadow-sm">📁 ดูลิงก์ Google Drive ทั้ง 69 รายการ ↗</Button></a>
        <form action={syncLocalArtworksAction}><Button type="submit" variant="secondary" className="border-2 border-emerald-400 bg-emerald-50 font-black text-emerald-900 shadow-sm">🔄 ซิงก์รูปภาพในเครื่อง (artworks)</Button></form>
        <a href="/admin/categories"><Button variant="secondary">จัดการหมวด</Button></a>
        <a href="/admin/submissions/import"><Button variant="secondary">Google Forms / CSV</Button></a>
        <details className="group"><summary className="list-none"><span className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"><Plus size={17}/> เพิ่มผลงาน</span></summary><Card className="absolute right-6 z-20 mt-2 w-[min(92vw,500px)] p-5"><form action={createSubmissionAction} className="grid gap-3"><h2 className="text-lg font-black">เพิ่มผลงานด้วยตนเอง</h2><div className="grid gap-3 sm:grid-cols-2"><Input name="submissionNumber" placeholder="หมายเลข เช่น 011" required/><select name="categoryId" className="focus-ring min-h-11 rounded-xl border border-blue-200 bg-white px-3 text-sm font-bold" required><option value="">เลือกหมวดผลงาน</option>{categories.map((item)=><option key={item.id} value={item.id}>{item.icon} {item.name}</option>)}</select></div><Input name="displayName" placeholder="ชื่อศิลปิน / Display name" required/><Input name="playerId" placeholder="Player ID" required/><Input name="artworkTitle" placeholder="ชื่อผลงาน" required/><ImageUploadField/><Button type="submit">บันทึกผลงาน</Button></form></Card></details>
      </div>
    </div>
    <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-white/75 p-4 text-sm text-slate-600">
        <Link2 className="mt-0.5 shrink-0 text-sky-600" size={18}/>
        <div>
          <strong className="text-slate-900">ตัวช่วยจัดการรูปภาพ (Google Drive &amp; ไฟล์ในเครื่อง):</strong>
          <p className="mt-1">
            • กดปุ่ม <strong>&quot;📁 ดูลิงก์ Google Drive ทั้ง 69 รายการ&quot;</strong> เพื่อดูตารางทุกลิงก์พร้อมปุ่มเปิดโหลดภาพและคัดลอกชื่อไฟล์ เช่น <code>008.png</code><br/>
            • เมื่อโหลดรูปมาแล้ว นำไปวางในโฟลเดอร์ <code>public/artworks/</code> แล้วกดปุ่ม <strong>&quot;🔄 ซิงก์รูปภาพในเครื่อง&quot;</strong> ระบบจะเปลี่ยนรูปให้แสดงผลจากเครื่องทันที คมชัดและโหลดไวมาก
          </p>
        </div>
      </div>
      <form action={sortSubmissionsAction} className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-white/75 p-3"><SortAsc size={18} className="text-sky-600"/><select name="sortMode" className="focus-ring min-h-11 rounded-xl border border-blue-200 bg-white px-3 text-sm font-bold"><option value="CATEGORY_NUMBER">หมวด → หมายเลข</option><option value="SUBMISSION_NUMBER">หมายเลขผลงาน</option><option value="SUBMITTED_AT">เวลาส่ง</option><option value="ARTIST_NAME">ชื่อศิลปิน</option></select><Button variant="secondary">จัดเรียงคิว</Button></form>
    </div>
    <Card className="mt-5 overflow-hidden">
      <form className="grid gap-3 border-b border-blue-100 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_190px_220px_auto]"><label className="relative"><Search className="pointer-events-none absolute left-3 top-3.5 text-slate-400" size={18}/><Input className="pl-10" name="q" defaultValue={params.q} placeholder="ค้นหาเลข ศิลปิน Player ID หรือชื่อผลงาน"/></label><select name="filter" defaultValue={filter} className="focus-ring min-h-11 rounded-xl border border-blue-200 bg-white px-3 text-sm font-bold"><option value="all">ทุกสถานะ</option><option value="not-judged">ยังไม่ตัดสิน</option><option value="partial">ตัดสินบางส่วน</option><option value="complete">ครบแล้ว</option><option value="disqualified">Disqualified</option></select><select name="category" defaultValue={category} className="focus-ring min-h-11 rounded-xl border border-blue-200 bg-white px-3 text-sm font-bold"><option value="all">ทุกหมวด</option>{categories.map((item)=><option key={item.id} value={item.id}>{item.icon} {item.name}</option>)}<option value="none">ยังไม่จัดหมวด</option></select><Button>ค้นหา / กรอง</Button></form>
      <div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-left"><thead className="bg-slate-900 text-sm text-white"><tr>{["Artwork", "Submission ID", "Track", "Artist", "Player ID", "Judge progress", "Average", "Status", "Actions"].map((head) => <th key={head} className="px-4 py-3 font-bold">{head}</th>)}</tr></thead><tbody className="divide-y divide-blue-100 bg-white/70">{rows.map((row) => <tr key={row.id} className="align-middle"><td className="px-4 py-3"><div className="flex items-center gap-3"><img src={row.thumbnail_url||row.image_url} alt="" referrerPolicy="no-referrer" className="h-14 w-20 rounded-lg object-cover"/><strong className="max-w-44 truncate">{row.artwork_title}</strong></div></td><td className="px-4 py-3 font-black text-sky-700">#{row.submission_number}</td><td className="px-4 py-3"><span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black text-white" style={{background:row.category_color??"#64748B"}}>{row.category_icon??"🗂️"} {row.category_name??"ยังไม่จัดหมวด"}</span></td><td className="px-4 py-3">{row.display_name}</td><td className="px-4 py-3 text-slate-500">{row.player_id}</td><td className="px-4 py-3 font-bold">{row.completed_judges}/{row.assigned_judges}</td><td className="px-4 py-3 font-black">{row.average == null ? "—" : Number(row.average).toFixed(2)}</td><td className="px-4 py-3"><Badge tone={row.status === "ACTIVE" ? "green" : row.status === "DISQUALIFIED" ? "red" : "slate"}>{row.status}</Badge></td><td className="px-4 py-3"><details><summary className="cursor-pointer text-sm font-bold text-sky-700">Manage</summary><div className="mt-2 w-64 space-y-3 rounded-xl border border-blue-100 bg-white p-3 shadow-lg"><a href={`/admin/submissions/${row.id}`} className="focus-ring block rounded-xl bg-sky-50 px-3 py-2 text-center text-sm font-bold text-sky-700">View / Edit / Replace image</a><form action={updateSubmissionStatusAction} className="space-y-2"><input type="hidden" name="submissionId" value={row.id}/><input type="hidden" name="status" value={row.status === "DISQUALIFIED" ? "ACTIVE" : "DISQUALIFIED"}/>{row.status !== "DISQUALIFIED" && <Input name="confirm" placeholder="พิมพ์ DISQUALIFY" required/>}<Button className="w-full" variant={row.status === "DISQUALIFIED" ? "secondary" : "danger"}><Ban size={15}/>{row.status === "DISQUALIFIED" ? "Restore" : "Disqualify"}</Button></form><form action={resetSubmissionScoresAction} className="space-y-2"><input type="hidden" name="submissionId" value={row.id}/><Input name="reason" placeholder="เหตุผลการรีเซ็ต" required/><Input name="confirmation" placeholder="พิมพ์ RESET" required/><Button className="w-full" variant="secondary"><RotateCcw size={15}/> Reset scores</Button></form></div></details></td></tr>)}</tbody></table></div>
      {pageCount > 1 && <div className="flex items-center justify-between border-t border-blue-100 p-4 text-sm font-bold"><a className={page <= 1 ? "pointer-events-none opacity-40" : "text-sky-700"} href={`?${queryBase}&page=${page - 1}`}>← Previous</a><span>Page {page} / {pageCount}</span><a className={page >= pageCount ? "pointer-events-none opacity-40" : "text-sky-700"} href={`?${queryBase}&page=${page + 1}`}>Next →</a></div>}
    </Card>
  </div></main>;
}
