"use client";

import { useRef, useState } from "react";
import { ImageUp, LoaderCircle } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { resolveImageSource } from "@/lib/media";

export function ImageUploadField({ initialImageUrl = "", initialThumbnailUrl = "", inputName = "imageUrl", thumbnailInputName = "thumbnailUrl", variant = "artwork" }: { initialImageUrl?: string; initialThumbnailUrl?: string; inputName?: string; thumbnailInputName?: string; variant?: "artwork" | "avatar" }) {
  const picker = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [thumbnailUrl, setThumbnailUrl] = useState(initialThumbnailUrl);
  const [state, setState] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState("");

  const upload = async (file: File) => {
    setState("uploading"); setError("");
    const data = new FormData(); data.set("image", file);
    try {
      const response = await fetch("/api/uploads", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Upload failed");
      setImageUrl(result.imageUrl); setThumbnailUrl(result.thumbnailUrl); setState("idle");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed"); setState("error");
    }
  };

  return <div className="rounded-2xl border border-blue-100 bg-sky-50/60 p-3">
    <input ref={picker} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event)=>{const file=event.target.files?.[0];if(file)void upload(file);}}/>
    <input type="hidden" name={thumbnailInputName} value={thumbnailUrl}/>
    <div className="flex gap-2"><Input name={inputName} value={imageUrl} onChange={(event)=>setImageUrl(event.target.value)} placeholder={variant==="avatar"?"ลิงก์รูปโปรไฟล์ หรืออัปโหลดไฟล์":"วางลิงก์ Google Drive / Image URL หรืออัปโหลดไฟล์"} required={variant==="artwork"}/><Button type="button" variant="secondary" disabled={state==="uploading"} onClick={()=>picker.current?.click()}>{state==="uploading"?<LoaderCircle className="saving" size={16}/>:<ImageUp size={16}/>} Upload</Button></div>
    <p className={`mt-2 text-xs ${state==="error"?"font-bold text-red-600":"text-slate-500"}`}>{state==="error"?error:variant==="artwork"?"รองรับลิงก์ Google Drive ที่ตั้งค่า Anyone with the link · หรือ PNG/JPG/WEBP สูงสุด 15 MB":"แนะนำภาพหน้าคนแบบสี่เหลี่ยม ระบบจะแสดงเป็นวงกลม"}</p>
    {imageUrl&&<img src={thumbnailUrl||resolveImageSource(imageUrl).thumbnailUrl||imageUrl} alt="Upload preview" className={`mt-3 bg-white object-cover ${variant==="avatar"?"h-24 w-24 rounded-full":"h-28 w-full rounded-xl object-contain"}`}/>} 
  </div>;
}
