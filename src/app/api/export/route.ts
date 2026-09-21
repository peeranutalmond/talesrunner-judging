import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireApiSession } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { getAuditLogs, getJudgeProgress, getRanking } from "@/lib/services/admin";

type ExportRow=Record<string,unknown>;
export async function GET(request:Request){const session=await requireApiSession(["ADMIN","SUPER_ADMIN"]);if(!session)return NextResponse.json({error:"UNAUTHORIZED"},{status:401});const url=new URL(request.url);const dataset=url.searchParams.get("dataset")??"ranking";const format=url.searchParams.get("format")??"csv";let rows:ExportRow[];
  if(dataset==="raw-scores"){
    const [raw,ranking]=await Promise.all([
      query<ExportRow>(`SELECT sub.id AS submission_id,sub.submission_number,sub.display_name AS artist,u.id AS judge_id,u.name AS judge,
        cv.version_number AS criteria_version,c.id AS criterion_id,c.name AS criterion,s.score::float8 AS score,c.max_score::float8 AS max_score,
        SUM(s.score) OVER (PARTITION BY s.submission_id,s.judge_id,s.criteria_version_id)::float8 AS judge_total,
        SUM(s.score) OVER (PARTITION BY s.submission_id,s.criteria_version_id)::float8 AS overall_total,
        AVG(s.score) OVER (PARTITION BY s.submission_id,s.criteria_version_id)::float8 AS criterion_record_average,
        s.comment,s.version AS score_revision,s.is_active,s.reset_reason,s.created_at,s.updated_at
       FROM scores s JOIN submissions sub ON sub.id=s.submission_id JOIN users u ON u.id=s.judge_id
       JOIN criteria c ON c.id=s.criterion_id JOIN criteria_versions cv ON cv.id=s.criteria_version_id
       WHERE s.contest_id=$1 ORDER BY sub.submission_number,u.name,cv.version_number,c.display_order`,[session.contestId]),
      getRanking(session.contestId!),
    ]);
    const rankMap=new Map(ranking.rows.map(item=>[item.submission_id,item]));
    rows=raw.map(row=>{const current=rankMap.get(String(row.submission_id));return {...row,current_rank:current?.rank??null,current_average:current?.average??null,current_status:current?.complete?"COMPLETE":"INCOMPLETE"};});
  }
  else if(dataset==="judge-scores")rows=await query<ExportRow>(`SELECT sub.submission_number,u.name AS judge,SUM(s.score)::float8 AS judge_total,COUNT(*)::int AS criteria_scored,MAX(s.updated_at) AS updated_at FROM scores s JOIN submissions sub ON sub.id=s.submission_id JOIN users u ON u.id=s.judge_id WHERE s.contest_id=$1 AND s.is_active=TRUE AND s.criteria_version_id=(SELECT active_criteria_version_id FROM contests WHERE id=$1) GROUP BY sub.id,u.id ORDER BY sub.display_order,u.name`,[session.contestId]);
  else if(dataset==="criteria-breakdown")rows=await query<ExportRow>(`SELECT sub.submission_number,c.name AS criterion,c.max_score::float8 AS max_score,AVG(s.score)::float8 AS average,MIN(s.score)::float8 AS minimum,MAX(s.score)::float8 AS maximum,COUNT(DISTINCT s.judge_id)::int AS judges FROM scores s JOIN submissions sub ON sub.id=s.submission_id JOIN criteria c ON c.id=s.criterion_id JOIN contest_judges cj ON cj.contest_id=s.contest_id AND cj.user_id=s.judge_id WHERE s.contest_id=$1 AND s.is_active=TRUE AND cj.status='ACTIVE' AND cj.required=TRUE AND s.criteria_version_id=(SELECT active_criteria_version_id FROM contests WHERE id=$1) GROUP BY sub.id,c.id ORDER BY sub.display_order,c.display_order`,[session.contestId]);
  else if(dataset==="progress")rows=(await getJudgeProgress(session.contestId!)).map(row=>({...row}));
  else if(dataset==="audit")rows=(await getAuditLogs(session.contestId!)).map(row=>({...row,before_data:JSON.stringify(row.before_data),after_data:JSON.stringify(row.after_data)}));
  else rows=(await getRanking(session.contestId!)).rows.map(row=>({...row}));
  await query("INSERT INTO audit_logs (id,contest_id,actor_user_id,action_type,entity_type,entity_id,after_data) VALUES ($1,$2,$3,'EXPORT_CREATED','export',$4,$5::jsonb)",[crypto.randomUUID(),session.contestId,session.id,`${dataset}-${Date.now()}`,JSON.stringify({dataset,format,rowCount:rows.length})]);
  const filename=`${dataset}-${new Date().toISOString().slice(0,10)}`;
  if(format==="json")return new NextResponse(JSON.stringify(rows,null,2),{headers:{"Content-Type":"application/json; charset=utf-8","Content-Disposition":`attachment; filename="${filename}.json"`}});
  const worksheet=XLSX.utils.json_to_sheet(rows);if(format==="xlsx"){const workbook=XLSX.utils.book_new();XLSX.utils.book_append_sheet(workbook,worksheet,"Export");const body=XLSX.write(workbook,{type:"buffer",bookType:"xlsx"});return new NextResponse(body,{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":`attachment; filename="${filename}.xlsx"`}});}const csv=XLSX.utils.sheet_to_csv(worksheet);return new NextResponse(`\uFEFF${csv}`,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="${filename}.csv"`}});
}
