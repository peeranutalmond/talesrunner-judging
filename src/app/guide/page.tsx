import Link from "next/link";
import {
  BookOpen,
  Trophy,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Star,
  Keyboard,
  Sparkles,
  Award,
  AlertTriangle,
  FileSpreadsheet,
  Lock,
} from "lucide-react";
import { Brand } from "@/components/brand";

export const metadata = {
  title: "คู่มือการใช้งานระบบตัดสิน Tales Artventure",
  description: "คู่มือการใช้งานระบบและแนวทางการตัดสินผลงานแฟนอาร์ต Tales Runner",
};

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b-2 border-slate-900 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/login" className="transition hover:opacity-90">
            <Brand compact />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-900 bg-white px-3.5 py-2 text-xs font-black text-slate-800 shadow-[2px_2px_0_#0f172a] transition hover:bg-slate-100 sm:text-sm"
            >
              <ArrowLeft size={16} />
              <span>กลับสู่หน้าเข้าสู่ระบบ</span>
            </Link>
            <Link
              href="/judge"
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-900 bg-sky-400 px-4 py-2 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition hover:bg-sky-300 sm:text-sm"
            >
              <span>เข้าห้องตัดสิน 🏃</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <div className="border-b-2 border-slate-900 bg-gradient-to-b from-sky-100 via-sky-50 to-slate-50 px-4 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-300 bg-white px-4 py-1.5 text-xs font-bold text-sky-800 shadow-sm">
            <BookOpen size={15} className="text-sky-600" />
            <span>คู่มือการใช้งานระบบตัดสินฉบับสมบูรณ์ (User Manual)</span>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            วิธีใช้งานระบบตัดสิน <span className="text-sky-600">Tales Artventure</span>
          </h1>
          <p className="mt-3 text-base font-normal text-slate-600 sm:text-lg">
            คู่มือแบบ Step-by-Step สำหรับคณะกรรมการและผู้ดูแลระบบ เน้นความเข้าใจง่าย ใช้งานได้จริง ครบทุกฟังก์ชัน
          </p>

          {/* Quick Jump Buttons */}
          <div className="mt-8 flex flex-wrap justify-center gap-2.5 sm:gap-3">
            <a
              href="#judge-guide"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-900 bg-white px-4 py-2 text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition hover:bg-sky-100 sm:text-sm"
            >
              <span>🏃 1. วิธีตัดสินสำหรับกรรมการ</span>
            </a>
            <a
              href="#admin-guide"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-900 bg-white px-4 py-2 text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition hover:bg-amber-100 sm:text-sm"
            >
              <span>🛡️ 2. วิธีจัดการสำหรับแอดมิน</span>
            </a>
            <a
              href="#criteria-guide"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-900 bg-white px-4 py-2 text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition hover:bg-emerald-100 sm:text-sm"
            >
              <span>⭐ 3. เกณฑ์คะแนนทั้ง 5 ด้าน</span>
            </a>
            <a
              href="#shortcuts-guide"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-900 bg-white px-4 py-2 text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition hover:bg-purple-100 sm:text-sm"
            >
              <span>⌨️ 4. คีย์ลัด & ทริคการใช้งาน</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="mx-auto max-w-5xl px-4 py-10 space-y-14 sm:px-8">

        {/* SECTION 1: สำหรับกรรมการ (Judge Workflow) */}
        <section id="judge-guide" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border-2 border-slate-900 bg-sky-400 text-slate-950 shadow-[2px_2px_0_#0f172a]">
              <Award size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">1. ขั้นตอนการตัดสินสำหรับกรรมการ (Judge Workflow)</h2>
              <p className="text-sm text-slate-500">ขั้นตอนตั้งแต่การเข้าสู่ระบบจนถึงการส่งสรุปคะแนนครบทุกชิ้นงาน</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Step 1 */}
            <div className="rounded-2xl border-2 border-slate-900 bg-white p-5 shadow-[3px_3px_0_#0f172a]">
              <div className="flex items-center justify-between">
                <span className="rounded-lg border-2 border-slate-900 bg-sky-100 px-2.5 py-1 text-xs font-black text-sky-900 shadow-[1px_1px_0_#0f172a]">
                  ขั้นตอนที่ 1
                </span>
                <span className="text-xl">🔑</span>
              </div>
              <h3 className="mt-3 text-lg font-bold text-slate-900">เข้าสู่ระบบห้องตัดสิน (Login)</h3>
              <ul className="mt-2.5 space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span>เข้าหน้าแรก จะพบการ์ดตัวละครกรรมการ เช่น <strong>โชวอน (Chowon)</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span>กดปุ่มสีฟ้า <strong>&quot;เข้าตัดสินทันที (1-Click)&quot;</strong> เพื่อเข้าใช้งานได้ทันที หรือกรอก PIN: <code className="font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border">1234</code></span>
                </li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border-2 border-slate-900 bg-white p-5 shadow-[3px_3px_0_#0f172a]">
              <div className="flex items-center justify-between">
                <span className="rounded-lg border-2 border-slate-900 bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-900 shadow-[1px_1px_0_#0f172a]">
                  ขั้นตอนที่ 2
                </span>
                <span className="text-xl">🖼️</span>
              </div>
              <h3 className="mt-3 text-lg font-bold text-slate-900">ตรวจดูผลงานแฟนอาร์ต (View Artwork)</h3>
              <ul className="mt-2.5 space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span>ระบบใช้ <strong>Blind Judging</strong> ปิดบังชื่อผู้เข้าแข่งขัน เพื่อความโปร่งใสและยุติธรรม</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span>กดปุ่ม <strong>&quot;Fullscreen&quot;</strong> เพื่อขยายภาพเต็มจอ ซูมดูลายเส้นและรายละเอียด</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span>กดปุ่ม <strong>&quot;View original / ดูต้นฉบับบน Google Drive&quot;</strong> เพื่อดูไฟล์ความละเอียดสูงบน Google Drive</span>
                </li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border-2 border-slate-900 bg-white p-5 shadow-[3px_3px_0_#0f172a]">
              <div className="flex items-center justify-between">
                <span className="rounded-lg border-2 border-slate-900 bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-900 shadow-[1px_1px_0_#0f172a]">
                  ขั้นตอนที่ 3
                </span>
                <span className="text-xl">⭐</span>
              </div>
              <h3 className="mt-3 text-lg font-bold text-slate-900">ให้คะแนนตาม 5 เกณฑ์ (Scoring)</h3>
              <ul className="mt-2.5 space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span>ปรับคะแนนแต่ละเกณฑ์โดยใช้ <strong>แถบเลื่อนสไลเดอร์</strong> หรือกดปุ่ม <strong>+ / -</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span>แถบด้านบนจะแสดงคะแนนรวมสะสม (เต็ม 100 คะแนน) และระดับเกรด (เช่น S, A, B)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span><strong>ปุ่มทางลัด:</strong> สามารถกดปุ่ม <em>&quot;ใส่คะแนนด่วน (85% ทุกเกณฑ์)&quot;</em> เพื่อจำลองคะแนนทดสอบได้อย่างรวดเร็ว</span>
                </li>
              </ul>
            </div>

            {/* Step 4 */}
            <div className="rounded-2xl border-2 border-slate-900 bg-white p-5 shadow-[3px_3px_0_#0f172a]">
              <div className="flex items-center justify-between">
                <span className="rounded-lg border-2 border-slate-900 bg-purple-100 px-2.5 py-1 text-xs font-black text-purple-900 shadow-[1px_1px_0_#0f172a]">
                  ขั้นตอนที่ 4
                </span>
                <span className="text-xl">🚀</span>
              </div>
              <h3 className="mt-3 text-lg font-bold text-slate-900">บันทึกและสลับภาพ (Submit &amp; Skip)</h3>
              <ul className="mt-2.5 space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span>กดปุ่มเขียว <strong>&quot;ยืนยันคะแนน &amp; ไปภาพถัดไป 🚀&quot;</strong>: บันทึกลงระบบและเปลี่ยนไปตรวจผลงานชิ้นถัดไปอัตโนมัติ</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span>กดปุ่มส้ม <strong>&quot;ข้ามไปก่อน ⏭️&quot;</strong>: หากต้องการไปดูภาพอื่นก่อน โดยยังไม่บันทึกคะแนน</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span>กดปุ่ม <strong>&quot;ติดธง 🚩&quot;</strong>: หากพบภาพที่มีข้อสงสัยผิดกติกา (เช่น ไม่ตรงธีม / ละเมิดลิขสิทธิ์)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* New Feature 1: Track Selector */}
          <div className="rounded-2xl border-2 border-slate-900 bg-amber-50/70 p-5 shadow-[3px_3px_0_#0f172a]">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">ฟังก์ชันใหม่: เลือกสนามแข่งขัน (Track Selector)</h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  กรรมการสามารถเลือกตัดสินแยกเฉพาะสายที่ต้องการได้อย่างอิสระผ่านแถบปุ่มด้านบนสุด:
                </p>
                <div className="flex flex-wrap gap-2 pt-1 text-xs font-bold">
                  <span className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-900 bg-white px-3 py-1.5 shadow-[1px_1px_0_#0f172a]">
                    🏁 ทุกสนาม (69 ชิ้นงาน)
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-900 bg-purple-100 text-purple-900 px-3 py-1.5 shadow-[1px_1px_0_#0f172a]">
                    🖥️ Digital Art (53 ชิ้นงาน)
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-900 bg-emerald-100 text-emerald-900 px-3 py-1.5 shadow-[1px_1px_0_#0f172a]">
                    ✏️ Traditional Art วาดบนกระดาษ (16 ชิ้นงาน)
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  * เมื่อเลือกสนามใด ระบบจะกรองคิวผลงานและคำนวณ Checkpoint เฉพาะสนามนั้น ทำให้กรรมการโฟกัสการตรวจได้สะดวกยิ่งขึ้น
                </p>
              </div>
            </div>
          </div>

          {/* New Feature 2: Interactive Checkpoint Circles */}
          <div className="rounded-2xl border-2 border-slate-900 bg-white p-5 shadow-[3px_3px_0_#0f172a]">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🚦</span>
              <div className="space-y-2.5">
                <h4 className="font-bold text-slate-900">แถบ Checkpoint วงกลม (ข้าม-ย้อนกลับได้ทันที &amp; เช็คจุดที่เผลอข้าม)</h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  แถบ Checkpoint ด้านบนช่วยให้กรรมการรู้สถานะของทุกผลงานได้อย่างชัดเจนด้วยสัญลักษณ์สี:
                </p>
                <div className="grid gap-2 sm:grid-cols-3 text-xs">
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-2.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-white font-black text-xs">✓</span>
                    <div>
                      <strong className="text-emerald-900">สีเขียว (ตรวจแล้ว):</strong>
                      <div className="text-slate-600">บันทึกคะแนนเรียบร้อย</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 p-2.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-slate-300 bg-white text-slate-700 font-bold text-xs">#</span>
                    <div>
                      <strong className="text-slate-800">สีขาว (ยังไม่ตรวจ / เผลอข้าม):</strong>
                      <div className="text-slate-600">จุดที่ยังไม่มีคะแนน</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-sky-300 bg-sky-50 p-2.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sky-400 text-slate-950 font-black text-xs ring-2 ring-sky-300">#</span>
                    <div>
                      <strong className="text-sky-900">สีฟ้าเรืองแสง (กำลังตรวจ):</strong>
                      <div className="text-slate-600">ชิ้นงานที่เปิดดูอยู่ปัจจุบัน</div>
                    </div>
                  </div>
                </div>
                <ul className="space-y-1.5 pt-1 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-sky-600 shrink-0" />
                    <span><strong>คลิกที่วงกลมหมายเลขใดก็ได้:</strong> เพื่อกระโดดไปตรวจชิ้นงานนั้นได้ทันที (ระบบบันทึกคะแนนงานปัจจุบันอัตโนมัติ)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-sky-600 shrink-0" />
                    <span><strong>ปุ่มลัด &quot;⚡ ไปจุดที่เผลอข้าม (#X)&quot;:</strong> คลิกเพียงครั้งเดียวเพื่อวาร์ปไปยังผลงานชิ้นแรกที่ยังไม่ได้ให้คะแนน</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Review Box */}
          <div className="rounded-2xl border-2 border-slate-900 bg-sky-50 p-5 shadow-[3px_3px_0_#0f172a]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-sky-600 bg-sky-200 text-sky-900">
                <Sparkles size={18} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">ขั้นตอนที่ 5: ตรวจทานผลงานทั้งหมด (Review Dashboard)</h4>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                  สามารถคลิกเมนู <strong>&quot;ตรวจทาน (Review)&quot;</strong> ในแถบด้านบนเพื่อดูตารางสรุปผลงานทั้งหมด ทั้ง 69 ชิ้นงาน ตรวจสอบว่าชิ้นงานไหนให้คะแนนแล้ว ชิ้นไหนยังค้างอยู่ และสามารถกดคลิกเพื่อกลับไปแก้ไขคะแนนของแต่ละภาพได้ตลอดเวลา
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: สำหรับผู้ดูแลระบบ (Admin Guide) */}
        <section id="admin-guide" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border-2 border-slate-900 bg-amber-400 text-slate-950 shadow-[2px_2px_0_#0f172a]">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">2. หน้าที่และการทำงานของผู้ดูแลระบบ (Admin Guide)</h2>
              <p className="text-sm text-slate-500">การดูผลคะแนนรวม สรุปโพเดียม Top 3 และการจัดการข้อมูลการแข่งขัน</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Card 1 */}
            <div className="rounded-2xl border-2 border-slate-900 bg-white p-5 shadow-[3px_3px_0_#0f172a]">
              <div className="grid h-10 w-10 place-items-center rounded-xl border-2 border-slate-900 bg-amber-100 text-amber-900 shadow-[1px_1px_0_#0f172a]">
                <Trophy size={20} />
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900">โพเดียม Top 3 &amp; Leaderboard</h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                เข้าเมนู <strong>Results</strong> เพื่อดูการจัดอันดับ Top 3 พร้อมแท่นโพเดียมทอง เงิน ทองแดง และตารางคะแนนรวมเฉลี่ยแบบสด (Live Scoring) พร้อมภาพพรีวิวผลงาน
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border-2 border-slate-900 bg-white p-5 shadow-[3px_3px_0_#0f172a]">
              <div className="grid h-10 w-10 place-items-center rounded-xl border-2 border-slate-900 bg-sky-100 text-sky-900 shadow-[1px_1px_0_#0f172a]">
                <FileSpreadsheet size={20} />
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900">จัดการผลงาน 69 ชิ้นงาน</h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                เข้าเมนู <strong>Submissions</strong> เพื่อดูข้อมูลผู้สมัครจาก Google Sheets, นามปากกา, ไอดีผู้เล่น, ตัดสิทธิ์ผลงานที่ผิดกติกา (Disqualify) หรือแก้ไขหมวดหมู่ Digital / Traditional
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border-2 border-slate-900 bg-white p-5 shadow-[3px_3px_0_#0f172a]">
              <div className="grid h-10 w-10 place-items-center rounded-xl border-2 border-slate-900 bg-emerald-100 text-emerald-900 shadow-[1px_1px_0_#0f172a]">
                <Lock size={20} />
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900">ล็อกผลคะแนน &amp; สรุปรางวัล</h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                เมื่อกรรมการให้คะแนนครบถ้วนแล้ว แอดมินสามารถกด <strong>&quot;Lock Results&quot;</strong> เพื่อล็อกผลคะแนน ป้องกันการแก้ไข และเตรียมประกาศผลผู้ชนะอย่างเป็นทางการ
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3: เกณฑ์การให้คะแนน (Scoring Criteria) */}
        <section id="criteria-guide" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border-2 border-slate-900 bg-emerald-400 text-slate-950 shadow-[2px_2px_0_#0f172a]">
              <Star size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">3. เกณฑ์การตัดสินทั้ง 5 ด้าน (Scoring Criteria)</h2>
              <p className="text-sm text-slate-500">คะแนนรวมทั้งสิ้น 100 คะแนนเต็ม แบ่งออกเป็น 5 หัวข้อมาตรฐาน</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-[3px_3px_0_#0f172a]">
            <table className="w-full text-left text-sm">
              <thead className="border-b-2 border-slate-900 bg-slate-100 text-xs font-bold text-slate-700 uppercase">
                <tr>
                  <th className="px-4 py-3 sm:px-6">เกณฑ์การตัดสิน</th>
                  <th className="px-4 py-3 sm:px-6">คำอธิบายเกณฑ์และแนวทางการพิจารณา</th>
                  <th className="px-4 py-3 text-right sm:px-6">คะแนนเต็ม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-sky-50/50">
                  <td className="px-4 py-3.5 font-bold text-slate-900 sm:px-6">
                    1. Theme &amp; Concept
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 sm:px-6">
                    ความสอดคล้องกับธีมกิจกรรม (Animal Village with Friends) และความชัดเจนของแนวคิดที่ต้องการสื่อสาร
                  </td>
                  <td className="px-4 py-3.5 text-right font-black text-sky-700 sm:px-6">
                    <span className="rounded-lg border border-slate-900 bg-yellow-300 px-2 py-0.5 text-xs text-slate-950">30 คะแนน</span>
                  </td>
                </tr>
                <tr className="hover:bg-sky-50/50">
                  <td className="px-4 py-3.5 font-bold text-slate-900 sm:px-6">
                    2. Composition &amp; Storytelling
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 sm:px-6">
                    การจัดวางองค์ประกอบภาพ (Composition), มุมมอง, การจัดแสงเงา และการบอกเล่าเรื่องราวที่น่าสนใจ
                  </td>
                  <td className="px-4 py-3.5 text-right font-black text-sky-700 sm:px-6">
                    <span className="rounded-lg border border-slate-900 bg-yellow-300 px-2 py-0.5 text-xs text-slate-950">25 คะแนน</span>
                  </td>
                </tr>
                <tr className="hover:bg-sky-50/50">
                  <td className="px-4 py-3.5 font-bold text-slate-900 sm:px-6">
                    3. Creativity
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 sm:px-6">
                    ความคิดสร้างสรรค์ ความแปลกใหม่ และความโดดเด่นที่มีเอกลักษณ์เฉพาะตัว
                  </td>
                  <td className="px-4 py-3.5 text-right font-black text-sky-700 sm:px-6">
                    <span className="rounded-lg border border-slate-900 bg-yellow-300 px-2 py-0.5 text-xs text-slate-950">20 คะแนน</span>
                  </td>
                </tr>
                <tr className="hover:bg-sky-50/50">
                  <td className="px-4 py-3.5 font-bold text-slate-900 sm:px-6">
                    4. Technique &amp; Completion
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 sm:px-6">
                    เทคนิคทางศิลปะ ความประณีตของเส้น การลงสี รายละเอียด และความสมบูรณ์ของชิ้นงาน
                  </td>
                  <td className="px-4 py-3.5 text-right font-black text-sky-700 sm:px-6">
                    <span className="rounded-lg border border-slate-900 bg-yellow-300 px-2 py-0.5 text-xs text-slate-950">15 คะแนน</span>
                  </td>
                </tr>
                <tr className="hover:bg-sky-50/50">
                  <td className="px-4 py-3.5 font-bold text-slate-900 sm:px-6">
                    5. Character Expression
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 sm:px-6">
                    การสื่ออารมณ์ บุคลิกภาพ เสน่ห์ และเอกลักษณ์ของตัวละครในจักรวาล Tales Runner
                  </td>
                  <td className="px-4 py-3.5 text-right font-black text-sky-700 sm:px-6">
                    <span className="rounded-lg border border-slate-900 bg-yellow-300 px-2 py-0.5 text-xs text-slate-950">10 คะแนน</span>
                  </td>
                </tr>
              </tbody>
              <tfoot className="border-t-2 border-slate-900 bg-slate-900 text-white font-bold">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right sm:px-6">
                    คะแนนรวมสูงสุด (Total Maximum)
                  </td>
                  <td className="px-4 py-3 text-right text-base text-yellow-400 sm:px-6">
                    100 คะแนน
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* SECTION 4: คีย์ลัด & เคล็ดลับการใช้งาน */}
        <section id="shortcuts-guide" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border-2 border-slate-900 bg-purple-400 text-slate-950 shadow-[2px_2px_0_#0f172a]">
              <Keyboard size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">4. ปุ่มลัดคีย์บอร์ด &amp; เคล็ดลับ (Shortcuts &amp; Tips)</h2>
              <p className="text-sm text-slate-500">ช่วยให้การตรวจและให้คะแนนผลงาน 69 ชิ้นงานรวดเร็วยิ่งขึ้น</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl border-2 border-slate-900 bg-white p-3.5 shadow-[2px_2px_0_#0f172a]">
              <span className="text-sm font-medium text-slate-700">สลับไปผลงานถัดไป (Next)</span>
              <kbd className="rounded-lg border-2 border-slate-900 bg-slate-100 px-2.5 py-1 text-xs font-black shadow-[1px_1px_0_#0f172a]">
                ArrowRight →
              </kbd>
            </div>
            <div className="flex items-center justify-between rounded-xl border-2 border-slate-900 bg-white p-3.5 shadow-[2px_2px_0_#0f172a]">
              <span className="text-sm font-medium text-slate-700">ย้อนกลับไปผลงานก่อนหน้า (Previous)</span>
              <kbd className="rounded-lg border-2 border-slate-900 bg-slate-100 px-2.5 py-1 text-xs font-black shadow-[1px_1px_0_#0f172a]">
                ← ArrowLeft
              </kbd>
            </div>
            <div className="flex items-center justify-between rounded-xl border-2 border-slate-900 bg-white p-3.5 shadow-[2px_2px_0_#0f172a]">
              <span className="text-sm font-medium text-slate-700">เปิดภาพดูเต็มจอ (Fullscreen)</span>
              <kbd className="rounded-lg border-2 border-slate-900 bg-slate-100 px-2.5 py-1 text-xs font-black shadow-[1px_1px_0_#0f172a]">
                F
              </kbd>
            </div>
            <div className="flex items-center justify-between rounded-xl border-2 border-slate-900 bg-white p-3.5 shadow-[2px_2px_0_#0f172a]">
              <span className="text-sm font-medium text-slate-700">ปิดหน้าจอเต็มจอ (Exit Fullscreen)</span>
              <kbd className="rounded-lg border-2 border-slate-900 bg-slate-100 px-2.5 py-1 text-xs font-black shadow-[1px_1px_0_#0f172a]">
                Esc
              </kbd>
            </div>
          </div>
        </section>

        {/* SECTION 5: คำแนะนำเรื่องการดูรูปภาพ Google Drive (Troubleshooting) */}
        <section className="rounded-2xl border-2 border-slate-900 bg-amber-50 p-6 shadow-[3px_3px_0_#0f172a]">
          <div className="flex items-start gap-3.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-slate-900 bg-amber-300 text-slate-950 shadow-[1px_1px_0_#0f172a]">
              <AlertTriangle size={22} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">คำแนะนำเกี่ยวกับการแสดงผลรูปภาพจาก Google Drive</h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                ผลงานทั้ง 69 ชิ้นถูกนำเข้าโดยตรงจาก Google Sheets ซึ่งเก็บไฟล์ไว้บน Google Drive:
              </p>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
                <li>
                  หากภาพไม่แสดงผลในบางบราวเซอร์ ให้กดปุ่ม <strong>&quot;View original / ดูต้นฉบับบน Google Drive&quot;</strong> ที่มุมขวาล่างของภาพ เพื่อเปิดดูไฟล์โดยตรงในแท็บใหม่
                </li>
                <li>
                  <strong>สำหรับผู้จัดกิจกรรม:</strong> เพื่อให้รูปภาพแสดงผลอัตโนมัติบนหน้าเว็บ 100% สำหรับกรรมการทุกคน ให้เข้าไปที่โฟลเดอร์ Google Drive ที่เก็บไฟล์ แล้วปรับสิทธิ์เป็น <em>&quot;ทุกคนที่มีลิงก์สามารถดูได้ (Anyone with link can view)&quot;</em>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="rounded-2xl border-2 border-slate-900 bg-sky-500 p-8 text-center text-white shadow-[4px_4px_0_#0f172a]">
          <h3 className="text-2xl font-bold">พร้อมเริ่มการตัดสินแล้วหรือยัง?</h3>
          <p className="mt-2 text-sm text-sky-100">
            เข้าร่วมเป็นคณะกรรมการ ตรวจสอบและให้คะแนนผลงานแฟนอาร์ตทั้ง 69 ชิ้นได้ทันที
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-900 bg-yellow-300 px-6 py-3 text-sm font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition hover:bg-yellow-400 active:translate-y-0.5"
            >
              <span>เข้าสู่ระบบเพื่อตัดสิน 🏃</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}