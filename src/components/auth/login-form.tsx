"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Gamepad2,
  KeyRound,
  Loader2,
  Sparkles,
  UserRound,
  Zap,
} from "lucide-react";
import { loginAction } from "@/lib/auth/actions";
import { Input } from "@/components/ui";

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

const DEFAULT_PINS: Record<string, string> = {
  "admin-01": "2468",
  "judge-chowon": "1234",
};

export function LoginForm({
  people,
  errorText,
  artworkCount = 61,
  initialTab = "JUDGE",
}: {
  people: LoginPerson[];
  errorText: string | null;
  artworkCount?: number;
  initialTab?: "JUDGE" | "ADMIN";
}) {

  const judges = useMemo(() => people.filter((p) => p.role === "JUDGE"), [people]);
  const admins = useMemo(() => people.filter((p) => p.role !== "JUDGE"), [people]);

  const [activeTab, setActiveTab] = useState<"JUDGE" | "ADMIN">(initialTab);
  const [judgeIndex, setJudgeIndex] = useState(0);
  const [adminIndex, setAdminIndex] = useState(0);
  const [showPinInput, setShowPinInput] = useState(false);
  const [customPin, setCustomPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentList = activeTab === "JUDGE" ? judges : admins;
  const currentIndex = activeTab === "JUDGE" ? judgeIndex : adminIndex;
  const currentPerson = currentList[currentIndex] || people[0];

  const handlePrev = () => {
    if (activeTab === "JUDGE") {
      setJudgeIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, judges.length - 1)));
    } else {
      setAdminIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, admins.length - 1)));
    }
  };

  const handleNext = () => {
    if (activeTab === "JUDGE") {
      setJudgeIndex((prev) => (prev < judges.length - 1 ? prev + 1 : 0));
    } else {
      setAdminIndex((prev) => (prev < admins.length - 1 ? prev + 1 : 0));
    }
  };

  if (!currentPerson) return null;

  const resolvedPin = customPin || DEFAULT_PINS[currentPerson.id] || (activeTab === "JUDGE" ? "1234" : "2468");
  const isJudge = activeTab === "JUDGE";

  return (
    <div className="mx-auto w-full max-w-xl">
      {/* Gartic Phone Lobby Card */}
      <div className="relative rounded-3xl border-3 border-slate-900 bg-white p-6 sm:p-8 shadow-[8px_8px_0_#0f172a]">

        {/* Room Header Pill */}
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
              LOBBY · TALES ARTVENTURE
            </span>
          </div>
          <span className="rounded-full border-2 border-slate-900 bg-yellow-300 px-3 py-0.5 text-xs font-black text-slate-900 shadow-[1px_1px_0_#0f172a]">
            {artworkCount} ARTWORKS
          </span>

        </div>

        {/* Mode Selector Tabs (POP Game Style) */}
        <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border-2 border-slate-900 bg-slate-100 p-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab("JUDGE")}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-black transition-all ${
              activeTab === "JUDGE"
                ? "border-2 border-slate-900 bg-sky-400 text-slate-950 shadow-[2px_2px_0_#0f172a]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Gamepad2 size={18} />
            <span>โหมดกรรมการ (Judge)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ADMIN")}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-black transition-all ${
              activeTab === "ADMIN"
                ? "border-2 border-slate-900 bg-amber-400 text-slate-950 shadow-[2px_2px_0_#0f172a]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Crown size={18} />
            <span>โหมดแอดมิน (Admin)</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorText && (
          <div className="mt-4 rounded-2xl border-2 border-rose-500 bg-rose-50 px-4 py-3 text-center text-sm font-bold text-rose-800 shadow-[2px_2px_0_#e11d48]">
            ⚠️ {errorText}
          </div>
        )}

        {/* Main Gartic Phone Character Showcase */}
        <div className="mt-6 flex flex-col items-center">
          {/* Avatar Spotlight with Left/Right Arrows */}
          <div className="flex w-full items-center justify-between gap-4">
            {/* Prev Button */}
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentList.length <= 1}
              aria-label="ตัวละครก่อนหน้า"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-slate-900 bg-slate-100 text-slate-900 shadow-[2px_2px_0_#0f172a] transition hover:bg-white hover:-translate-x-0.5 active:translate-x-0 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft size={24} strokeWidth={3} />
            </button>

            {/* Central Giant Avatar Circle */}
            <div className="relative group">
              <div
                className={`relative grid h-28 w-28 sm:h-32 sm:w-32 place-items-center rounded-full border-4 border-slate-900 p-1 shadow-[4px_4px_0_#0f172a] transition-transform duration-200 hover:scale-105 ${
                  isJudge ? "bg-sky-200" : "bg-amber-200"
                }`}
              >
                {currentPerson.avatar_url ? (
                  <img
                    src={currentPerson.avatar_url}
                    alt={currentPerson.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span
                    className="grid h-full w-full place-items-center rounded-full text-white"
                    style={{ background: currentPerson.avatar_color }}
                  >
                    <UserRound size={48} />
                  </span>
                )}
              </div>

              {/* Character Floating Badge */}
              <div className="absolute -bottom-2 -right-2 rounded-xl border-2 border-slate-900 bg-yellow-300 p-1.5 shadow-[1px_1px_0_#0f172a]">
                {isJudge ? (
                  <Sparkles size={16} className="text-slate-950" fill="currentColor" />
                ) : (
                  <Crown size={16} className="text-slate-950" fill="currentColor" />
                )}
              </div>
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleNext}
              disabled={currentList.length <= 1}
              aria-label="ตัวละครถัดไป"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-slate-900 bg-slate-100 text-slate-900 shadow-[2px_2px_0_#0f172a] transition hover:bg-white hover:translate-x-0.5 active:translate-x-0 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={24} strokeWidth={3} />
            </button>
          </div>

          {/* Character Name & Badge */}
          <div className="mt-4 text-center">
            <span
              className={`inline-block rounded-full border border-slate-900 px-3 py-0.5 text-xs font-black uppercase shadow-sm ${
                isJudge ? "bg-emerald-200 text-emerald-950" : "bg-amber-200 text-amber-950"
              }`}
            >
              {isJudge ? "🏃 กรรมการตัดสิน (Judge)" : "👑 ผู้ดูแลระบบ (Super Admin)"}
            </span>
            <h3 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
              {currentPerson.name}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              {isJudge ? "ตรวจและให้คะแนน 69 ผลงานแฟนอาร์ต (Blind Mode)" : "จัดการทีมกรรมการ ล็อกผลคะแนน และดูโพเดียม"}
            </p>
          </div>

          {/* Mini-Avatar Carousel Pills (if more than 1) */}
          {currentList.length > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2 overflow-x-auto py-1">
              {currentList.map((p, idx) => {
                const isSelected = idx === currentIndex;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (activeTab === "JUDGE") setJudgeIndex(idx);
                      else setAdminIndex(idx);
                    }}
                    className={`relative rounded-xl border-2 p-1 transition-all ${
                      isSelected
                        ? "border-slate-900 bg-sky-200 shadow-[2px_2px_0_#0f172a] -translate-y-1"
                        : "border-slate-300 bg-white hover:border-slate-500"
                    }`}
                  >
                    {p.avatar_url ? (
                      <img
                        src={p.avatar_url}
                        alt={p.name}
                        className="h-9 w-9 rounded-lg object-cover"
                      />
                    ) : (
                      <div
                        className="grid h-9 w-9 place-items-center rounded-lg text-xs font-bold text-white"
                        style={{ background: p.avatar_color }}
                      >
                        {p.name.slice(0, 2)}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Main Action Form */}
        <form
          action={loginAction}
          onSubmit={() => setIsSubmitting(true)}
          className="mt-6 space-y-4"
        >
          <input
            type="hidden"
            name="identity"
            value={`${currentPerson.contest_id}:${currentPerson.id}`}
          />
          <input
            type="hidden"
            name="pin"
            value={resolvedPin}
          />

          {/* GIANT Gartic Phone-style Play Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full arcade-btn-giant py-4 px-6 text-lg sm:text-xl font-black text-white transition-all active:scale-[0.98] ${
              isJudge
                ? "bg-gradient-to-b from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 shadow-[0_6px_0_#15803d]"
                : "bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-[0_6px_0_#b45309]"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={24} />
                <span>กำลังโหลดห้องตัดสิน...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Zap size={22} fill="currentColor" />
                <span>
                  {isJudge ? "START เริ่มตัดสินทันที 1-Click 🎮" : "MANAGE เข้าแอดมินทันที 1-Click 👑"}
                </span>
              </span>
            )}
          </button>

          {/* Custom PIN Accordion Toggle */}
          <div className="pt-2 text-center">
            {!showPinInput ? (
              <button
                type="button"
                onClick={() => setShowPinInput(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
              >
                <KeyRound size={13} className="text-amber-500" />
                <span>ต้องการเปลี่ยนหรือใส่รหัส PIN เอง? (คลิกที่นี่)</span>
              </button>
            ) : (
              <div className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-4 text-left shadow-[2px_2px_0_#0f172a]">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="custom-pin" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <KeyRound size={14} className="text-amber-500" />
                    <span>ระบุรหัส PIN 4–6 หลัก</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPinInput(false);
                      setCustomPin("");
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600"
                  >
                    ซ่อน ✕
                  </button>
                </div>
                <Input
                  id="custom-pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]{4,6}"
                  maxLength={6}
                  placeholder={`รหัสเริ่มต้น: ${DEFAULT_PINS[currentPerson.id] || "1234"}`}
                  value={customPin}
                  onChange={(e) => setCustomPin(e.target.value)}
                  className="text-center font-mono text-xl font-bold tracking-widest text-slate-900"
                />
                <p className="mt-1.5 text-[11px] text-slate-500">
                  สำหรับตัวละครนี้ รหัสมาตรฐานถูกใส่ให้อัตโนมัติ ({resolvedPin})
                </p>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

