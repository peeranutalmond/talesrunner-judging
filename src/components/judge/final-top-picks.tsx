"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  Eye,
  Flag,
  Heart,
  Search,
  Sparkles,
  Star,
  Trophy,
  X,
} from "lucide-react";
import type { CategoryPill, JudgeTopPickItem, QueueItem } from "@/lib/services/judging";
import type { Contest } from "@/lib/db/types";

interface FinalTopPicksProps {
  contestId: string;
  judgeId: string;
  judgeName: string;
  queue: QueueItem[];
  categories: CategoryPill[];
  initialTopPicks: JudgeTopPickItem[];
  contest: Contest;
}

type TargetMode = "range_3_5" | "fixed_3" | "fixed_4" | "fixed_5";
type SortOption = "score_desc" | "score_asc" | "sub_num_asc" | "category";

export function FinalTopPicks({
  contestId,
  judgeName,
  queue,
  categories,
  initialTopPicks,
  contest,
}: FinalTopPicksProps) {
  // Initialize picks from props
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (initialTopPicks.length > 0) {
      return [...initialTopPicks].sort((a, b) => a.rank_order - b.rank_order).map((p) => p.submission_id);
    }
    // Default: if none saved yet, pick none initially
    return [];
  });

  const [targetMode, setTargetMode] = useState<TargetMode>("range_3_5");
  const [sortBy, setSortBy] = useState<SortOption>("score_desc");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(
    initialTopPicks.length > 0 ? "เคยบันทึก Top Picks ไว้แล้ว (สามารถแก้ไขได้)" : null,
  );
  const [isSuccess, setIsSuccess] = useState(initialTopPicks.length > 0);

  // Target count logic (fix ได้)
  const { minTarget, maxTarget } = useMemo(() => {
    switch (targetMode) {
      case "fixed_3":
        return { minTarget: 3, maxTarget: 3 };
      case "fixed_4":
        return { minTarget: 4, maxTarget: 4 };
      case "fixed_5":
        return { minTarget: 5, maxTarget: 5 };
      case "range_3_5":
      default:
        return {
          minTarget: contest.top_picks_min ?? 3,
          maxTarget: contest.top_picks_max ?? 5,
        };
    }
  }, [targetMode, contest.top_picks_min, contest.top_picks_max]);

  const count = selectedIds.length;
  const isValidCount = count >= minTarget && count <= maxTarget;

  // Toggle selection
  const handleTogglePick = (submissionId: string) => {
    if (selectedIds.includes(submissionId)) {
      // Remove
      setSelectedIds((prev) => prev.filter((id) => id !== submissionId));
      setSaveMessage(null);
    } else {
      // Add
      if (selectedIds.length >= maxTarget) {
        alert(`คุณเลือกครบจำนวนสูงสุด (${maxTarget} ผลงาน) ตามโหมดที่ตั้งไว้แล้ว กรุณายกเลิกผลงานอื่นก่อน หรือเปลี่ยนโหมดจำนวน`);
        return;
      }
      setSelectedIds((prev) => [...prev, submissionId]);
      setSaveMessage(null);
    }
  };

  // Move item up in rank
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setSelectedIds((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
    setSaveMessage(null);
  };

  // Move item down in rank
  const handleMoveDown = (index: number) => {
    if (index >= selectedIds.length - 1) return;
    setSelectedIds((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
    setSaveMessage(null);
  };

  // Remove from rank
  const handleRemoveRank = (id: string) => {
    setSelectedIds((prev) => prev.filter((item) => item !== id));
    setSaveMessage(null);
  };

  // Save action
  const handleSaveTopPicks = async () => {
    if (!isValidCount) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const payload = selectedIds.map((subId, index) => ({
        submissionId: subId,
        rankOrder: index + 1,
      }));

      const res = await fetch("/api/top-picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contestId, picks: payload }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "บันทึกไม่สำเร็จ");
      }

      setIsSuccess(true);
      setSaveMessage(`✓ บันทึก Top ${count} ผลงานที่ชื่นชอบที่สุดเรียบร้อยแล้ว!`);
    } catch (err) {
      setIsSuccess(false);
      setSaveMessage(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSaving(false);
    }
  };

  // Map submission lookup
  const subMap = useMemo(() => {
    const map = new Map<string, QueueItem>();
    for (const item of queue) map.set(item.id, item);
    return map;
  }, [queue]);

  // Filter & Sort gallery
  const displayedItems = useMemo(() => {
    let list = [...queue];

    // Category filter
    if (activeCategory !== "all") {
      list = list.filter(
        (item) => item.category_id === activeCategory || item.category_slug === activeCategory,
      );
    }

    // Search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((item) => {
        const str = `${item.submission_number} ${item.artwork_title} ${item.display_name} ${item.player_id}`.toLowerCase();
        return str.includes(q);
      });
    }

    // Sort order
    list.sort((a, b) => {
      if (sortBy === "score_desc") {
        const scoreDiff = (b.my_total_score ?? 0) - (a.my_total_score ?? 0);
        if (scoreDiff !== 0) return scoreDiff;
        return Number(a.submission_number) - Number(b.submission_number);
      }
      if (sortBy === "score_asc") {
        const scoreDiff = (a.my_total_score ?? 0) - (b.my_total_score ?? 0);
        if (scoreDiff !== 0) return scoreDiff;
        return Number(a.submission_number) - Number(b.submission_number);
      }
      if (sortBy === "sub_num_asc") {
        return Number(a.submission_number) - Number(b.submission_number);
      }
      if (sortBy === "category") {
        const catA = a.category_name ?? "";
        const catB = b.category_name ?? "";
        return catA.localeCompare(catB);
      }
      return 0;
    });

    return list;
  }, [queue, activeCategory, searchQuery, sortBy]);

  // Medals for top 5
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return {
        label: "อันดับ 1",
        medal: "🥇",
        badgeClass: "bg-amber-400 text-slate-950 border-slate-900",
        ringClass: "ring-4 ring-amber-400",
      };
    }
    if (rank === 2) {
      return {
        label: "อันดับ 2",
        medal: "🥈",
        badgeClass: "bg-slate-200 text-slate-900 border-slate-900",
        ringClass: "ring-4 ring-slate-300",
      };
    }
    if (rank === 3) {
      return {
        label: "อันดับ 3",
        medal: "🥉",
        badgeClass: "bg-amber-600 text-white border-slate-900",
        ringClass: "ring-4 ring-amber-600",
      };
    }
    return {
      label: `อันดับ ${rank}`,
      medal: "⭐",
      badgeClass: "bg-sky-400 text-slate-950 border-slate-900",
      ringClass: "ring-4 ring-sky-300",
    };
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="comic-card-yellow p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-slate-900 bg-amber-400 text-2xl shadow-[2px_2px_0_#0f172a]">
              ⭐
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-900 bg-white px-2 py-0.5 text-[11px] font-black uppercase text-slate-900">
                <Sparkles size={12} className="text-amber-500" />
                <span>FINAL STAGE · JUDGE TOP PICKS</span>
              </div>
              <h2 className="font-rowdies mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
                เลือกผลงานที่ชื่นชอบที่สุด 3 - 5 อันดับ
              </h2>
              <p className="mt-1 text-xs font-bold text-slate-700 sm:text-sm">
                สำหรับกรรมการ: <strong>{judgeName}</strong> · ระบบเรียงผลงานตามคะแนนที่คุณให้ไว้ เพื่อให้ติ๊กเลือกภาพที่ประทับใจที่สุดได้อย่างแม่นยำ
              </p>
            </div>
          </div>

          {/* Quick Target Mode Selector ("(fix ได้)") */}
          <div className="rounded-2xl border-2 border-slate-900 bg-white p-2.5 shadow-[3px_3px_0_#0f172a]">
            <p className="font-rowdies mb-1.5 text-center text-[11px] font-black uppercase text-slate-600">
              กำหนดจำนวนที่ต้องการเลือก:
            </p>
            <div className="flex flex-wrap gap-1.5 text-xs font-black">
              {[
                ["range_3_5", "3 - 5 อัน (ยืดหยุ่น)"],
                ["fixed_3", "ล็อก 3 อัน 🔒"],
                ["fixed_4", "ล็อก 4 อัน 🔒"],
                ["fixed_5", "ล็อก 5 อัน 🔒"],
              ].map(([modeKey, label]) => (
                <button
                  key={modeKey}
                  type="button"
                  onClick={() => setTargetMode(modeKey as TargetMode)}
                  className={`rounded-xl px-2.5 py-1.5 transition-all ${
                    targetMode === modeKey
                      ? "border-2 border-slate-900 bg-amber-400 text-slate-950 shadow-[2px_2px_0_#0f172a]"
                      : "border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Podium Showcase Bar (Selected Favorites) */}
      <div className="comic-card bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-500" size={22} />
            <h3 className="font-rowdies text-lg font-black text-slate-900 sm:text-xl">
              แท่นรางวัล Top Picks ของคุณ ({count} / {maxTarget} ผลงาน)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-xl border-2 border-slate-900 px-3 py-1 text-xs font-black shadow-[1px_1px_0_#0f172a] ${
                isValidCount
                  ? "bg-emerald-400 text-slate-950"
                  : "bg-amber-100 text-amber-900"
              }`}
            >
              {isValidCount
                ? `✓ ครบตามเกณฑ์ (${minTarget}${minTarget !== maxTarget ? ` - ${maxTarget}` : ""} ผลงาน)`
                : `เลือกเพิ่มอีก ${minTarget - count} ผลงาน เพื่อให้ครบเกณฑ์`}
            </span>

            <button
              type="button"
              onClick={handleSaveTopPicks}
              disabled={!isValidCount || isSaving}
              className={`arcade-btn px-4 py-2 text-xs font-black sm:text-sm ${
                isValidCount && !isSaving
                  ? "arcade-btn-primary animate-pulse"
                  : "cursor-not-allowed opacity-50 bg-slate-300 text-slate-600 border-slate-400"
              }`}
            >
              {isSaving ? "กำลังบันทึก..." : `💾 บันทึก Top Picks (${count} อัน) 🚀`}
            </button>
          </div>
        </div>

        {saveMessage && (
          <div
            className={`rounded-xl border-2 p-3 text-xs font-black flex items-center gap-2 ${
              isSuccess
                ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                : "border-amber-500 bg-amber-50 text-amber-900"
            }`}
          >
            {isSuccess ? <CheckCircle2 size={16} /> : <Sparkles size={16} />}
            <span>{saveMessage}</span>
          </div>
        )}

        {/* Selected Podium Cards */}
        {selectedIds.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center bg-slate-50/50">
            <span className="text-4xl">👇</span>
            <h4 className="font-rowdies mt-2 text-base font-black text-slate-800">
              ยังไม่มีผลงานที่ถูกเลือกเป็น Top Pick
            </h4>
            <p className="mt-1 text-xs font-bold text-slate-500">
              เลื่อนลงไปดูผลงานด้านล่าง แล้วกดปุ่ม <strong>&quot;⭐ ติ๊กเป็น Top Pick&quot;</strong> เพื่อจัดอันดับ 3 - 5 ชิ้นงานที่ประทับใจ
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {selectedIds.map((subId, index) => {
              const sub = subMap.get(subId);
              if (!sub) return null;
              const rank = index + 1;
              const badge = getRankBadge(rank);

              return (
                <div
                  key={subId}
                  className={`comic-card flex flex-col justify-between p-3 bg-white ${badge.ringClass} relative overflow-hidden`}
                >
                  {/* Top Rank Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg border-2 px-2 py-0.5 text-xs font-black shadow-sm ${badge.badgeClass}`}
                    >
                      <span>{badge.medal}</span>
                      <span>{badge.label}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveRank(subId)}
                      title="ยกเลิกการเลือก"
                      className="rounded-full p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Artwork Image */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border-2 border-slate-900 bg-slate-950">
                    <img
                      src={sub.thumbnail_url || sub.image_url}
                      alt={sub.artwork_title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFullscreenImage(sub.image_url)}
                      className="absolute bottom-1.5 right-1.5 rounded-lg border border-slate-900 bg-white/90 p-1 text-slate-900 shadow-sm hover:bg-white"
                      title="ดูภาพขนาดเต็ม"
                    >
                      <Eye size={13} />
                    </button>
                  </div>

                  {/* Artwork Info */}
                  <div className="mt-2 min-w-0">
                    <p className="font-rowdies text-xs font-black text-sky-700">
                      #{sub.submission_number}
                    </p>
                    <h5 className="font-rowdies truncate text-sm font-black text-slate-900" title={sub.artwork_title}>
                      {sub.artwork_title}
                    </h5>
                    <div className="mt-1 flex items-center justify-between text-[11px] font-bold text-slate-600">
                      <span>คะแนน:</span>
                      <strong className="text-amber-600 font-black">
                        ⭐ {sub.my_total_score}
                      </strong>
                    </div>
                  </div>

                  {/* Re-order arrows */}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="inline-flex items-center gap-0.5 rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
                      title="เลื่อนขึ้นอันดับสูงกว่า"
                    >
                      <ArrowUp size={12} />
                      <span>ขึ้น</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === selectedIds.length - 1}
                      className="inline-flex items-center gap-0.5 rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
                      title="เลื่อนลงอันดับต่ำกว่า"
                    >
                      <span>ลง</span>
                      <ArrowDown size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sorting & Filter Controls Bar */}
      <div className="comic-card bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1">
            <Search size={16} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อภาพ, หมายเลข, ศิลปิน..."
              className="w-full rounded-xl border-2 border-slate-900 py-1.5 pl-9 pr-3 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          {/* Sort Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-black">
            <span className="text-slate-500 mr-1">เรียงรูป:</span>
            {[
              ["score_desc", "⭐ คะแนนที่คุณให้ (มาก ➔ น้อย)"],
              ["score_asc", "📉 คะแนน (น้อย ➔ มาก)"],
              ["sub_num_asc", "🔢 หมายเลข (#001 - #069)"],
              ["category", "🎨 แยกตามสนาม"],
            ].map(([sortKey, label]) => (
              <button
                key={sortKey}
                type="button"
                onClick={() => setSortBy(sortKey as SortOption)}
                className={`rounded-xl px-3 py-1.5 transition-all ${
                  sortBy === sortKey
                    ? "border-2 border-slate-900 bg-sky-400 text-slate-950 shadow-[2px_2px_0_#0f172a] -translate-y-0.5"
                    : "border border-slate-300 bg-slate-100 text-slate-700 hover:bg-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-black">
            <span className="text-slate-500 mr-1">สนาม:</span>
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id || (activeCategory === "all" && cat.id === "all");
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`rounded-xl px-2.5 py-1 text-xs font-black transition-all ${
                    isActive
                      ? "border-2 border-slate-900 bg-amber-400 text-slate-950 shadow-[1px_1px_0_#0f172a]"
                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span>{cat.icon || "🎨"}</span>
                  <span className="ml-1">{cat.name}</span>
                  <span className="ml-1 rounded-full bg-black/10 px-1.5 py-0.2 text-[10px]">
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs font-bold text-slate-500">
            แสดง {displayedItems.length} จาก {queue.length} ผลงาน
          </div>
        </div>
      </div>

      {/* Artwork Cards Grid ("เรียงรูปทุกรูปอีกรอบนึง แล้วติ๊กเลือก") */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {displayedItems.map((item) => {
          const isSelected = selectedIds.includes(item.id);
          const selectedRank = isSelected ? selectedIds.indexOf(item.id) + 1 : null;
          const badge = selectedRank ? getRankBadge(selectedRank) : null;

          return (
            <div
              key={item.id}
              className={`comic-card flex flex-col justify-between overflow-hidden bg-white transition-all ${
                isSelected
                  ? "border-amber-500 ring-4 ring-amber-300 shadow-[6px_6px_0_#0f172a] -translate-y-1 bg-amber-50/30"
                  : "hover:-translate-y-1 hover:border-sky-500"
              }`}
            >
              {/* Image & Badges */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
                <img
                  src={item.thumbnail_url || item.image_url}
                  alt={item.artwork_title}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition duration-200 hover:scale-105"
                />

                {/* Fullscreen Button */}
                <button
                  type="button"
                  onClick={() => setFullscreenImage(item.image_url)}
                  className="absolute right-2 top-2 rounded-lg border border-slate-900 bg-white/90 p-1.5 text-slate-900 shadow-sm hover:bg-white"
                  title="ดูภาพขนาดเต็ม"
                >
                  <Eye size={14} />
                </button>

                {/* Score Pill overlay */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-lg border border-slate-900 bg-slate-900/90 px-2 py-0.5 text-xs font-black text-amber-400 shadow-sm backdrop-blur-sm">
                  <Star size={12} fill="currentColor" />
                  <span>{item.my_total_score} คะแนน</span>
                </div>

                {/* Rank Badge if selected */}
                {badge && (
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-lg border-2 px-2.5 py-1 text-xs font-black shadow-md bg-amber-400 text-slate-950 border-slate-900 animate-pop-in">
                    <span>{badge.medal}</span>
                    <span>{badge.label}</span>
                  </div>
                )}

                {item.flagged && (
                  <div className="absolute right-2 bottom-2 grid h-6 w-6 place-items-center rounded-full border border-slate-900 bg-rose-500 text-white shadow-sm" title="ติดธงไว้">
                    <Flag size={12} fill="currentColor" />
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-3.5 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-rowdies text-xs font-black text-sky-700">
                      #{item.submission_number}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-black text-white"
                      style={{ background: item.category_color || "#64748B" }}
                    >
                      {item.category_icon || "🎨"} {item.category_name}
                    </span>
                  </div>

                  <h4 className="font-rowdies mt-1 text-base font-black text-slate-900 line-clamp-1" title={item.artwork_title}>
                    {item.artwork_title}
                  </h4>
                </div>

                {/* Tick / Pick Button */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleTogglePick(item.id)}
                    className={`w-full py-2 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? "border-2 border-slate-900 bg-amber-400 text-slate-950 shadow-[2px_2px_0_#0f172a] hover:bg-amber-300"
                        : "border-2 border-slate-900 bg-white hover:bg-amber-50 text-slate-800 shadow-[1px_1px_0_#0f172a]"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check size={16} strokeWidth={3} />
                        <span>เลือกแล้ว ({badge?.label})</span>
                      </>
                    ) : (
                      <>
                        <Heart size={15} className="text-rose-500" />
                        <span>ติ๊กเลือกเป็น Top Pick</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Modal */}
      {fullscreenImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <img
              src={fullscreenImage}
              alt="Fullscreen artwork"
              referrerPolicy="no-referrer"
              className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl border-4 border-slate-900"
            />
            <button
              type="button"
              onClick={() => setFullscreenImage(null)}
              className="absolute -right-3 -top-3 rounded-full border-2 border-slate-900 bg-rose-500 p-2 font-bold text-white shadow-lg hover:bg-rose-600"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
