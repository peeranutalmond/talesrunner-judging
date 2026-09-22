import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Badge, Card } from "@/components/ui";

const datasets = [
  ["ranking", "Final Ranking", "อันดับ คะแนนรวม ค่าเฉลี่ย และสถานะความครบถ้วนของทุกผลงาน"],
  ["raw-scores", "All Raw Scores", "คะแนนดิบรายกรรมการ × ผลงาน × เกณฑ์ประเมินทั้งหมด"],
  ["judge-scores", "Judge Scores Summary", "ผลรวมคะแนนรายกรรมการต่อผลงานแต่ละชิ้น"],
  ["criteria-breakdown", "Criteria Breakdown", "สถิติค่าเฉลี่ย ต่ำสุด สูงสุด แยกตามแต่ละเกณฑ์"],
  ["progress", "Judging Progress", "สถานะความคืบหน้าการตรวจของกรรมการแต่ละคน"],
  ["audit", "Audit Log", "ประวัติการแก้ไขและกิจกรรมในระบบที่ตรวจสอบย้อนหลังได้"],
] as const;

export default function ExportPage() {
  return (
    <main className="p-4 sm:p-7 lg:p-9">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-rowdies rounded-md border border-slate-900 bg-sky-400 px-2.5 py-0.5 text-[10px] font-black uppercase text-slate-950 shadow-[1px_1px_0_#0f172a]">
              Export Center · Official Reports
            </span>
          </div>
          <h1 className="font-rowdies mt-1 text-3xl font-black text-slate-950 sm:text-4xl">
            📊 ส่งออกข้อมูลและรายงานผลการแข่งขัน
          </h1>
          <p className="mt-1 text-sm font-bold text-slate-600">
            ดาวน์โหลดรายงานสรุปคะแนนฉบับสมบูรณ์ในรูปแบบ Excel Multi-Sheet หรือเลือกแยกตามชุดข้อมูลดิบ
          </p>
        </div>

        {/* Master Excel Report Hero Card */}
        <div className="comic-card relative overflow-hidden border-2 border-slate-900 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-6 sm:p-8 shadow-[6px_6px_0_#0f172a]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 border-slate-900 bg-amber-400 text-slate-950 shadow-[3px_3px_0_#0f172a]">
                <Trophy size={28} />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-900 bg-amber-300 px-2 py-0.5 text-[10px] font-black uppercase text-slate-950 shadow-sm">
                  <Sparkles size={12} /> RECOMMENDED OFFICIAL EXPORT
                </span>
                <h2 className="font-rowdies mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
                  📥 ไฟล์สรุปผลคะแนนฉบับสมบูรณ์ (Master Report .xlsx)
                </h2>
                <p className="mt-1 text-xs font-bold text-amber-950/80 sm:text-sm">
                  ไฟล์ Excel ฉบับเดียว รวมครบ 6 ชีทรายงานหลักพร้อมใช้งาน จัดรูปแบบและตั้งความกว้างคอลัมน์เรียบร้อย
                </p>
              </div>
            </div>

            <a
              href="/api/export?dataset=master&format=xlsx"
              className="arcade-btn arcade-btn-warning inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-black shadow-[4px_4px_0_#0f172a] hover:-translate-y-1 transition duration-150"
            >
              <Download size={20} />
              <span>ดาวน์โหลด Excel ทั้งหมด (.xlsx)</span>
            </a>
          </div>

          {/* 6 Included Sheets Breakdown */}
          <div className="mt-6 border-t-2 border-dashed border-amber-300 pt-5">
            <h3 className="font-rowdies text-xs font-black uppercase text-amber-900">
              📋 รายละเอียด 6 ชีทรายงานที่บรรจุภายในไฟล์:
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border-2 border-slate-900 bg-white p-3.5 shadow-[2px_2px_0_#0f172a]">
                <div className="flex items-center gap-2">
                  <span className="font-rowdies rounded-md bg-amber-200 border border-slate-900 px-1.5 py-0.2 text-xs font-black">
                    Sheet 1
                  </span>
                  <h4 className="font-rowdies text-sm font-black text-slate-900">
                    1. คะแนนทั้งหมด
                  </h4>
                </div>
                <p className="mt-1 text-[11px] font-bold text-slate-500">
                  ตารางจัดอันดับภาพรวมทุกผลงาน เรียงตามอันดับและคะแนนเฉลี่ยรวม พร้อมสถานะ
                </p>
              </div>

              <div className="rounded-xl border-2 border-slate-900 bg-white p-3.5 shadow-[2px_2px_0_#0f172a]">
                <div className="flex items-center gap-2">
                  <span className="font-rowdies rounded-md bg-sky-200 border border-slate-900 px-1.5 py-0.2 text-xs font-black">
                    Sheet 2
                  </span>
                  <h4 className="font-rowdies text-sm font-black text-slate-900">
                    2. คะแนนสนาม 1 (Digital)
                  </h4>
                </div>
                <p className="mt-1 text-[11px] font-bold text-slate-500">
                  คะแนนผลงานหมวดดิจิทัล พร้อมแจกแจงค่าเฉลี่ยราย 4 เกณฑ์ประเมิน
                </p>
              </div>

              <div className="rounded-xl border-2 border-slate-900 bg-white p-3.5 shadow-[2px_2px_0_#0f172a]">
                <div className="flex items-center gap-2">
                  <span className="font-rowdies rounded-md bg-emerald-200 border border-slate-900 px-1.5 py-0.2 text-xs font-black">
                    Sheet 3
                  </span>
                  <h4 className="font-rowdies text-sm font-black text-slate-900">
                    3. คะแนนสนาม 2 (Traditional)
                  </h4>
                </div>
                <p className="mt-1 text-[11px] font-bold text-slate-500">
                  คะแนนผลงานหมวดกระดาษ พร้อมแจกแจงค่าเฉลี่ยราย 4 เกณฑ์ประเมิน
                </p>
              </div>

              <div className="rounded-xl border-2 border-slate-900 bg-white p-3.5 shadow-[2px_2px_0_#0f172a]">
                <div className="flex items-center gap-2">
                  <span className="font-rowdies rounded-md bg-purple-200 border border-slate-900 px-1.5 py-0.2 text-xs font-black">
                    Sheet 4
                  </span>
                  <h4 className="font-rowdies text-sm font-black text-slate-900">
                    4. คะแนนรวมของกรรมการแต่ละคน
                  </h4>
                </div>
                <p className="mt-1 text-[11px] font-bold text-slate-500">
                  Matrix ตารางเปรียบเทียบคะแนนรวมที่กรรมการทั้ง 6 ท่านให้ต่อแต่ละผลงาน และแถบสรุปเฉลี่ย
                </p>
              </div>

              <div className="rounded-xl border-2 border-slate-900 bg-white p-3.5 shadow-[2px_2px_0_#0f172a]">
                <div className="flex items-center gap-2">
                  <span className="font-rowdies rounded-md bg-orange-200 border border-slate-900 px-1.5 py-0.2 text-xs font-black">
                    Sheet 5
                  </span>
                  <h4 className="font-rowdies text-sm font-black text-slate-900">
                    5. คะแนนแยกกรรมการแต่ละคน
                  </h4>
                </div>
                <p className="mt-1 text-[11px] font-bold text-slate-500">
                  แจกแจงคะแนนลึก 4 เกณฑ์ของกรรมการทุกคน ทุกผลงาน (360+ บรรทัด) พร้อม Comment
                </p>
              </div>

              <div className="rounded-xl border-2 border-slate-900 bg-white p-3.5 shadow-[2px_2px_0_#0f172a]">
                <div className="flex items-center gap-2">
                  <span className="font-rowdies rounded-md bg-red-200 border border-slate-900 px-1.5 py-0.2 text-xs font-black">
                    Sheet 6
                  </span>
                  <h4 className="font-rowdies text-sm font-black text-slate-900">
                    6. คนที่โหวตไม่ครบหรือผิดกติกา
                  </h4>
                </div>
                <p className="mt-1 text-[11px] font-bold text-slate-500">
                  รวบรวมผลงานที่ถูกตัดสิทธิ์ (Disqualified), กรรมการที่ยังตรวจไม่ครบ และงานที่ติดธง
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Individual Datasets Section */}
        <div className="space-y-4">
          <div>
            <h2 className="font-rowdies text-xl font-black text-slate-950">
              📁 ส่งออกแยกเฉพาะชุดข้อมูล (Individual Datasets)
            </h2>
            <p className="text-xs font-bold text-slate-500">
              สำหรับผู้ที่ต้องการนำข้อมูลไปประมวลผลต่อในรูปแบบ CSV หรือ JSON แยกเฉพาะตาราง
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {datasets.map(([key, title, detail]) => (
              <Card className="comic-card bg-white p-5 space-y-3" key={key}>
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 place-items-center rounded-lg border border-slate-900 bg-sky-100 text-sky-700">
                    <Database size={18} />
                  </div>
                  <h3 className="font-rowdies text-base font-black text-slate-950">{title}</h3>
                </div>
                <p className="text-xs font-bold text-slate-500">{detail}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    className="focus-ring flex items-center gap-1.5 rounded-xl border border-slate-900 bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-800 hover:bg-slate-200"
                    href={`/api/export?dataset=${key}&format=csv`}
                  >
                    <FileSpreadsheet size={14} /> CSV
                  </a>
                  <a
                    className="focus-ring flex items-center gap-1.5 rounded-xl border border-slate-900 bg-amber-200 px-3 py-1.5 text-xs font-black text-slate-950 hover:bg-amber-300"
                    href={`/api/export?dataset=${key}&format=xlsx`}
                  >
                    <Download size={14} /> XLSX
                  </a>
                  <a
                    className="focus-ring flex items-center gap-1.5 rounded-xl border border-slate-900 bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-800 hover:bg-slate-200"
                    href={`/api/export?dataset=${key}&format=json`}
                  >
                    <FileJson size={14} /> JSON
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
