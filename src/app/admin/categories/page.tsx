import { ArrowDown, ArrowUp, Layers3, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { getSubmissionCategories } from "@/lib/services/admin";
import { createCategoryAction, reorderCategoryAction, updateCategoryAction } from "@/lib/services/admin-actions";
import { Badge, Button, Card, Input } from "@/components/ui";

export default async function CategoriesPage() {
  const session = await requireSession(["ADMIN", "SUPER_ADMIN"]);
  const categories = await getSubmissionCategories(session.contestId!, true);

  return <main className="p-4 sm:p-7 lg:p-9"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-black uppercase tracking-[.16em] text-sky-600">Artwork tracks</p>
        <h1 className="mt-1 text-3xl font-black">หมวดและสนามประกวด</h1>
        <p className="mt-2 text-slate-500">เริ่มต้นด้วยวาดบนกระดาษและดิจิทัล แล้วเพิ่มหมวดใหม่ได้ตามรูปแบบงานจริง</p>
      </div>
      <details><summary className="list-none"><span className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"><Plus size={17}/> เพิ่มหมวด</span></summary>
        <Card className="absolute right-6 z-20 mt-2 w-[min(92vw,430px)] p-5"><form action={createCategoryAction} className="grid gap-3">
          <h2 className="text-lg font-black">สร้างสนามประกวดใหม่</h2>
          <Input name="name" placeholder="ชื่อ เช่น ภาพสีน้ำ" required/>
          <Input name="description" placeholder="คำอธิบายสั้น ๆ"/>
          <div className="grid grid-cols-[1fr_120px] gap-3"><Input name="icon" defaultValue="🎨" maxLength={12} aria-label="ไอคอน"/><input name="color" type="color" defaultValue="#27B8FF" className="h-11 w-full rounded-xl border border-blue-200 bg-white p-1"/></div>
          <Button><Plus size={16}/> สร้างหมวด</Button>
        </form></Card>
      </details>
    </div>

    <div className="mt-6 grid gap-4 md:grid-cols-2">{categories.map((category, index)=><Card key={category.id} className="p-5">
      <div className="flex items-start gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl text-white shadow-sm" style={{background:category.color}}>{category.icon}</span>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-black">{category.name}</h2><Badge tone={category.active?"green":"slate"}>{category.active?"ACTIVE":"HIDDEN"}</Badge></div><p className="mt-1 text-sm text-slate-500">{category.description||"ไม่มีคำอธิบาย"}</p><p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-400">{category.submission_count} artworks · {category.slug}</p></div>
      </div>
      <details className="mt-4"><summary className="cursor-pointer text-sm font-black text-sky-700">แก้ไขหมวดและลำดับ</summary>
        <div className="mt-3 rounded-2xl bg-sky-50/70 p-4">
          <form action={updateCategoryAction} className="grid gap-3">
            <input type="hidden" name="categoryId" value={category.id}/>
            <Input name="name" defaultValue={category.name} required/>
            <Input name="description" defaultValue={category.description}/>
            <div className="grid grid-cols-[1fr_120px] gap-3"><Input name="icon" defaultValue={category.icon} maxLength={12} required/><input name="color" type="color" defaultValue={category.color} className="h-11 w-full rounded-xl border border-blue-200 bg-white p-1"/></div>
            <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="activeToggle" defaultChecked={category.active} className="h-5 w-5 accent-sky-500"/> เปิดให้เลือกใช้งาน</label>
            <Button>บันทึกหมวด</Button>
          </form>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <form action={reorderCategoryAction}><input type="hidden" name="categoryId" value={category.id}/><input type="hidden" name="direction" value="up"/><Button type="submit" variant="secondary" className="w-full" disabled={index===0}><ArrowUp size={16}/> ขึ้น</Button></form>
            <form action={reorderCategoryAction}><input type="hidden" name="categoryId" value={category.id}/><input type="hidden" name="direction" value="down"/><Button type="submit" variant="secondary" className="w-full" disabled={index===categories.length-1}><ArrowDown size={16}/> ลง</Button></form>
          </div>
        </div>
      </details>
    </Card>)}</div>
    {categories.length===0&&<Card className="mt-6 p-8 text-center"><Layers3 className="mx-auto text-sky-500"/><h2 className="mt-3 text-xl font-black">ยังไม่มีหมวดผลงาน</h2></Card>}
  </div></main>;
}
