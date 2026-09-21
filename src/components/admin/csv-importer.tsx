"use client";

import { useMemo, useState, useTransition } from "react";
import Papa from "papaparse";
import { FileSpreadsheet, Upload } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { importSubmissionsAction } from "@/lib/services/admin-actions";

const columns = [
  ["submission_number","Submission number",true], ["contestant_name","Artist / contestant",true], ["player_id","Player ID",true],
  ["artwork_title","Artwork title",true], ["image_url","Google Drive / Image URL",true], ["category","Artwork track",false],
] as const;

const aliases: Record<string,string[]> = {
  submission_number:["submission_number","number","entry id","หมายเลข","ลำดับ"], contestant_name:["contestant_name","artist","name","ชื่อผู้ส่ง","ชื่อศิลปิน"],
  player_id:["player_id","ign","uid","player id","ไอดี"], artwork_title:["artwork_title","title","ชื่อผลงาน"],
  image_url:["image_url","image","artwork","file upload","drive","อัปโหลดไฟล์","รูปผลงาน","ลิงก์รูป"], category:["category","track","type","ประเภท","หมวด","รูปแบบการวาด"],
};

export function CsvImporter(){
  const [headers,setHeaders]=useState<string[]>([]); const [rows,setRows]=useState<Record<string,string>[]>([]); const [mapping,setMapping]=useState<Record<string,string>>({}); const [message,setMessage]=useState(""); const [pending,startTransition]=useTransition();
  const mapped=useMemo(()=>rows.slice(0,5).map(row=>Object.fromEntries(columns.map(([key])=>[key,mapping[key]?row[mapping[key]]??"":""]))),[rows,mapping]);
  const choose=(file:File)=>Papa.parse<Record<string,string>>(file,{header:true,skipEmptyLines:true,complete:(result)=>{const fields=result.meta.fields??[];setHeaders(fields);setRows(result.data);const guess:Record<string,string>={};for(const [key,,required] of columns){guess[key]=fields.find(field=>aliases[key].some(alias=>field.toLocaleLowerCase().trim().includes(alias)))??(required?fields[0]??"":"");}setMapping(guess);setMessage("");},error:()=>setMessage("อ่านไฟล์ CSV ไม่สำเร็จ")});
  const ready=rows.length>0&&columns.filter(([, ,required])=>required).every(([key])=>mapping[key]);
  const submit=()=>startTransition(async()=>{try{const payload=rows.map(row=>({submission_number:String(row[mapping.submission_number]??"").trim(),contestant_name:String(row[mapping.contestant_name]??"").trim(),player_id:String(row[mapping.player_id]??"").trim(),artwork_title:String(row[mapping.artwork_title]??"").trim(),image_url:String(row[mapping.image_url]??"").trim(),category:mapping.category?String(row[mapping.category]??"").trim():""}));const result=await importSubmissionsAction(payload);setMessage(`นำเข้าสำเร็จ ${result.imported} รายการ`);}catch(error){setMessage(error instanceof Error?error.message:"นำเข้าไม่สำเร็จ");}});
  return <div className="space-y-5"><Card className="p-6"><label className="focus-within:ring-2 focus-within:ring-sky-400 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/70 p-6 text-center"><Upload size={34} className="text-sky-600"/><strong className="mt-3 text-lg">เลือก CSV จาก Google Forms / Sheets</strong><span className="mt-1 max-w-xl text-sm text-slate-500">คอลัมน์ File upload ใช้ลิงก์ Google Drive ได้โดยตรง แต่ไฟล์ต้องเปิด “Anyone with the link”</span><input type="file" accept=".csv,text/csv" className="sr-only" onChange={event=>event.target.files?.[0]&&choose(event.target.files[0])}/></label></Card>{headers.length>0&&<><Card className="p-5"><h2 className="text-xl font-black">Map columns</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{columns.map(([key,label,required])=><label key={key} className="text-sm font-bold">{label} {!required&&<span className="font-normal text-slate-400">(optional)</span>}<select value={mapping[key]??""} onChange={event=>setMapping(current=>({...current,[key]:event.target.value}))} className="focus-ring mt-2 min-h-11 w-full rounded-xl border border-blue-200 bg-white px-3"><option value="">{required?"Select CSV column":"ไม่ใช้คอลัมน์นี้"}</option>{headers.map(header=><option key={header}>{header}</option>)}</select></label>)}</div></Card><Card className="overflow-hidden"><div className="flex items-center gap-2 border-b border-blue-100 p-4"><FileSpreadsheet size={18}/><strong>Preview · {rows.length} rows</strong></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-900 text-white"><tr>{columns.map(([,label])=><th key={label} className="px-3 py-2">{label}</th>)}</tr></thead><tbody>{mapped.map((row,index)=><tr key={index} className="border-b border-blue-50">{columns.map(([key])=><td key={key} className="max-w-56 truncate px-3 py-2">{row[key]}</td>)}</tr>)}</tbody></table></div></Card><div className="flex items-center justify-between gap-4"><p aria-live="polite" className="text-sm font-bold text-slate-600">{message}</p><Button disabled={!ready||pending} onClick={submit}>{pending?"Importing...":`Import ${rows.length} submissions`}</Button></div></>}</div>;
}
