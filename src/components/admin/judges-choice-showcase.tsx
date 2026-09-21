"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, ExternalLink, Eye, Sparkles, Trophy, Users } from "lucide-react";
import type { JudgesChoiceAnalysis } from "@/lib/services/admin";

interface JudgesChoiceShowcaseProps {
  data: JudgesChoiceAnalysis;
}

export function JudgesChoiceShowcase({ data }: JudgesChoiceShowcaseProps) {
  const { judges, categories, judgeTop5, intersections } = data;

  // Active Category (default to digital if available, otherwise first category)
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>(
    categories.find((c) => c.slug === "digital")?.slug ?? categories[0]?.slug ?? "digital"
  );

  // Active Judge (default to first judge)
  const [activeJudgeId, setActiveJudgeId] = useState<string>(
    judges[0]?.id ?? ""
  );

  // Lightbox modal state
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
    number: string;
    artist: string;
  } | null>(null);

  const activeCategory = categories.find((c) => c.slug === activeCategorySlug) ?? categories[0];
  const activeJudge = judges.find((j) => j.id === activeJudgeId) ?? judges[0];

  const currentJudgePicks =
    activeJudge && activeCategorySlug
      ? judgeTop5[activeJudge.id]?.[activeCategorySlug] ?? []
      : [];

  const currentIntersections = intersections[activeCategorySlug] ?? [];
  const topIntersections = currentIntersections.slice(0, 5);

  const getRankMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return { label: "🥇 อันดับ 1", bg: "bg-amber-300 text-amber-950 border-amber-600" };
      case 2:
        return { label: "🥈 อันดับ 2", bg: "bg-slate-200 text-slate-900 border-slate-500" };
      case 3:
        return { label: "🥉 อันดับ 3", bg: "bg-amber-100 text-amber-900 border-amber-500" };
      default:
        return { label: `⭐ อันดับ ${rank}`, bg: "bg-sky-100 text-sky-950 border-sky-400" };
    }
  };

  return (
    <div className="comic-card space-y-6 bg-white p-5 sm:p-7">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-slate-900 pb-5">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-slate-900 bg-amber-400 text-slate-950 shadow-[3px_3px_0_#0f172a]">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-rowdies rounded-md border border-slate-900 bg-yellow-300 px-2 py-0.5 text-[10px] font-black uppercase text-slate-950 shadow-[1px_1px_0_#0f172a]">
                Judges&apos; Choice · Auto-Calculated
              </span>
            </div>
            <h2 className="font-rowdies mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
              ⭐ รางวัลขวัญใจกรรมการ (Judges&apos; Choice)
            </h2>
            <p className="text-xs font-bold text-slate-500 sm:text-sm">
              คำนวณจาก 5 อันดับที่กรรมการแต่ละท่านให้คะแนนสูงสุดจริง และหาจุดร่วม (Intersection) ที่มติเห็นพ้องต้องกันมากที่สุด
            </p>
          </div>
        </div>

        {/* Category Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-slate-900 bg-slate-100 p-1.5 shadow-[2px_2px_0_#0f172a]">
          {categories.map((cat) => {
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

      {/* Part 1: Per-Judge Inspector ("กดติ๊กๆเปลี่ยนช่องเอาจะได้ไม่เปลือง UX/UI") */}
      <div className="rounded-2xl border-2 border-slate-900 bg-sky-50/50 p-4 sm:p-5 space-y-4 shadow-[3px_3px_0_#0f172a]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-sky-700" />
            <h3 className="font-rowdies text-base font-black text-slate-950">
              กดเลือกกรรมการเพื่อดูคะแนนสูงสุด 5 อันดับแรก:
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500">
            คลิกสลับกรรมการได้ทันที ไม่เปลืองพื้นที่หน้าจอ
          </span>
        </div>

        {/* Judge Pills Switcher */}
        <div className="flex flex-wrap gap-2">
          {judges.map((j) => {
            const isJudgeActive = j.id === activeJudgeId;
            return (
              <button
                key={j.id}
                type="button"
                onClick={() => setActiveJudgeId(j.id)}
                className={`font-rowdies flex items-center gap-2 rounded-xl border-2 px-3 py-1.5 text-xs font-black transition-all ${
                  isJudgeActive
                    ? "border-slate-900 bg-yellow-300 text-slate-950 shadow-[3px_3px_0_#0f172a] -translate-y-0.5 scale-105"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-800 hover:bg-slate-50"
                }`}
              >
                <span
                  className="grid h-5 w-5 place-items-center rounded-full border border-slate-900 text-[10px] font-black text-white"
                  style={{ backgroundColor: j.avatar_color || "#0284c7" }}
                >
                  {j.name.slice(0, 1).toUpperCase()}
                </span>
                <span>กรรมการ {j.name}</span>
              </button>
            );
          })}
        </div>

        {/* Current Judge Active Top 5 Cards */}
        {activeJudge && (
          <div className="pt-2">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-rowdies text-xs font-black text-sky-900">
                ⭐ 5 อันดับที่กรรมการ <span className="underline decoration-sky-400 decoration-2">{activeJudge.name}</span> ให้คะแนนสูงสุดในหมวด {activeCategory?.name}:
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                เรียงตามคะแนนรวม (เต็ม 100)
              </span>
            </div>

            {currentJudgePicks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-xs font-bold text-slate-400">
                ยังไม่มีข้อมูลการให้คะแนนจากกรรมการท่านนี้ในหมวดนี้
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                {currentJudgePicks.map((pick) => {
                  const medal = getRankMedal(pick.rank_order);
                  return (
                    <div
                      key={pick.submission_id}
                      className="comic-card group flex flex-col justify-between overflow-hidden bg-white p-2.5 transition duration-150 hover:-translate-y-1 hover:shadow-[5px_5px_0_#0f172a]"
                    >
                      <div>
                        {/* Rank and Submission Number */}
                        <div className="mb-2 flex items-center justify-between">
                          <span
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-black shadow-sm ${medal.bg}`}
                          >
                            {medal.label}
                          </span>
                          <span className="font-rowdies text-xs font-black text-sky-700">
                            #{pick.submission_number}
                          </span>
                        </div>

                        {/* Image Preview with preview click */}
                        <div
                          onClick={() =>
                            setPreviewImage({
                              url: pick.image_url,
                              title: pick.artwork_title,
                              number: pick.submission_number,
                              artist: pick.display_name,
                            })
                          }
                          className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-lg border-2 border-slate-900 bg-slate-950 mb-2"
                        >
                          <img
                            src={pick.thumbnail_url || pick.image_url}
                            alt={pick.artwork_title}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 grid place-items-center bg-slate-950/40 opacity-0 transition group-hover:opacity-100">
                            <span className="flex items-center gap-1 rounded-md border border-white bg-slate-900/90 px-2 py-1 text-[10px] font-black text-white">
                              <Eye size={12} /> ขยายดูภาพ
                            </span>
                          </div>
                        </div>

                        {/* Artwork info */}
                        <h4
                          className="font-rowdies truncate text-xs font-black text-slate-900 group-hover:text-sky-600"
                          title={pick.artwork_title}
                        >
                          {pick.artwork_title}
                        </h4>
                        <p className="truncate text-[11px] font-bold text-slate-500">
                          โดย {pick.display_name}
                        </p>
                      </div>

                      {/* Score Pill & Link */}
                      <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2">
                        <span className="font-rowdies rounded-md border border-slate-900 bg-amber-200 px-2 py-0.5 text-xs font-black text-slate-950 shadow-sm">
                          ⭐ {pick.total_score.toFixed(0)} คะแนน
                        </span>
                        <Link
                          href={`/admin/results/${pick.submission_id}`}
                          className="text-[11px] font-black text-sky-600 hover:underline flex items-center gap-0.5"
                        >
                          ใบคะแนน <ExternalLink size={10} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Part 2: Grand Intersection Summary (จุดร่วม U ตรงกลางที่กรรมการโหวตตรงกันมากที่สุด) */}
      <div className="rounded-3xl border-2 border-slate-900 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-5 sm:p-7 shadow-[5px_5px_0_#0f172a] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-dashed border-amber-300 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-slate-900 bg-yellow-400 text-slate-950 shadow-[3px_3px_0_#0f172a]">
              <Trophy size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-rowdies rounded-md border border-slate-900 bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase text-slate-950 shadow-[1px_1px_0_#0f172a]">
                  CONSENSUS INTERSECTION AWARDS
                </span>
              </div>
              <h3 className="font-rowdies mt-0.5 text-xl font-black text-slate-950 sm:text-2xl">
                🏆 สรุปผลขวัญใจกรรมการ: จุดร่วม Top 5 ({activeCategory?.name})
              </h3>
              <p className="text-xs font-bold text-amber-950/80">
                ผลงานที่ติดอันดับ Top 5 ของกรรมการมากที่สุด (จุดร่วมมติเอกฉันท์)
              </p>
            </div>
          </div>

          <div className="font-rowdies rounded-xl border-2 border-slate-900 bg-white px-3 py-1.5 text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a]">
            หมวด: {activeCategory?.name}
          </div>
        </div>

        {/* Intersection Top 5 Showcase List */}
        {topIntersections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-bold text-slate-400">
            ไม่มีข้อมูลคะแนนสำหรับจัดอันดับจุดร่วมในหมวดนี้
          </div>
        ) : (
          <div className="grid gap-4">
            {topIntersections.map((item, index) => {
              const rank = index + 1;
              const isUnanimous = item.intersect_count === item.total_judges;
              const isHighConsensus = item.intersect_count >= Math.ceil(item.total_judges * 0.6);

              const rankMedal =
                rank === 1
                  ? "🥇 แชมป์ขวัญใจกรรมการ"
                  : rank === 2
                  ? "🥈 รองอันดับ 1 ขวัญใจกรรมการ"
                  : rank === 3
                  ? "🥉 รองอันดับ 2 ขวัญใจกรรมการ"
                  : `⭐ อันดับ ${rank} ขวัญใจกรรมการ`;

              return (
                <div
                  key={item.submission_id}
                  className={`comic-card overflow-hidden bg-white p-4 transition duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0_#0f172a] ${
                    rank === 1 ? "ring-2 ring-amber-400 ring-offset-2" : ""
                  }`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    {/* Left: Thumbnail + Titles */}
                    <div className="flex items-start gap-4">
                      {/* Image Thumbnail */}
                      <div
                        onClick={() =>
                          setPreviewImage({
                            url: item.image_url,
                            title: item.artwork_title,
                            number: item.submission_number,
                            artist: item.display_name,
                          })
                        }
                        className="group relative h-24 w-32 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 border-slate-900 bg-slate-900 shadow-[2px_2px_0_#0f172a]"
                      >
                        <img
                          src={item.thumbnail_url || item.image_url}
                          alt={item.artwork_title}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <span className="font-rowdies absolute bottom-1 right-1 rounded bg-slate-950/85 px-1.5 py-0.2 text-[9px] font-black text-white">
                          #{item.submission_number}
                        </span>
                        <div className="absolute inset-0 grid place-items-center bg-slate-950/40 opacity-0 transition group-hover:opacity-100">
                          <Eye size={16} className="text-white" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`font-rowdies rounded-lg border-2 border-slate-900 px-2.5 py-0.5 text-xs font-black shadow-[1px_1px_0_#0f172a] ${
                              rank === 1
                                ? "bg-amber-300 text-amber-950"
                                : rank === 2
                                ? "bg-slate-200 text-slate-950"
                                : rank === 3
                                ? "bg-amber-100 text-amber-950"
                                : "bg-sky-100 text-sky-950"
                            }`}
                          >
                            {rankMedal}
                          </span>

                          {/* Consensus Badge */}
                          {isUnanimous ? (
                            <span className="font-rowdies flex items-center gap-1 rounded-lg border border-slate-900 bg-emerald-400 px-2.5 py-0.5 text-xs font-black text-slate-950 shadow-sm animate-pulse">
                              <CheckCircle size={14} /> มติเอกฉันท์! กรรมการ {item.intersect_count}/{item.total_judges} ท่าน (100%)
                            </span>
                          ) : isHighConsensus ? (
                            <span className="font-rowdies flex items-center gap-1 rounded-lg border border-slate-900 bg-amber-300 px-2.5 py-0.5 text-xs font-black text-slate-950 shadow-sm">
                              🎯 กรรมการเลือกตรงกัน {item.intersect_count}/{item.total_judges} ท่าน
                            </span>
                          ) : (
                            <span className="font-rowdies rounded-lg border border-slate-900 bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-700 shadow-sm">
                              กรรมการเลือกตรงกัน {item.intersect_count}/{item.total_judges} ท่าน
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/admin/results/${item.submission_id}`}
                          className="font-rowdies block text-base font-black text-slate-950 hover:text-sky-600 transition sm:text-lg"
                        >
                          {item.artwork_title}
                        </Link>
                        <p className="text-xs font-bold text-slate-500">
                          #{item.submission_number} · ส่งประกวดโดย <span className="text-slate-800 font-extrabold">{item.display_name}</span>
                        </p>
                      </div>
                    </div>

                    {/* Right: Scores & Judge Breakdown */}
                    <div className="flex flex-col items-start md:items-end justify-between gap-3 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">คะแนนเฉลี่ยในกลุ่ม Top 5:</span>
                        <span className="font-rowdies rounded-xl border-2 border-slate-900 bg-yellow-300 px-3 py-1 text-sm font-black text-slate-950 shadow-[2px_2px_0_#0f172a]">
                          ⭐ {item.avg_score.toFixed(2)} คะแนน
                        </span>
                      </div>

                      {/* Chips of judges who voted for it */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-400">กรรมการที่เลือก:</span>
                        {item.judges.map((j) => (
                          <span
                            key={j.judge_id}
                            className="font-rowdies flex items-center gap-1 rounded-md border border-slate-900 bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-800 shadow-xs"
                            title={`กรรมการ ${j.judge_name} ให้ ${j.score} คะแนน (อันดับ ${j.rank_order} ในชุดของตน)`}
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: j.avatar_color || "#0284c7" }}
                            />
                            <span>{j.judge_name}</span>
                            <span className="text-sky-700">({j.score} คะแนน)</span>
                          </span>
                        ))}
                      </div>

                      <Link
                        href={`/admin/results/${item.submission_id}`}
                        className="font-rowdies flex items-center gap-1 text-xs font-black text-sky-600 hover:text-sky-700 hover:underline"
                      >
                        เปิดดูใบคะแนนและเกณฑ์ย่อยทั้งหมด →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
