"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, Eye, Sparkles, Trophy } from "lucide-react";
import type { CategoryPill, QueueItem } from "@/lib/services/judging";

interface AutoTopPicksProps {
  queue: QueueItem[];
  categories: CategoryPill[];
  judgeName: string;
}

export function AutoTopPicks({ queue, categories, judgeName }: AutoTopPicksProps) {
  const actualCategories = useMemo(() => {
    return categories.filter((c) => c.id !== "all");
  }, [categories]);

  const [activeCategorySlug, setActiveCategorySlug] = useState<string>(
    actualCategories[0]?.slug ?? "digital"
  );

  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
    number: string;
    artist: string;
  } | null>(null);

  // Group and rank completed items by category
  const topPicksByCategory = useMemo(() => {
    const result: Record<string, QueueItem[]> = {};

    for (const cat of actualCategories) {
      const itemsInCat = queue.filter(
        (q) => (q.category_slug === cat.slug || q.category_id === cat.id) && q.complete
      );
      // Sort desc by my_total_score
      const sorted = [...itemsInCat].sort((a, b) => (b.my_total_score ?? 0) - (a.my_total_score ?? 0));
      result[cat.slug] = sorted.slice(0, 5);
    }

    return result;
  }, [queue, actualCategories]);

  const activeCategory = actualCategories.find((c) => c.slug === activeCategorySlug) ?? actualCategories[0];
  const currentTopPicks = activeCategory ? topPicksByCategory[activeCategory.slug] ?? [] : [];

  const getRankMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return { label: "🥇 อันดับ 1 ของคุณ", bg: "bg-amber-300 text-amber-950 border-amber-600" };
      case 2:
        return { label: "🥈 อันดับ 2 ของคุณ", bg: "bg-slate-200 text-slate-900 border-slate-500" };
      case 3:
        return { label: "🥉 อันดับ 3 ของคุณ", bg: "bg-amber-100 text-amber-900 border-amber-500" };
      default:
        return { label: `⭐ อันดับ ${rank} ของคุณ`, bg: "bg-sky-100 text-sky-950 border-sky-400" };
    }
  };

  return (
    <div className="comic-card space-y-6 bg-white p-5 sm:p-7">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-slate-900 pb-5">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-slate-900 bg-amber-400 text-slate-950 shadow-[3px_3px_0_#0f172a]">
            <Trophy size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-rowdies rounded-md border border-slate-900 bg-yellow-300 px-2 py-0.5 text-[10px] font-black uppercase text-slate-950 shadow-[1px_1px_0_#0f172a]">
                Auto Summary
              </span>
              <span className="text-xs font-bold text-slate-500">กรรมการ: {judgeName}</span>
            </div>
            <h2 className="font-rowdies mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
              ⭐ ผลงาน 5 อันดับแรกที่คุณให้คะแนนสูงสุด (Top 5)
            </h2>
            <p className="text-xs font-bold text-slate-500 sm:text-sm">
              คำนวณอัตโนมัติจากคะแนนที่คุณให้จริง แยกหมวดดิจิทัลและกระดาษ โดยไม่ต้องเลือกหรือลากจัดอันดับเอง
            </p>
          </div>
        </div>

        {/* Category Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-slate-900 bg-slate-100 p-1.5 shadow-[2px_2px_0_#0f172a]">
          {actualCategories.map((cat) => {
            const isCatActive = cat.slug === activeCategorySlug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategorySlug(cat.slug)}
                className={`font-rowdies flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-black transition-all ${
                  isCatActive
                    ? "border-2 border-slate-900 bg-sky-400 text-slate-950 shadow-[2px_2px_0_#0f172a] -translate-y-0.5"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                <span>{cat.icon || "🎨"}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Info notice */}
      <div className="flex items-center gap-2.5 rounded-xl border-2 border-slate-900 bg-sky-50 px-4 py-3 text-xs font-bold text-sky-950 shadow-sm">
        <Sparkles size={18} className="shrink-0 text-sky-600" />
        <span>
          หากคุณต้องการเปลี่ยนผลงานใน Top 5 สามารถกดที่ปุ่ม <strong>&quot;แก้ไขคะแนน&quot;</strong> เพื่อปรับคะแนนรายเกณฑ์ได้ ผลอันดับจะอัปเดตให้อัตโนมัติทันที
        </span>
      </div>

      {/* Top 5 Cards Grid */}
      {currentTopPicks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-bold text-slate-400">
          ยังไม่มีผลงานที่ตรวจเสร็จสิ้นในหมวดนี้
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {currentTopPicks.map((item, index) => {
            const rank = index + 1;
            const medal = getRankMedal(rank);

            return (
              <div
                key={item.id}
                className="comic-card group flex flex-col justify-between overflow-hidden bg-white p-3 transition duration-150 hover:-translate-y-1 hover:shadow-[6px_6px_0_#0f172a]"
              >
                <div>
                  {/* Rank Header */}
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-black shadow-sm ${medal.bg}`}
                    >
                      {medal.label}
                    </span>
                    <span className="font-rowdies text-xs font-black text-sky-700">
                      #{item.submission_number}
                    </span>
                  </div>

                  {/* Thumbnail Image */}
                  <div
                    onClick={() =>
                      setPreviewImage({
                        url: item.image_url,
                        title: item.artwork_title,
                        number: item.submission_number,
                        artist: item.display_name,
                      })
                    }
                    className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-lg border-2 border-slate-900 bg-slate-950 mb-2.5"
                  >
                    <img
                      src={item.thumbnail_url || item.image_url}
                      alt={item.artwork_title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 grid place-items-center bg-slate-950/40 opacity-0 transition group-hover:opacity-100">
                      <span className="flex items-center gap-1 rounded-md border border-white bg-slate-900/90 px-2 py-1 text-[10px] font-black text-white">
                        <Eye size={12} /> ขยายดูภาพ
                      </span>
                    </div>
                  </div>

                  {/* Artwork Title & Artist */}
                  <h4
                    className="font-rowdies truncate text-sm font-black text-slate-900 group-hover:text-sky-600"
                    title={item.artwork_title}
                  >
                    {item.artwork_title}
                  </h4>
                  <p className="truncate text-xs font-bold text-slate-500">
                    โดย {item.display_name}
                  </p>
                </div>

                {/* Score & Edit Action */}
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                  <span className="font-rowdies rounded-lg border border-slate-900 bg-amber-200 px-2.5 py-0.5 text-xs font-black text-slate-950 shadow-sm">
                    ⭐ {item.my_total_score} คะแนน
                  </span>
                  <Link
                    href={`/judge?submission=${item.id}&category=${item.category_id}`}
                    className="font-rowdies text-xs font-black text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-0.5"
                  >
                    แก้ไข →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="comic-card max-h-[90vh] max-w-4xl overflow-hidden bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="font-rowdies text-xs font-black text-sky-600">
                  #{previewImage.number}
                </span>
                <h3 className="font-rowdies text-lg font-black text-slate-950">
                  {previewImage.title}
                </h3>
                <p className="text-xs font-bold text-slate-500">
                  โดย {previewImage.artist}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="font-rowdies grid h-8 w-8 place-items-center rounded-xl border-2 border-slate-900 bg-slate-100 text-sm font-black text-slate-950 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-xl border-2 border-slate-900 bg-slate-950">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                referrerPolicy="no-referrer"
                className="mx-auto max-h-[70vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
