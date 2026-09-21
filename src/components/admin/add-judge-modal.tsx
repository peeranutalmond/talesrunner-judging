"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { addJudgeAction } from "@/lib/services/admin-actions";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Button, Card, Input } from "@/components/ui";

const PRESET_AVATARS = [
  { name: "Chowon", url: "https://talesrunner.thehof.gg/asset/images/dt-crt-01.webp" },
  { name: "Lina", url: "https://talesrunner.thehof.gg/asset/images/dt-crt-02.webp" },
  { name: "Mingming", url: "https://talesrunner.thehof.gg/asset/images/dt-crt-03.webp" },
  { name: "Bigbo", url: "https://talesrunner.thehof.gg/asset/images/dt-crt-04.webp" },
  { name: "DnD", url: "https://talesrunner.thehof.gg/asset/images/dt-crt-05.webp" },
  { name: "Maki", url: "https://talesrunner.thehof.gg/asset/images/dt-crt-06.webp" },
  { name: "Rough", url: "https://talesrunner.thehof.gg/asset/images/dt-crt-07.webp" },
  { name: "Bada", url: "https://talesrunner.thehof.gg/asset/images/dt-crt-08.webp" },
];

export function AddJudgeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await addJudgeAction(formData);
      setIsOpen(false);
    });
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="arcade-btn arcade-btn-success inline-flex cursor-pointer items-center gap-2 px-5 py-3 text-sm font-black"
      >
        <Plus size={18} /> เพิ่มกรรมการใหม่
      </button>

      {/* Modal Overlay & Dialog */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <Card className="relative w-full max-w-lg border-4 border-slate-900 bg-white p-6 shadow-[8px_8px_0_#0f172a] my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl border border-slate-900 bg-amber-300 font-bold shadow-[1px_1px_0_#0f172a]">
                  ➕
                </span>
                <h2 className="font-rowdies text-xl font-black text-slate-950">
                  เพิ่มกรรมการใหม่
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl border-2 border-slate-900 bg-slate-100 text-slate-900 hover:bg-rose-100 hover:text-rose-700 shadow-[2px_2px_0_#0f172a] transition active:translate-y-0.5"
                title="ปิดหน้าต่าง (Esc)"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Form */}
            <form action={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="font-rowdies block text-xs font-black uppercase text-slate-700">
                  ชื่อกรรมการ *
                </label>
                <Input
                  name="name"
                  placeholder="เช่น อาจารย์สมชาย, พี่อาร์ต"
                  required
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-rowdies block text-xs font-black uppercase text-slate-700">
                    PIN เข้าสู่ระบบ (4–6 หลัก) *
                  </label>
                  <Input
                    name="pin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]{4,6}"
                    placeholder="เช่น 1234"
                    required
                    className="mt-1 text-center font-mono tracking-widest"
                  />
                </div>
                <div>
                  <label className="font-rowdies block text-xs font-black uppercase text-slate-700">
                    อีเมล (ไม่บังคับ)
                  </label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="judge@domain.com"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Preset Character Picker */}
              <div>
                <label className="font-rowdies block text-xs font-black uppercase text-slate-700">
                  เลือกตัวละคร TALES RUNNER (หรืออัปโหลดรูปเองด้านล่าง)
                </label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {PRESET_AVATARS.map((avatar) => (
                    <label
                      key={avatar.name}
                      className="group/avatar relative flex cursor-pointer flex-col items-center rounded-xl border-2 border-slate-200 bg-slate-50 p-2 transition hover:border-slate-900 hover:bg-sky-50 has-checked:border-sky-500 has-checked:bg-sky-100 has-checked:shadow-[2px_2px_0_#0284c7]"
                    >
                      <input
                        type="radio"
                        name="avatarUrl"
                        value={avatar.url}
                        className="peer sr-only"
                      />
                      <img
                        src={avatar.url}
                        alt={avatar.name}
                        className="h-12 w-12 rounded-full object-contain transition group-hover/avatar:scale-105"
                      />
                      <span className="font-rowdies mt-1 text-[10px] font-black text-slate-700">
                        {avatar.name}
                      </span>
                      <div className="absolute right-1 top-1 hidden h-4 w-4 place-items-center rounded-full bg-sky-500 text-[10px] font-black text-white peer-checked:grid">
                        ✓
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Upload */}
              <div>
                <label className="font-rowdies mb-1 block text-xs font-black uppercase text-slate-700">
                  หรืออัปโหลดรูปโปรไฟล์ที่กำหนดเอง
                </label>
                <ImageUploadField
                  inputName="avatarUrl"
                  thumbnailInputName="avatarThumbnail"
                  variant="avatar"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="flex-1 py-3 font-bold"
                >
                  ✕ ยกเลิก / ปิด
                </Button>
                <Button
                  type="submit"
                  variant="success"
                  disabled={isPending}
                  className="font-rowdies flex-[2] py-3 text-sm font-black"
                >
                  {isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={16} /> กำลังบันทึก...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <Plus size={16} /> ยืนยันเพิ่มกรรมการ
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
