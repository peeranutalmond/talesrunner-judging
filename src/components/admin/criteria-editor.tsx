"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Copy, Plus, Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { createCriteriaVersionAction } from "@/lib/services/admin-actions";

type Item = { name: string; description: string; maxScore: number };

const presets: Record<string, Item[]> = {
  "Fan Art": [
    { name: "Theme & Concept", description: "ความสอดคล้องกับธีม", maxScore: 30 },
    { name: "Composition & Storytelling", description: "องค์ประกอบและเรื่องราว", maxScore: 25 },
    { name: "Creativity", description: "ความคิดสร้างสรรค์", maxScore: 20 },
    { name: "Technique & Completion", description: "เทคนิคและความสมบูรณ์", maxScore: 15 },
    { name: "Character Expression", description: "อารมณ์ตัวละคร", maxScore: 10 },
  ],
  Screenshot: [
    { name: "Theme", description: "ความตรงตามธีม", maxScore: 30 },
    { name: "Composition", description: "องค์ประกอบภาพ", maxScore: 30 },
    { name: "Originality", description: "มุมมองที่แตกต่าง", maxScore: 25 },
    { name: "Polish", description: "ความเรียบร้อย", maxScore: 15 },
  ],
  Cosplay: [
    { name: "Character Accuracy", description: "ความถูกต้องของตัวละคร", maxScore: 30 },
    { name: "Craftsmanship", description: "คุณภาพการสร้างชุด", maxScore: 30 },
    { name: "Creativity", description: "การตีความสร้างสรรค์", maxScore: 20 },
    { name: "Presentation", description: "การนำเสนอ", maxScore: 20 },
  ],
  Video: [
    { name: "Story", description: "การเล่าเรื่อง", maxScore: 25 },
    { name: "Editing", description: "การตัดต่อ", maxScore: 25 },
    { name: "Creativity", description: "ความคิดสร้างสรรค์", maxScore: 25 },
    { name: "Theme", description: "ความตรงตามธีม", maxScore: 25 },
  ],
};

export function CriteriaEditor({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState<Item[]>(initial);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.maxScore || 0), 0), [items]);

  const set = (index: number, patch: Partial<Item>) =>
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const move = (index: number, delta: number) =>
    setItems((current) => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const handleSubmit = (mode: "NONE" | "COMPATIBLE") => {
    setFeedback(null);
    if (total !== 100) {
      setFeedback({ type: "error", message: "คะแนนรวมทั้งหมดต้องเท่ากับ 100 คะแนนพอดี" });
      return;
    }
    if (items.length === 0) {
      setFeedback({ type: "error", message: "ต้องมีเกณฑ์การให้คะแนนอย่างน้อย 1 ข้อ" });
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("criteriaJson", JSON.stringify(items));
        formData.append("migrationMode", mode);
        formData.append("confirmation", "CREATE VERSION");
        await createCriteriaVersionAction(formData);
        setFeedback({ type: "success", message: "สร้างเกณฑ์เวอร์ชันใหม่เรียบร้อยแล้ว!" });
      } catch (err) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการสร้างเวอร์ชันใหม่",
        });
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Presets */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-sky-50 p-3">
        <span className="mr-1 text-xs font-black uppercase tracking-wider text-sky-700">Presets</span>
        {Object.entries(presets).map(([name, value]) => (
          <button
            key={name}
            type="button"
            onClick={() => setItems(value.map((item) => ({ ...item })))}
            className="focus-ring rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm hover:text-sky-700"
          >
            {name}
          </button>
        ))}
      </div>

      {/* Items list */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={`${index}-${item.name}`}
            className="grid gap-2 rounded-2xl border border-blue-100 bg-white p-4 sm:grid-cols-[1.2fr_1.4fr_110px_auto]"
          >
            <Input
              aria-label="Criterion name"
              value={item.name}
              placeholder="ชื่อเกณฑ์"
              onChange={(event) => set(index, { name: event.target.value })}
            />
            <Input
              aria-label="Description"
              value={item.description}
              placeholder="คำอธิบายเกณฑ์"
              onChange={(event) => set(index, { description: event.target.value })}
            />
            <Input
              aria-label="Max score"
              type="number"
              min={1}
              max={100}
              value={item.maxScore}
              onChange={(event) => set(index, { maxScore: Number(event.target.value) })}
            />
            <div className="flex gap-1">
              <button type="button" aria-label="Move up" onClick={() => move(index, -1)} className="rounded-lg p-2 hover:bg-blue-50">
                <ArrowUp size={16} />
              </button>
              <button type="button" aria-label="Move down" onClick={() => move(index, 1)} className="rounded-lg p-2 hover:bg-blue-50">
                <ArrowDown size={16} />
              </button>
              <button
                type="button"
                aria-label="Duplicate"
                onClick={() =>
                  setItems((current) => [...current.slice(0, index + 1), { ...item, name: `${item.name} copy` }, ...current.slice(index + 1)])
                }
                className="rounded-lg p-2 hover:bg-blue-50"
              >
                <Copy size={16} />
              </button>
              <button
                type="button"
                aria-label="Delete"
                onClick={() => setItems((current) => current.filter((_, i) => i !== index))}
                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Total and Submit */}
      <div className={`rounded-2xl p-4 ${total === 100 ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <strong>
            {total === 100
              ? `🟢 ${total} / 100`
              : `🔴 ${total} / 100 · ${total < 100 ? `อีก ${100 - total} คะแนนจึงจะครบ 100` : `เกิน ${total - 100} คะแนน`}`}
          </strong>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setItems((current) => [...current, { name: "New criterion", description: "", maxScore: 0 }])}
          >
            <Plus size={16} /> Add criteria
          </Button>
        </div>

        {feedback && (
          <div
            className={`mt-3 flex items-center gap-2 rounded-xl p-3 text-xs font-bold ${
              feedback.type === "success" ? "bg-emerald-200 text-emerald-950" : "bg-red-200 text-red-950"
            }`}
          >
            {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => handleSubmit("NONE")}
            disabled={total !== 100 || items.length === 0 || isPending}
          >
            {isPending ? (
              <span className="flex items-center gap-1.5">
                <Loader2 size={16} className="animate-spin" /> กำลังสร้างเวอร์ชันใหม่...
              </span>
            ) : (
              "✨ สร้างเวอร์ชันใหม่ (เริ่มคะแนนใหม่)"
            )}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSubmit("COMPATIBLE")}
            disabled={total !== 100 || items.length === 0 || isPending}
          >
            {isPending ? "กำลังดำเนินการ..." : "🔄 ย้ายคะแนนเดิมมาเวอร์ชันนี้ (Migrate scores)"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-slate-600">
          เมื่อกดสร้างเวอร์ชันใหม่ ระบบจะสร้างเวอร์ชันใหม่อัตโนมัติและคงประวัติเวอร์ชันเดิมไว้เพื่อความปลอดภัย
        </p>
      </div>
    </div>
  );
}
