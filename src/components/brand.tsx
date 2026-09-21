"use client";

import { Sparkles, Trophy } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3.5">
      <div className="relative flex items-center justify-center">
        <img
          src="https://talesrunner.thehof.gg/asset/images/v0/logo.webp"
          alt="Tales Runner Logo"
          className={compact ? "h-10 w-auto object-contain" : "h-14 w-auto object-contain"}
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = "none";
          }}
        />
        <span className="hidden place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 p-2 shadow-md [display:var(--fallback-icon,none)]">
          <Trophy size={compact ? 20 : 28} strokeWidth={2.5} />
        </span>
      </div>
      {!compact && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-sky-700">
              Fan-Art Contest
            </span>
            <Sparkles size={13} className="text-amber-500" fill="currentColor" />
          </div>
          <div className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            สนามประลองตัดสินผลงาน
          </div>
        </div>
      )}
    </div>
  );
}
