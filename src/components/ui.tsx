import { clsx } from "clsx";
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "warning";
}) {
  return (
    <button
      className={clsx(
        "focus-ring inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2.5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50",
        {
          "arcade-btn arcade-btn-primary": variant === "primary",
          "arcade-btn arcade-btn-secondary": variant === "secondary",
          "arcade-btn-ghost rounded-xl": variant === "ghost",
          "arcade-btn arcade-btn-danger": variant === "danger",
          "arcade-btn arcade-btn-success": variant === "success",
          "arcade-btn arcade-btn-warning": variant === "warning",
        },
        className
      )}
      {...props}
    />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "focus-ring min-h-11 w-full rounded-xl border-2 border-slate-900 bg-white px-3.5 py-2 text-base font-bold text-slate-900 shadow-[2px_2px_0_#0f172a] transition focus:border-sky-500 focus:shadow-[2px_2px_0_#0284c7] placeholder:font-normal placeholder:text-slate-400",
        props.className
      )}
    />
  );
}

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("comic-card p-4 sm:p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: "blue" | "green" | "amber" | "red" | "slate";
}) {
  return (
    <span
      className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black shadow-[1px_1px_0_#0f172a]", {
        "bg-sky-100 text-sky-950 border-2 border-sky-600": tone === "blue",
        "bg-emerald-100 text-emerald-950 border-2 border-emerald-600": tone === "green",
        "bg-amber-100 text-amber-950 border-2 border-amber-600": tone === "amber",
        "bg-rose-100 text-rose-950 border-2 border-rose-600": tone === "red",
        "bg-slate-100 text-slate-900 border-2 border-slate-700": tone === "slate",
      })}
    >
      {children}
    </span>
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  const percent = Math.max(0, Math.min(100, value));
  return (
    <div
      className={clsx(
        "relative h-4 sm:h-5 overflow-hidden rounded-full border-2 border-slate-900 bg-white p-0.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]",
        className
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-amber-400 via-sky-400 to-emerald-400 transition-[width] duration-300 relative"
        style={{ width: `${percent}%` }}
      >
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,rgba(255,255,255,0.6)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.6)_50%,rgba(255,255,255,0.6)_75%,transparent_75%,transparent)] bg-[length:16px_16px]" />
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return (
    <Card className="flex min-h-64 flex-col items-center justify-center p-8 text-center bg-white/95">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl border-2 border-slate-900 bg-amber-300 text-slate-950 shadow-[3px_3px_0_#0f172a]">
        {icon}
      </div>
      <h2 className="font-rowdies text-2xl font-black text-slate-950">{title}</h2>
      <p className="mt-2 max-w-md font-medium text-slate-600">{detail}</p>
    </Card>
  );
}
