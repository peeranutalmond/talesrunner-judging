import { Database, Download, FileJson, FileSpreadsheet } from "lucide-react";
import { Card } from "@/components/ui";
const datasets=[
  ["ranking","Final Ranking","อันดับ คะแนนรวม ค่าเฉลี่ย และสถานะความครบถ้วน"],
  ["raw-scores","All Raw Scores","คะแนนรายกรรมการ × ผลงาน × เกณฑ์"],
  ["judge-scores","Judge Scores","ผลรวมรายกรรมการต่อผลงาน"],
  ["criteria-breakdown","Criteria Breakdown","ค่าเฉลี่ย ต่ำสุด สูงสุด แยกตามเกณฑ์"],
  ["progress","Judging Progress","ความคืบหน้าของกรรมการแต่ละคน"],
  ["audit","Audit Log","ประวัติการเปลี่ยนแปลงที่ตรวจสอบย้อนหลังได้"],
] as const;
export default function ExportPage(){return <main className="p-4 sm:p-7 lg:p-9"><div className="mx-auto max-w-5xl"><p className="text-sm font-black uppercase tracking-[.16em] text-sky-600">Export</p><h1 className="mt-1 text-3xl font-black">ส่งออกข้อมูล</h1><p className="mt-2 text-slate-500">ดาวน์โหลดจากข้อมูลดิบปัจจุบันและบันทึกกิจกรรมการส่งออก</p><div className="mt-6 grid gap-4 sm:grid-cols-2">{datasets.map(([key,title,detail])=><Card className="p-5" key={key}><Database className="text-sky-600"/><h2 className="mt-3 text-lg font-black">{title}</h2><p className="mt-1 text-sm text-slate-500">{detail}</p><div className="mt-5 flex flex-wrap gap-2"><a className="focus-ring flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-bold" href={`/api/export?dataset=${key}&format=csv`}><FileSpreadsheet size={16}/>CSV</a><a className="focus-ring flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-bold" href={`/api/export?dataset=${key}&format=xlsx`}><Download size={16}/>XLSX</a><a className="focus-ring flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-bold" href={`/api/export?dataset=${key}&format=json`}><FileJson size={16}/>JSON</a></div></Card>)}</div></div></main>}
