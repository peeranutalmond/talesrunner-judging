"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LiveRefresh({ seconds = 10 }: { seconds?: number }) {
  const router=useRouter();
  useEffect(()=>{const timer=window.setInterval(()=>router.refresh(),seconds*1000);return()=>window.clearInterval(timer);},[router,seconds]);
  return <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700"><span className="saving h-2 w-2 rounded-full bg-emerald-500"/> LIVE · {seconds}s</span>;
}
