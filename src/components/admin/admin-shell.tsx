import { BarChart3, ClipboardList, Download, FileClock, Flag, Gamepad2, Gauge, Layers3, LineChart, Settings, SlidersHorizontal, Star, Trophy, UsersRound } from "lucide-react";
import { Brand } from "@/components/brand";
import { logoutAction, switchToJudgeAction } from "@/lib/auth/actions";

const links = [
  ["/admin", "Dashboard", Gauge], ["/admin/contests", "Contests", Flag], ["/admin/submissions", "Submissions", ClipboardList], ["/admin/categories", "Artwork Tracks", Layers3], ["/admin/criteria", "Scoring Criteria", SlidersHorizontal],
  ["/admin/judges", "Judges", UsersRound], ["/admin/progress", "Judging Progress", BarChart3], ["/admin/results", "Results", Trophy],
  ["/admin/analytics", "Analytics", LineChart], ["/admin/export", "Export", Download], ["/admin/audit", "Audit Logs", FileClock], ["/admin/settings", "Settings", Settings],
] as const;

export function AdminShell({ children, contestName, userName }: { children: React.ReactNode; contestName: string; userName: string }) {
  return <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
    <aside className="hidden min-h-screen border-r border-white/80 bg-white/75 p-5 backdrop-blur-xl lg:sticky lg:top-0 lg:block lg:h-screen"><Brand /><p className="mt-7 truncate rounded-xl bg-sky-50 px-3 py-2 text-sm font-bold text-sky-800">{contestName}</p><nav className="mt-4 space-y-1">{links.map(([href,label,Icon]) => <a key={href} href={href} className="focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-sky-50 hover:text-sky-800"><Icon size={18} />{label}</a>)}</nav><div className="absolute inset-x-5 bottom-5 rounded-2xl bg-slate-900 p-4 text-white"><p className="text-xs uppercase tracking-wider text-slate-400">Signed in</p><p className="mt-1 font-black">{userName}</p><form action={switchToJudgeAction}><button className="mt-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition"><Gamepad2 size={14}/> ไปห้องตัดสิน (Judge) →</button></form><form action={logoutAction}><button className="mt-2 text-xs font-bold text-slate-400 hover:text-rose-400 transition">ออกจากระบบ →</button></form></div></aside>
    <div className="min-w-0"><header className="sticky top-0 z-30 border-b border-white/80 bg-white/85 px-4 py-3 backdrop-blur-xl lg:hidden"><div className="flex items-center justify-between"><Brand compact /><strong className="truncate px-3 text-sm">{contestName}</strong><div className="flex items-center gap-2"><form action={switchToJudgeAction}><button aria-label="ไปห้องตัดสิน" className="rounded-xl bg-emerald-600 text-white p-2"><Gamepad2 size={18}/></button></form><form action={logoutAction}><button aria-label="ออกจากระบบ" className="rounded-xl p-2"><Star size={20} /></button></form></div></div><nav className="mt-3 flex gap-2 overflow-x-auto pb-1">{links.map(([href,label,Icon]) => <a key={href} href={href} className="flex shrink-0 items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-bold"><Icon size={15}/>{label}</a>)}</nav></header>{children}</div>
  </div>;
}
