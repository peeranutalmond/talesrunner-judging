"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Crown,
  Expand,
  ExternalLink,
  Flag,
  Gamepad2,
  LogOut,
  MapPinned,
  Minus,
  MessageSquareQuote,
  Plus,
  RotateCcw,
  Sparkles,
  Star,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { logoutAction, switchToAdminAction } from "@/lib/auth/actions";
import { Button, Progress } from "@/components/ui";
import type { Contest, Criterion } from "@/lib/db/types";
import type { CategoryPill, QueueItem } from "@/lib/services/judging";

type ScoreRow = { criterion_id: string; score: number; comment: string; version: number };

// Tales Runner Stat Icons from the official Thai website
const TR_STAT_ICONS = [
  "https://talesrunner.thehof.gg/asset/images/ic-state01.webp", // Speed
  "https://talesrunner.thehof.gg/asset/images/ic-state02.webp", // Acceleration
  "https://talesrunner.thehof.gg/asset/images/ic-state03.webp", // Strength
  "https://talesrunner.thehof.gg/asset/images/ic-state04.webp", // Control
];

export function ScoringWorkspace({
  contest,
  criteria,
  queue,
  current,
  initialRows,
  judgeName,
  judgeAvatarUrl,
  judgeAvatarColor,
  categories = [],
  activeCategoryId = null,
}: {
  contest: Contest;
  criteria: Criterion[];
  queue: QueueItem[];
  current: QueueItem;
  initialRows: ScoreRow[];
  judgeName: string;
  judgeAvatarUrl: string | null;
  judgeAvatarColor: string;
  categories?: CategoryPill[];
  activeCategoryId?: string | null;
}) {
  const router = useRouter();
  const initialScores = Object.fromEntries(initialRows.map((row) => [row.criterion_id, row.score]));
  const initialVersions = Object.fromEntries(initialRows.map((row) => [row.criterion_id, row.version]));
  const [scores, setScores] = useState<Record<string, number | "">>(initialScores);
  const [versions, setVersions] = useState<Record<string, number>>(initialVersions);
  const [comment, setComment] = useState(initialRows[0]?.comment ?? "");
  const [state, setState] = useState<"idle" | "dirty" | "saving" | "saved" | "error" | "conflict">(
    initialRows.length ? "saved" : "idle"
  );
  const [flagged, setFlagged] = useState(current.flagged);
  const [fullscreen, setFullscreen] = useState(false);
  const [markedComplete, setMarkedComplete] = useState(current.complete);
  const [transitioning, setTransitioning] = useState(false);
  const [imgErrorSubId, setImgErrorSubId] = useState<string | null>(null);
  const imgError = imgErrorSubId === current.id;
  const firstRender = useRef(true);

  const completedFromServer = queue.filter((item) => item.complete).length;
  const completed = completedFromServer + (!current.complete && markedComplete ? 1 : 0);
  const currentIndex = queue.findIndex((item) => item.id === current.id);
  const previous = queue[currentIndex - 1];
  const next = queue[currentIndex + 1];

  const stepperContainerRef = useRef<HTMLDivElement>(null);
  const currentCircleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (currentCircleRef.current && stepperContainerRef.current) {
      currentCircleRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [current.id]);

  const catQuery = activeCategoryId ? `&category=${activeCategoryId}` : "";

  const handleSelectCategory = (catId: string) => {
    if (catId === "all") {
      router.push("/judge");
    } else {
      router.push(`/judge?category=${catId}`);
    }
  };

  const handleJumpTo = async (targetId: string) => {
    if (targetId === current.id) return;
    if (valid && state === "dirty") {
      await save();
    }
    router.push(`/judge?submission=${targetId}${catQuery}`);
  };

  const firstSkippedItem = queue.find((item) => {
    const isDone = item.id === current.id ? (item.complete || markedComplete) : item.complete;
    return !isDone;
  });
  const firstSkippedItemIndex = firstSkippedItem ? queue.findIndex((item) => item.id === firstSkippedItem.id) : -1;

  const validScores = criteria.every(
    (criterion) =>
      scores[criterion.id] !== "" &&
      Number(scores[criterion.id]) >= 0 &&
      Number(scores[criterion.id]) <= Number(criterion.max_score)
  );
  const valid = validScores && (contest.comment_mode !== "REQUIRED" || comment.trim().length > 0);
  const maximumTotal = criteria.reduce((sum, criterion) => sum + Number(criterion.max_score), 0);
  const total = useMemo(
    () =>
      criteria.reduce(
        (sum, criterion) => sum + (scores[criterion.id] === "" ? 0 : Number(scores[criterion.id] ?? 0)),
        0
      ),
    [criteria, scores]
  );

  const save = async () => {
    if (!valid) return false;
    setState("saving");
    try {
      const response = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contestId: contest.id,
          submissionId: current.id,
          criteriaVersionId: contest.active_criteria_version_id,
          comment,
          scores: criteria.map((criterion) => ({
            criterionId: criterion.id,
            score: Number(scores[criterion.id]),
            expectedVersion: versions[criterion.id],
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setState(response.status === 409 ? "conflict" : "error");
        return false;
      }
      setVersions(
        Object.fromEntries(
          data.versions.map((row: { criterionId: string; version: number }) => [row.criterionId, row.version]),
        ),
      );
      setMarkedComplete(true);
      setState("saved");
      return true;
    } catch {
      setState("error");
      return false;
    }
  };

  const saveAndNext = async () => {
    if (!(await save())) return;
    if (contest.progress_animations) {
      setTransitioning(true);
      await new Promise((resolve) => window.setTimeout(resolve, 220));
    }
    const catParam = activeCategoryId ? `&category=${activeCategoryId}` : "";
    if (next) router.push(`/judge?submission=${next.id}${catParam}`);
    else router.push(`/judge/review?tab=top-picks&complete=1${catParam}`);
  };

  const saveRef = useRef(save);
  const saveAndNextRef = useRef(saveAndNext);

  useEffect(() => {
    saveRef.current = save;
    saveAndNextRef.current = saveAndNext;
  });

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!valid || state !== "dirty") return;
    const timer = window.setTimeout(() => void saveRef.current(), 700);
    return () => window.clearTimeout(timer);
  }, [scores, comment, valid, state]);

  const updateScore = (criterion: Criterion, value: number | "") => {
    const nextValue = value === "" ? "" : Math.max(0, Math.min(Number(criterion.max_score), value));
    setScores((existing) => ({ ...existing, [criterion.id]: nextValue }));
    setState("dirty");
  };

  const quickFillScores = (ratio: number = 0.85) => {
    const nextScores: Record<string, number> = {};
    for (const criterion of criteria) {
      nextScores[criterion.id] = Math.round(Number(criterion.max_score) * ratio);
    }
    setScores(nextScores);
    setState("dirty");
  };

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.matches("input,textarea,select")) return;
      if (event.key === "Enter" && valid) {
        event.preventDefault();
        void saveAndNextRef.current();
      }
      const catParam = activeCategoryId ? `&category=${activeCategoryId}` : "";
      if (event.key === "ArrowRight" && next) router.push(`/judge?submission=${next.id}${catParam}`);
      if (event.key === "ArrowLeft" && previous) router.push(`/judge?submission=${previous.id}${catParam}`);
      if (event.code === "Space") {
        event.preventDefault();
        setFullscreen((value) => !value);
      }
      if (event.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [next, previous, router, valid, activeCategoryId]);

  const toggleFlag = async () => {
    const desired = !flagged;
    setFlagged(desired);
    const response = await fetch("/api/flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contestId: contest.id, submissionId: current.id, flagged: desired }),
    });
    if (!response.ok) setFlagged(!desired);
  };

  const progressPercent = Math.round((completed / Math.max(queue.length, 1)) * 100);

  return (
    <div className="min-h-screen pb-32">
      {/* Fullscreen Overlay */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/95 p-4 backdrop-blur-md"
          onClick={() => setFullscreen(false)}
        >
          <button
            className="arcade-btn arcade-btn-secondary absolute right-6 top-6 p-3 text-slate-900"
            aria-label="ปิดภาพเต็มจอ"
          >
            <X size={24} />
          </button>
          <img
            src={current.image_url}
            alt={current.artwork_title}
            referrerPolicy="no-referrer"
            className="max-h-[92vh] max-w-[94vw] rounded-2xl border-4 border-white object-contain shadow-2xl"
          />
        </div>
      )}

      {/* Game HUD Header */}
      <header className="game-hud sticky top-0 z-30 border-b-3 border-slate-900 bg-white/95 px-4 py-3 shadow-[0_4px_12px_rgba(15,23,42,0.1)] backdrop-blur-md sm:px-7">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 sm:gap-6">
          {/* Runner Identity */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative">
              {judgeAvatarUrl ? (
                <img
                  src={judgeAvatarUrl}
                  alt={`โปรไฟล์ ${judgeName}`}
                  className="h-12 w-12 shrink-0 rounded-2xl border-2 border-slate-900 object-cover shadow-[2px_2px_0_#0f172a]"
                />
              ) : (
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-slate-900 text-white shadow-[2px_2px_0_#0f172a]"
                  style={{ background: judgeAvatarColor }}
                >
                  <UserRound size={24} />
                </span>
              )}
              <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border border-slate-900 bg-amber-400 text-[10px] font-black text-slate-950 shadow-sm">
                ★
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="inline-flex items-center gap-1 rounded-md border border-sky-800 bg-sky-500 px-1.5 py-0.2 text-[9px] font-black uppercase text-white shadow-[1px_1px_0_#0369a1]">
                  <Gamepad2 size={11} /> Runner
                </span>
              </div>
              <p className="font-rowdies truncate text-base font-black text-slate-950 sm:text-lg leading-tight mt-0.5">
                {judgeName}
              </p>
            </div>
          </div>

          {/* Checkpoint & XP Gauge */}
          <div className="flex-1 max-w-xl">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-rowdies flex items-center gap-1 text-xs font-black text-slate-900 sm:text-sm">
                <span>🏁 CHECKPOINT</span>
                <span className="rounded-md border border-slate-900 bg-yellow-300 px-1.5 py-0.2 text-slate-950">
                  {completed} / {queue.length}
                </span>
              </span>
              <span className="font-rowdies text-xs font-black text-sky-700 sm:text-sm">
                {progressPercent}% XP
              </span>
            </div>
            <Progress value={progressPercent} />
          </div>

          {/* Navigation & Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/guide"
              target="_blank"
              rel="noreferrer"
              className="arcade-btn arcade-btn-secondary px-3 py-2 text-xs font-black sm:text-sm flex items-center gap-1 bg-amber-100 hover:bg-amber-200 border-2 border-slate-900 shadow-[2px_2px_0_#0f172a]"
              title="เปิดคู่มือวิธีใช้งานระบบ"
            >
              📖 วิธีใช้
            </a>
            <a
              href={`/judge/review?tab=top-picks${activeCategoryId ? `&category=${activeCategoryId}` : ""}`}
              className={`arcade-btn px-3 py-2 text-xs font-black sm:text-sm flex items-center gap-1 border-2 border-slate-900 shadow-[2px_2px_0_#0f172a] ${
                completed === queue.length
                  ? "bg-amber-400 hover:bg-amber-300 text-slate-950 animate-pulse"
                  : "bg-white hover:bg-amber-50 text-slate-800"
              }`}
              title="จัดอันดับและเลือก Top 3-5 ผลงานที่ชื่นชอบที่สุด"
            >
              ⭐ Top Picks
            </a>
            <a
              href={`/judge/review?tab=scores${activeCategoryId ? `&category=${activeCategoryId}` : ""}`}
              className="arcade-btn arcade-btn-secondary px-3 py-2 text-xs font-black sm:text-sm flex items-center gap-1"
            >
              📋 Review
            </a>
            <form action={switchToAdminAction}>
              <button
                type="submit"
                className="arcade-btn px-3 py-2 text-xs font-black sm:text-sm flex items-center gap-1.5 bg-yellow-300 hover:bg-yellow-400 text-slate-950 border-2 border-slate-900 shadow-[2px_2px_0_#0f172a] transition active:translate-y-0.5"
                title="สลับเข้าสู่ระบบแดชบอร์ดหลังบ้าน (Admin)"
              >
                <Crown size={15} />
                <span>ไปหลังบ้าน</span>
              </button>
            </form>
            <form action={logoutAction}>
              <button
                type="submit"
                className="arcade-btn arcade-btn-secondary px-2.5 py-2 text-xs font-black sm:text-sm flex items-center gap-1 text-rose-700 hover:bg-rose-50 border-2 border-slate-900 shadow-[2px_2px_0_#0f172a]"
                title="ออกจากระบบ"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Track Selector & Checkpoint Stepper Area */}
      <section className="mx-auto max-w-[1500px] px-4 pt-4 sm:px-7 space-y-3">
        {/* Track / Stadium Selector */}
        {categories && categories.length > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border-2 border-slate-900 bg-white/95 p-2 sm:p-2.5 shadow-[3px_3px_0_#0f172a] backdrop-blur-sm">
            <div className="flex items-center gap-2 pl-1.5">
              <span className="text-base">🏟️</span>
              <span className="font-rowdies text-xs font-black uppercase tracking-wider text-slate-800">
                เลือกสนามแข่งขัน:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {categories.map((cat) => {
                const isActive = activeCategoryId ? activeCategoryId === cat.id : cat.id === "all";
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`group flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition-all cursor-pointer ${
                      isActive
                        ? "border-2 border-slate-900 bg-sky-400 text-slate-950 shadow-[2px_2px_0_#0f172a] -translate-y-0.5 scale-[1.02]"
                        : "border border-slate-300 bg-slate-100 text-slate-700 hover:bg-white hover:border-slate-800"
                    }`}
                  >
                    <span className="text-sm">{cat.icon || "🎨"}</span>
                    <span>{cat.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                        isActive
                          ? "border border-slate-900 bg-yellow-300 text-slate-950"
                          : "bg-slate-200 text-slate-600 group-hover:bg-slate-300"
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Checkpoint Stepper Bar (วงกลม Checkpoint เขียว / ขาว / ฟ้า) */}
        <div className="rounded-2xl border-2 border-slate-900 bg-white/95 p-3 shadow-[3px_3px_0_#0f172a] backdrop-blur-sm">
          {/* Stepper Header: Title, Legend, and Quick Jump */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="font-rowdies text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                <span>🏁 จุดตรวจ CHECKPOINTS</span>
                <span className="rounded-md border border-slate-900 bg-yellow-300 px-2 py-0.5 text-[11px] font-black text-slate-950">
                  {completed} / {queue.length} ตรวจแล้ว
                </span>
              </span>
            </div>

            {/* Visual Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 border border-slate-900 inline-block shadow-sm" />
                <span className="text-[11px] text-slate-700">ตรวจแล้ว ({completed})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-full bg-white border-2 border-slate-400 inline-block shadow-sm" />
                <span className="text-[11px] text-slate-700">ยังไม่ตรวจ / เผลอข้าม ({queue.length - completed})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-full bg-sky-400 border-2 border-slate-900 ring-2 ring-sky-300 inline-block animate-pulse" />
                <span className="text-[11px] text-slate-900 font-black">กำลังดูอยู่</span>
              </span>

              {/* Quick Jump to First Skipped Item button */}
              {firstSkippedItem && (
                <button
                  type="button"
                  onClick={() => handleJumpTo(firstSkippedItem.id)}
                  className="ml-1 inline-flex items-center gap-1 rounded-lg border border-amber-400 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 text-[11px] font-black text-amber-900 transition active:scale-95 cursor-pointer shadow-xs"
                  title="กระโดดไปผลงานที่ยังไม่ได้ตรวจอันแรกทันที"
                >
                  <span>⚡ ไปจุดที่เผลอข้าม (#{firstSkippedItemIndex + 1})</span>
                </button>
              )}

              {/* Celebration button to go to Top Picks when all items completed */}
              {completed === queue.length && (
                <a
                  href={`/judge/review?tab=top-picks${activeCategoryId ? `&category=${activeCategoryId}` : ""}`}
                  className="ml-1 inline-flex items-center gap-1 rounded-lg border-2 border-slate-900 bg-amber-400 hover:bg-amber-300 px-3 py-1 text-xs font-black text-slate-950 transition active:scale-95 shadow-[1px_1px_0_#0f172a] animate-pulse"
                >
                  <span>🎉 ตรวจครบแล้ว! ➔ ไปเลือก Top Picks ⭐</span>
                </a>
              )}
            </div>
          </div>

          {/* Stepper Circles Scroll Strip */}
          <div
            ref={stepperContainerRef}
            className="mt-3 flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin px-1"
          >
            {queue.map((item, idx) => {
              const isCurrent = item.id === current.id;
              const isItemDone = isCurrent ? (item.complete || markedComplete) : item.complete;
              const itemNumber = idx + 1;

              return (
                <button
                  key={item.id}
                  type="button"
                  ref={isCurrent ? currentCircleRef : null}
                  onClick={() => handleJumpTo(item.id)}
                  className={`group/node relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black transition-all cursor-pointer ${
                    isCurrent
                      ? "border-3 border-slate-950 bg-sky-400 text-slate-950 ring-4 ring-sky-300 scale-115 z-10 shadow-[2px_2px_0_#0f172a]"
                      : isItemDone
                      ? "border-2 border-slate-900 bg-emerald-500 text-white hover:bg-emerald-400 hover:scale-105 shadow-sm"
                      : "border-2 border-slate-300 bg-white text-slate-700 hover:border-slate-900 hover:bg-slate-100 hover:scale-105 shadow-xs"
                  }`}
                  title={`Checkpoint ${itemNumber}: ${item.artwork_title} (${isItemDone ? "ตรวจแล้ว" : "ยังไม่ได้ตรวจ - คลิกเพื่อไป"})`}
                >
                  {isCurrent ? (
                    <span>{itemNumber}</span>
                  ) : isItemDone ? (
                    <span className="text-[11px]">✓</span>
                  ) : (
                    <span>{itemNumber}</span>
                  )}

                  {/* Flag Icon Badge if flagged */}
                  {item.flagged && (
                    <span className="absolute -top-1.5 -right-1.5 grid h-4 w-4 place-items-center rounded-full border border-slate-900 bg-amber-400 text-[8px] text-slate-950 shadow-xs">
                      🚩
                    </span>
                  )}

                  {/* Tooltip on Hover */}
                  <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-900 bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover/node:opacity-100 z-30 shadow-md">
                    #{itemNumber} {item.artwork_title.slice(0, 15)} {isItemDone ? "✓" : "(ข้าม)"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Scoring Arena */}
      <main
        className={`mx-auto grid max-w-[1500px] gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)] lg:px-7 ${
          transitioning ? "checkpoint-exit" : "checkpoint-enter"
        }`}
      >
        {/* Left Column: Artwork & Canvas */}
        <section className="space-y-4">
          <div className="comic-card overflow-hidden p-3 bg-white">
            {/* Artwork Canvas Frame */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-slate-900 bg-slate-950 shadow-inner">
              {/* Category Sticker Badge */}
              <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-yellow-300 px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a]">
                <MapPinned size={14} />
                <span>
                  {current.category_icon ?? "🎨"} {current.category_name ?? "หมวดผลงาน"}
                </span>
              </div>

              {/* Artwork Image or Fallback */}
              {!imgError ? (
                <img
                  src={current.thumbnail_url || current.image_url}
                  alt={current.artwork_title}
                  referrerPolicy="no-referrer"
                  onError={() => setImgErrorSubId(current.id)}
                  className="aspect-[14/9] w-full object-cover transition duration-300 hover:scale-[1.01]"
                />
              ) : (
                <div className="aspect-[14/9] w-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-slate-700 bg-sky-900/60 text-3xl shadow-lg">
                    🎨
                  </div>
                  <h4 className="mt-3 text-lg font-black text-yellow-300 line-clamp-1">
                    {current.artwork_title}
                  </h4>
                  <p className="mt-1 text-xs text-slate-300 max-w-md line-clamp-2">
                    {contest.anonymous_judging
                      ? `หมวด: ${current.category_name ?? "ผลงานประกวด"} · โหมดตัดสินแบบไม่เปิดเผยชื่อผู้เข้าประกวด (Blind Judging)`
                      : (current.description || "ภาพผลงานจาก Google Drive สามารถคลิกเปิดดูภาพต้นฉบับความละเอียดสูงได้ทันที")}
                  </p>
                  <a
                    href={current.source_image_url || current.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-slate-900 bg-sky-400 px-4 py-2 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition hover:bg-sky-300 active:translate-y-0.5"
                  >
                    <ExternalLink size={14} />
                    <span>เปิดดูภาพจริงบน Google Drive ↗</span>
                  </a>
                </div>
              )}

              {/* Action Buttons on Canvas */}
              <div className="absolute bottom-3 right-3 flex gap-2">
                <a
                  href={current.source_image_url || current.image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="arcade-btn arcade-btn-secondary px-3 py-1.5 text-xs font-black"
                >
                  View original
                </a>
                <button
                  type="button"
                  onClick={() => setFullscreen(true)}
                  className="arcade-btn arcade-btn-primary px-3 py-1.5 text-xs font-black flex items-center gap-1"
                >
                  <Expand size={14} /> Fullscreen
                </button>
              </div>
            </div>
          </div>

          {/* Artwork Stage & Details */}
          <div className="comic-card p-4 flex flex-wrap items-center justify-between gap-3 bg-white">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-rowdies rounded-lg border-2 border-slate-900 bg-sky-400 px-2.5 py-0.5 text-xs font-black text-slate-950 shadow-[1px_1px_0_#0f172a]">
                  STAGE {currentIndex + 1}
                </span>
                <span className="font-rowdies text-xs font-black text-slate-500">
                  ARTWORK #{current.submission_number}
                </span>
              </div>
              <h1 className="font-rowdies mt-1 truncate text-2xl font-black text-slate-950 sm:text-3xl">
                {current.artwork_title}
              </h1>
              {!contest.anonymous_judging && contest.metadata_visibility && (
                <p className="mt-1 text-sm font-bold text-slate-500">
                  👤 {current.display_name} · ID: {current.player_id}
                </p>
              )}
            </div>

            {/* Flag / Review Later Button */}
            <Button
              type="button"
              variant={flagged ? "warning" : "secondary"}
              onClick={toggleFlag}
              className="flex items-center gap-2"
            >
              <Flag size={18} fill={flagged ? "currentColor" : "none"} />
              {flagged ? "Flagged for review" : "Flag for review"}
            </Button>
          </div>
        </section>

        {/* Right Column: Scoring Deck (Score Quest) */}
        <div className="comic-card-sky p-5 sm:p-6 space-y-4">
          {/* Header & Star Power Gauge */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-900/20 pb-4">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="rounded-md border border-slate-900 bg-emerald-400 px-2 py-0.5 text-[11px] font-bold uppercase text-slate-950 shadow-[1px_1px_0_#0f172a]">
                  Blind Mode
                </span>
                <span className="text-xs font-semibold text-sky-800">โหมดตัดสินผลงาน</span>
              </div>
              <h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
                สะสมดาวให้ผลงาน
              </h2>
            </div>

            {/* Star Power Score Orb Box */}
            <div className="flex items-center gap-3 rounded-2xl border-2 border-slate-900 bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 px-4 py-2.5 shadow-[3px_3px_0_#0f172a]">
              <div className="grid h-11 w-11 place-items-center rounded-xl border-2 border-slate-900 bg-white text-amber-500 shadow-[1px_1px_0_#0f172a] animate-star">
                <Star size={24} fill="currentColor" />
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-950">
                  Star Power
                </span>
                <div className="text-2xl font-bold text-slate-950 leading-none">
                  {total}{" "}
                  <span className="text-xs font-semibold text-amber-900">/ {maximumTotal}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Guidance & Quick-Fill Helper */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-sky-300 bg-sky-100/90 p-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-medium text-sky-950">
              <Sparkles size={16} className="text-amber-500 shrink-0" />
              <span>วิธีตัดสิน: ปรับคะแนนแต่ละเกณฑ์ หรือแตะปุ่มด่วน</span>
            </div>
            <button
              type="button"
              onClick={() => quickFillScores(0.85)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-sky-700 active:scale-95 transition cursor-pointer"
            >
              <Zap size={13} fill="currentColor" />
              <span>ใส่คะแนนด่วน (85% ทุกเกณฑ์)</span>
            </button>
          </div>

          {/* Criteria Cards */}
          <div className="space-y-3.5">
            {criteria.map((criterion, idx) => {
              const value = scores[criterion.id] ?? "";
              const statIconUrl = TR_STAT_ICONS[idx % TR_STAT_ICONS.length];
              const quickMultipliers = [
                { label: "50%", ratio: 0.5 },
                { label: "70%", ratio: 0.7 },
                { label: "85%", ratio: 0.85 },
                { label: "MAX", ratio: 1.0 },
              ];

              return (
                <div
                  key={criterion.id}
                  className="rounded-2xl border-2 border-slate-900 bg-white p-3.5 sm:p-4 shadow-[2px_2px_0_#0f172a] transition hover:border-sky-600"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      {/* TR Stat Icon */}
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-slate-900 bg-sky-100 shadow-[1px_1px_0_#0f172a]">
                        <img
                          src={statIconUrl}
                          alt="TR Stat"
                          className="h-7 w-7 object-contain drop-shadow"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                        <Sparkles size={16} className="text-amber-500 [display:var(--stat-fallback,none)]" />
                      </div>
                      <div>
                        <h3 className="font-rowdies text-base font-black text-slate-950">
                          {criterion.name}
                        </h3>
                        <p className="text-xs font-bold text-slate-500 line-clamp-2">
                          {criterion.description}
                        </p>
                      </div>
                    </div>
                    <span className="font-rowdies shrink-0 rounded-lg border-2 border-slate-900 bg-yellow-300 px-2 py-0.5 text-xs font-black text-slate-950 shadow-[1px_1px_0_#0f172a]">
                      MAX {criterion.max_score}
                    </span>
                  </div>

                  {/* Input Controls */}
                  {contest.input_mode === "SLIDER" ? (
                    <div className="mt-3 flex items-center gap-3">
                      <input
                        className="w-full h-3 rounded-lg accent-sky-500 cursor-pointer bg-slate-200 border-2 border-slate-900"
                        type="range"
                        min={0}
                        max={criterion.max_score}
                        step={1}
                        value={value === "" ? 0 : value}
                        onChange={(event) => updateScore(criterion, Number(event.target.value))}
                      />
                      <span className="font-rowdies grid h-10 w-14 place-items-center rounded-xl border-2 border-slate-900 bg-amber-300 text-lg font-black shadow-[2px_2px_0_#0f172a]">
                        {value === "" ? 0 : value}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-3.5 flex flex-wrap items-center gap-2">
                      {/* Decrement Button */}
                      <Button
                        variant="secondary"
                        type="button"
                        aria-label={`ลดคะแนน ${criterion.name}`}
                        className="h-10 w-10 p-0 rounded-xl"
                        onClick={() => updateScore(criterion, Math.max(0, Number(value || 0) - 1))}
                      >
                        <Minus size={18} strokeWidth={3} />
                      </Button>

                      {/* Score Number Input */}
                      <input
                        aria-label={`คะแนน ${criterion.name}`}
                        className="font-rowdies focus-ring h-10 w-16 rounded-xl border-2 border-slate-900 bg-amber-50 text-center text-xl font-black text-slate-950 shadow-[2px_2px_0_#0f172a]"
                        type="number"
                        min={0}
                        max={criterion.max_score}
                        value={value}
                        onChange={(event) =>
                          updateScore(criterion, event.target.value === "" ? "" : Number(event.target.value))
                        }
                      />

                      {/* Increment Button */}
                      <Button
                        variant="secondary"
                        type="button"
                        aria-label={`เพิ่มคะแนน ${criterion.name}`}
                        className="h-10 w-10 p-0 rounded-xl"
                        onClick={() => updateScore(criterion, Number(value || 0) + 1)}
                      >
                        <Plus size={18} strokeWidth={3} />
                      </Button>

                      {/* Quick Score Multiplier Buttons */}
                      <div className="ml-auto flex flex-wrap gap-1">
                        {quickMultipliers.map((mult) => {
                          const targetScore = Math.round(Number(criterion.max_score) * mult.ratio);
                          return (
                            <button
                              key={mult.label}
                              type="button"
                              onClick={() => updateScore(criterion, targetScore)}
                              className="font-rowdies arcade-btn rounded-lg border-2 border-slate-900 bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-700 shadow-[1px_1px_0_#0f172a] hover:bg-yellow-300 hover:text-slate-950 active:translate-y-0.5"
                            >
                              {mult.label} ({targetScore})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Comment Box (Speech Bubble Style) */}
          {contest.comment_mode !== "DISABLED" && (
            <div className="rounded-2xl border-2 border-slate-900 bg-white p-3.5 shadow-[2px_2px_0_#0f172a]">
              <label className="block">
                <span className="mb-2 flex items-center gap-1.5 font-rowdies text-xs font-black text-slate-800">
                  <MessageSquareQuote size={16} className="text-sky-600" />
                  <span>บันทึกความเห็นนักวิ่ง</span>
                  {contest.comment_mode === "OPTIONAL" ? (
                    <span className="font-sans font-bold text-slate-400">(ไม่บังคับ)</span>
                  ) : (
                    <span className="font-sans font-bold text-rose-500">*จำเป็น</span>
                  )}
                </span>
                <textarea
                  value={comment}
                  onChange={(event) => {
                    setComment(event.target.value);
                    setState("dirty");
                  }}
                  className="focus-ring min-h-20 w-full resize-y rounded-xl border-2 border-slate-900 bg-slate-50 p-3 text-sm font-bold text-slate-800 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] placeholder:font-normal placeholder:text-slate-400"
                  placeholder="เขียนคอมเมนต์ หรือจุดเด่นของผลงานนี้..."
                />
              </label>
            </div>
          )}

          {/* Feedback & Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div aria-live="polite" className="font-rowdies text-sm font-black">
              {state === "saving" && (
                <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-sky-200 px-3 py-1 text-sky-950 shadow-[1px_1px_0_#0f172a]">
                  <RotateCcw className="animate-spin" size={14} /> กำลังบันทึก...
                </span>
              )}
              {state === "saved" && (
                <span className="stamp border-emerald-600 bg-emerald-100 text-emerald-900">
                  <Check className="inline mr-1" size={16} strokeWidth={3} /> SAVED!
                </span>
              )}
              {state === "error" && (
                <span className="stamp border-rose-600 bg-rose-100 text-rose-900">
                  ยังบันทึกไม่ได้{" "}
                  <button onClick={() => void save()} className="underline ml-1">
                    ลองใหม่
                  </button>
                </span>
              )}
              {state === "conflict" && (
                <span className="stamp border-amber-600 bg-amber-100 text-amber-950">
                  ⚠️ มีการแก้ไขจากเครื่องอื่น กรุณารีเฟรช
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-slate-500">
              ⌨️ กด <kbd className="rounded border border-slate-400 bg-slate-100 px-1 py-0.5">Enter</kbd> = บันทึก & ผลงานถัดไป
            </span>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Control Bar (Game Controller Bar) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-slate-900 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(15,23,42,0.12)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3">
          {/* Navigation Controls: Previous & Skip */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              disabled={!previous || transitioning}
              onClick={() => previous && router.push(`/judge?submission=${previous.id}${catQuery}`)}
              className="px-3.5 py-2 text-xs sm:text-sm font-bold"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
              <span>ก่อนหน้า</span>
            </Button>

            {next && (
              <button
                type="button"
                onClick={() => router.push(`/judge?submission=${next.id}${catQuery}`)}
                className="flex items-center gap-1 rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-200 active:scale-95 transition cursor-pointer"
                title="ข้ามไปดูภาพถัดไปโดยยังไม่บันทึกคะแนน"
              >
                <span>ข้ามไปก่อน</span>
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Current Track & Stage Indicator */}
          <div className="hidden text-center text-sm font-semibold text-slate-700 sm:block">
            สนาม: {current.category_icon ?? "🎨"} {current.category_name ?? "STAGE"}{" "}
            <span className="rounded-md border border-slate-900 bg-amber-300 px-2 py-0.5 font-bold text-slate-950">
              ผลงานที่ {currentIndex + 1} / {queue.length}
            </span>
          </div>

          {/* Save & Next Action Button */}
          <div className="flex items-center gap-2.5">
            {!valid && (
              <span className="text-xs font-medium text-amber-800 hidden md:inline bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                ใส่คะแนนครบทุกข้อเพื่อบันทึก
              </span>
            )}
            <Button
              variant="success"
              disabled={!valid || state === "saving" || transitioning}
              onClick={() => void saveAndNext()}
              className="px-6 py-2.5 text-sm sm:text-base font-bold shadow-md flex items-center gap-1.5"
            >
              <span>{transitioning ? "กำลังบันทึก..." : "บันทึก & ภาพถัดไป"}</span>
              <ChevronRight size={18} strokeWidth={3} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
