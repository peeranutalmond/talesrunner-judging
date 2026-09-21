import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

type LoginPerson = {
  id: string;
  name: string;
  role: "SUPER_ADMIN" | "ADMIN" | "JUDGE";
  avatar_color: string;
  avatar_url: string | null;
  contest_id: string;
  contest_name: string;
  judge_login_mode: string;
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; tab?: string }>;
}) {
  const session = await getSession();
  if (session) redirect(session.role === "JUDGE" ? "/judge" : "/admin");

  const [people, params] = await Promise.all([
    query<LoginPerson>(`SELECT u.id,u.name,u.role,u.avatar_color,u.avatar_url,c.id AS contest_id,c.name AS contest_name,c.judge_login_mode
      FROM users u JOIN contest_judges cj ON cj.user_id=u.id JOIN contests c ON c.id=cj.contest_id
      WHERE u.status='ACTIVE' AND cj.status='ACTIVE' AND (u.role IN ('ADMIN','SUPER_ADMIN') OR c.status IN ('OPEN','JUDGING')) ORDER BY c.created_at DESC,cj.display_order,u.name`),
    searchParams,
  ]);

  const errorText =
    params.error === "pin"
      ? "PIN ไม่ถูกต้อง กรุณาลองอีกครั้ง"
      : params.error === "locked"
      ? "ลอง PIN ผิดหลายครั้ง กรุณารอ 15 นาทีแล้วลองใหม่"
      : params.error === "account"
      ? "โหมด Account ต้องเชื่อมต่อผู้ให้บริการยืนยันตัวตนก่อนเปิดใช้งาน"
      : params.error
      ? "กรุณาเลือกชื่อและกรอก PIN 4–6 หลัก"
      : null;

  return (
    <div className="min-h-screen gartic-pattern flex flex-col justify-between py-6 px-4 sm:px-6">
      {/* Top Navbar */}
      <header className="mx-auto w-full max-w-5xl flex items-center justify-between gap-4 pb-4">
        <Brand />
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/guide"
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-900 bg-white px-3.5 py-2 text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition hover:bg-sky-50 active:translate-y-0.5 sm:text-sm"
          >
            <span>📖 คู่มือวิธีใช้</span>
          </Link>
          <Link
            href="/admin/results"
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-900 bg-yellow-300 px-3.5 py-2 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition hover:bg-yellow-400 active:translate-y-0.5 sm:text-sm"
          >
            <span>🏆 ผลการตัดสิน Top 3</span>
          </Link>
        </div>
      </header>

      {/* Center Stage: Gartic Phone Style Lobby */}
      <main className="my-auto py-4">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-4 py-1 text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a]">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>TALES RUNNER · FAN-ART JUDGING 2026</span>
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            ห้องรับรองนักวิ่ง <span className="text-sky-600">LOBBY</span>
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-600 max-w-md mx-auto">
            เลือกตัวละครของคุณ แล้วกดปุ่ม <strong>START</strong> เพื่อเข้าสู่ห้องตัดสินผลงานทันที
          </p>
        </div>

        {/* Character Card Form */}
        <LoginForm
          people={people}
          errorText={errorText}
          initialTab={params.tab === "admin" ? "ADMIN" : "JUDGE"}
        />

        {/* Bottom Stat Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 max-w-xl mx-auto">
          <div className="flex items-center gap-2 rounded-2xl border-2 border-slate-900 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-[2px_2px_0_#0f172a]">
            <span className="text-base">🎨</span>
            <span>69 ผลงานจริง (53 ดิจิทัล / 16 วาดมือ)</span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border-2 border-slate-900 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-[2px_2px_0_#0f172a]">
            <span className="text-base">⚖️</span>
            <span>Blind Judging ตัดสินอย่างเป็นธรรม</span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border-2 border-slate-900 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-[2px_2px_0_#0f172a]">
            <span className="text-base">⭐</span>
            <span>เกณฑ์ 5 ด้าน (เต็ม 100 คะแนน)</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs font-medium text-slate-400">
        Tales Runner Fan-Art Judging Console · 1-Click Fast Access · Designed for Judges & Admins
      </footer>
    </div>
  );
}
