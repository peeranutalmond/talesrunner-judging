import * as XLSX from "xlsx";
import { query } from "@/lib/db";
import type { Contest } from "@/lib/db/types";

export async function generateMasterExcelWorkbook(contestId: string): Promise<Buffer> {
  const [contestRows, categories, criteria, judges, submissions, scores, flagged] = await Promise.all([
    query<Contest>("SELECT * FROM contests WHERE id=$1", [contestId]),
    query<{ id: string; name: string; slug: string; display_order: number }>(
      `SELECT id, name, slug, display_order 
       FROM submission_categories 
       WHERE contest_id = $1 
       ORDER BY CASE WHEN slug = 'digital' THEN 1 WHEN slug = 'traditional' THEN 2 ELSE 3 END, display_order ASC`,
      [contestId]
    ),
    query<{ id: string; name: string; max_score: number; display_order: number }>(
      `SELECT id, name, max_score::float8 AS max_score, display_order 
       FROM criteria 
       WHERE criteria_version_id = (SELECT active_criteria_version_id FROM contests WHERE id = $1) AND enabled = TRUE 
       ORDER BY display_order ASC`,
      [contestId]
    ),
    query<{ id: string; name: string }>(
      `SELECT u.id, u.name 
       FROM users u 
       JOIN contest_judges cj ON cj.user_id = u.id 
       WHERE cj.contest_id = $1 AND u.role = 'JUDGE' AND cj.status = 'ACTIVE' AND cj.required = TRUE 
       ORDER BY u.name ASC`,
      [contestId]
    ),
    query<{
      id: string;
      submission_number: string;
      artwork_title: string;
      display_name: string;
      category_id: string | null;
      status: string;
      category_name: string | null;
      category_slug: string | null;
    }>(
      `SELECT s.id, s.submission_number, s.artwork_title, s.display_name, s.category_id, s.status,
              cat.name AS category_name, cat.slug AS category_slug
       FROM submissions s
       LEFT JOIN submission_categories cat ON cat.id = s.category_id
       WHERE s.contest_id = $1 AND s.status NOT IN ('HIDDEN', 'ARCHIVED')
       ORDER BY s.submission_number ASC`,
      [contestId]
    ),
    query<{
      submission_id: string;
      judge_id: string;
      criterion_id: string;
      score: number;
      comment: string | null;
      updated_at: string;
      judge_name: string;
      criterion_name: string;
    }>(
      `SELECT s.submission_id, s.judge_id, s.criterion_id, s.score::float8 AS score, s.comment, s.updated_at,
              u.name AS judge_name, c.name AS criterion_name
       FROM scores s
       JOIN users u ON u.id = s.judge_id
       JOIN criteria c ON c.id = s.criterion_id
       JOIN contest_judges cj ON cj.contest_id = s.contest_id AND cj.user_id = s.judge_id
       WHERE s.contest_id = $1 AND s.is_active = TRUE 
         AND s.criteria_version_id = (SELECT active_criteria_version_id FROM contests WHERE id = $1)
         AND cj.status = 'ACTIVE' AND cj.required = TRUE
       ORDER BY s.submission_id, u.name, c.display_order`,
      [contestId]
    ),
    query<{
      judge_id: string;
      judge_name: string;
      submission_id: string;
      submission_number: string;
      artwork_title: string;
      display_name: string;
      category_name: string | null;
    }>(
      `SELECT o.judge_id, u.name AS judge_name, s.id AS submission_id, s.submission_number, s.artwork_title, s.display_name,
              cat.name AS category_name
       FROM judge_submission_order o
       JOIN users u ON u.id = o.judge_id
       JOIN submissions s ON s.id = o.submission_id
       LEFT JOIN submission_categories cat ON cat.id = s.category_id
       WHERE o.contest_id = $1 AND o.flagged = TRUE`,
      [contestId]
    ),
  ]);

  const totalJudges = judges.length;

  // Organize scores by submission -> judge -> { total, criteria, comment, updated_at }
  const subScoreMap = new Map<
    string,
    Map<
      string,
      {
        judge_name: string;
        total: number;
        criteria: Record<string, number>;
        comment: string | null;
        updated_at: string;
      }
    >
  >();

  for (const s of submissions) {
    subScoreMap.set(s.id, new Map());
  }

  for (const sc of scores) {
    const jMap = subScoreMap.get(sc.submission_id);
    if (!jMap) continue;
    if (!jMap.has(sc.judge_id)) {
      jMap.set(sc.judge_id, {
        judge_name: sc.judge_name,
        total: 0,
        criteria: {},
        comment: sc.comment,
        updated_at: sc.updated_at,
      });
    }
    const jEntry = jMap.get(sc.judge_id)!;
    jEntry.criteria[sc.criterion_name] = sc.score;
    jEntry.total += sc.score;
  }

  // Calculate submission stats
  const subStats = submissions.map((sub) => {
    const jMap = subScoreMap.get(sub.id) || new Map();
    const scoredJudges = [...jMap.values()];
    const completeJudgeCount = scoredJudges.filter(
      (j) => Object.keys(j.criteria).length === criteria.length
    ).length;
    const isComplete = sub.status === "ACTIVE" && completeJudgeCount >= totalJudges;

    const criterionAvgs: Record<string, number> = {};
    for (const crit of criteria) {
      let sum = 0;
      let count = 0;
      for (const j of scoredJudges) {
        if (j.criteria[crit.name] !== undefined) {
          sum += j.criteria[crit.name];
          count++;
        }
      }
      criterionAvgs[crit.name] = count > 0 ? Number((sum / count).toFixed(2)) : 0;
    }

    const totalScore = scoredJudges.reduce((acc, j) => acc + j.total, 0);
    const averageScore =
      scoredJudges.length > 0 ? Number((totalScore / scoredJudges.length).toFixed(2)) : 0;

    return {
      ...sub,
      jMap,
      completeJudgeCount,
      isComplete,
      criterionAvgs,
      totalScore,
      averageScore,
    };
  });

  // Sheet 1: 1. คะแนนทั้งหมด (All Rankings)
  const sheet1Sorted = [...subStats].sort((a, b) => {
    if (a.isComplete !== b.isComplete) return a.isComplete ? -1 : 1;
    return b.averageScore - a.averageScore;
  });

  let rankAll = 1;
  const sheet1Data = sheet1Sorted.map((item) => {
    const currentRank = item.isComplete ? rankAll++ : "-";
    return {
      "อันดับรวม": currentRank,
      "หมายเลข": `#${item.submission_number}`,
      "ชื่อผลงาน": item.artwork_title,
      "ผู้ส่งผลงาน": item.display_name,
      "สนาม / หมวดหมู่": item.category_name || "ยังไม่จัดหมวด",
      "คะแนนเฉลี่ยรวม (/100)": item.averageScore,
      "คะแนนรวมดิบ": item.totalScore,
      "จำนวนกรรมการที่ให้คะแนน": `${item.completeJudgeCount}/${totalJudges}`,
      "สถานะ":
        item.status === "DISQUALIFIED"
          ? "ตัดสิทธิ์ (Disqualified)"
          : item.isComplete
          ? "ครบถ้วนสมบูรณ์"
          : "ยังไม่สมบูรณ์",
    };
  });

  // Sheet 2: 2. คะแนนสนาม 1 (Digital)
  const digitalSubs = subStats
    .filter((s) => s.category_slug === "digital")
    .sort((a, b) => {
      if (a.isComplete !== b.isComplete) return a.isComplete ? -1 : 1;
      return b.averageScore - a.averageScore;
    });

  let rankDig = 1;
  const sheet2Data = digitalSubs.map((item) => {
    const row: Record<string, unknown> = {
      "อันดับในสนาม 1": item.isComplete ? rankDig++ : "-",
      "หมายเลข": `#${item.submission_number}`,
      "ชื่อผลงาน": item.artwork_title,
      "ผู้ส่งผลงาน": item.display_name,
    };
    for (const crit of criteria) {
      row[`เฉลี่ย: ${crit.name} (เต็ม ${Number(crit.max_score)})`] = item.criterionAvgs[crit.name];
    }
    row["คะแนนเฉลี่ยรวม (/100)"] = item.averageScore;
    row["คะแนนรวมดิบ"] = item.totalScore;
    row["จำนวนกรรมการ"] = `${item.completeJudgeCount}/${totalJudges}`;
    row["สถานะ"] =
      item.status === "DISQUALIFIED"
        ? "ตัดสิทธิ์ (Disqualified)"
        : item.isComplete
        ? "ครบถ้วน"
        : "ยังไม่สมบูรณ์";
    return row;
  });

  // Sheet 3: 3. คะแนนสนาม 2 (Traditional)
  const traditionalSubs = subStats
    .filter((s) => s.category_slug === "traditional")
    .sort((a, b) => {
      if (a.isComplete !== b.isComplete) return a.isComplete ? -1 : 1;
      return b.averageScore - a.averageScore;
    });

  let rankTrad = 1;
  const sheet3Data = traditionalSubs.map((item) => {
    const row: Record<string, unknown> = {
      "อันดับในสนาม 2": item.isComplete ? rankTrad++ : "-",
      "หมายเลข": `#${item.submission_number}`,
      "ชื่อผลงาน": item.artwork_title,
      "ผู้ส่งผลงาน": item.display_name,
    };
    for (const crit of criteria) {
      row[`เฉลี่ย: ${crit.name} (เต็ม ${Number(crit.max_score)})`] = item.criterionAvgs[crit.name];
    }
    row["คะแนนเฉลี่ยรวม (/100)"] = item.averageScore;
    row["คะแนนรวมดิบ"] = item.totalScore;
    row["จำนวนกรรมการ"] = `${item.completeJudgeCount}/${totalJudges}`;
    row["สถานะ"] =
      item.status === "DISQUALIFIED"
        ? "ตัดสิทธิ์ (Disqualified)"
        : item.isComplete
        ? "ครบถ้วน"
        : "ยังไม่สมบูรณ์";
    return row;
  });

  // Sheet 4: 4. คะแนนรวมของกรรมการแต่ละคน (Cross-Tabulation Matrix sorted by average score)
  const sheet4Sorted = [...subStats].sort((a, b) => {
    if (a.isComplete !== b.isComplete) return a.isComplete ? -1 : 1;
    return b.averageScore - a.averageScore;
  });

  const sheet4Data: Record<string, unknown>[] = sheet4Sorted.map((item) => {
    const row: Record<string, unknown> = {
      "หมายเลข": `#${item.submission_number}`,
      "ชื่อผลงาน": item.artwork_title,
      "ผู้ส่งผลงาน": item.display_name,
      "สนาม / หมวดหมู่": item.category_name || "ยังไม่จัดหมวด",
    };
    for (const j of judges) {
      const jEntry = item.jMap.get(j.id);
      row[`กรรมการ ${j.name}`] = jEntry ? jEntry.total : "-";
    }
    row["คะแนนเฉลี่ยรวม"] = item.averageScore;
    row["สถานะ"] =
      item.status === "DISQUALIFIED"
        ? "ตัดสิทธิ์ (Disqualified)"
        : item.isComplete
        ? "ครบถ้วน"
        : "ยังไม่สมบูรณ์";
    return row;
  });

  // Append summary row at bottom of Sheet 4
  const summaryRow: Record<string, unknown> = {
    "หมายเลข": "สรุปเฉลี่ย",
    "ชื่อผลงาน": "ค่าเฉลี่ยคะแนนของกรรมการแต่ละท่าน",
    "ผู้ส่งผลงาน": "-",
    "สนาม / หมวดหมู่": "-",
  };
  for (const j of judges) {
    const jScores = subStats
      .map((s) => s.jMap.get(j.id)?.total)
      .filter((t) => t !== undefined && t !== null) as number[];
    const avg = jScores.length
      ? Number((jScores.reduce((a, b) => a + b, 0) / jScores.length).toFixed(2))
      : 0;
    summaryRow[`กรรมการ ${j.name}`] = avg;
  }
  const overallAvg =
    subStats.length > 0
      ? Number((subStats.reduce((a, b) => a + b.averageScore, 0) / subStats.length).toFixed(2))
      : 0;
  summaryRow["คะแนนเฉลี่ยรวม"] = overallAvg;
  summaryRow["สถานะ"] = "-";
  sheet4Data.push(summaryRow);

  // Sheet 5: 5. คะแนนแยกกรรมการแต่ละคน (Detailed Criterion Breakdown per Judge)
  const sheet5Data: Record<string, unknown>[] = [];
  for (const item of sheet4Sorted) {
    for (const j of judges) {
      const jEntry = item.jMap.get(j.id);
      if (!jEntry) continue;
      const row: Record<string, unknown> = {
        "ชื่อกรรมการ": j.name,
        "หมายเลขผลงาน": `#${item.submission_number}`,
        "ชื่อผลงาน": item.artwork_title,
        "ผู้ส่งผลงาน": item.display_name,
        "หมวดหมู่": item.category_name || "ยังไม่จัดหมวด",
      };
      for (const crit of criteria) {
        row[`${crit.name} (เต็ม ${Number(crit.max_score)})`] = jEntry.criteria[crit.name] ?? "-";
      }
      row["คะแนนรวม (เต็ม 100)"] = jEntry.total;
      row["ข้อเสนอแนะ / Comment"] = jEntry.comment || "-";
      row["วันที่ให้คะแนน"] = jEntry.updated_at
        ? new Date(jEntry.updated_at).toLocaleString("th-TH")
        : "-";
      sheet5Data.push(row);
    }
  }

  // Sheet 6: 6. คนที่โหวตไม่ครบหรือผิดกติกา (Incomplete, Flagged, Disqualified)
  const sheet6Data: Record<string, unknown>[] = [];
  for (const item of subStats) {
    if (item.status === "DISQUALIFIED") {
      sheet6Data.push({
        "ประเภทปัญหา": "ตัดสิทธิ์ / ผิดกติกา (Disqualified)",
        "หมายเลข": `#${item.submission_number}`,
        "ชื่อผลงาน": item.artwork_title,
        "ผู้ส่งผลงาน": item.display_name,
        "สนาม / หมวดหมู่": item.category_name || "ยังไม่จัดหมวด",
        "รายละเอียด": "ผลงานนี้ถูกทำเครื่องหมาย Disqualified ในระบบ",
        "กรรมการที่ยังไม่ตรวจ": "-",
      });
    } else if (!item.isComplete) {
      const missing = judges
        .filter((j) => {
          const jEntry = item.jMap.get(j.id);
          return !jEntry || Object.keys(jEntry.criteria).length < criteria.length;
        })
        .map((j) => {
          const jEntry = item.jMap.get(j.id);
          const count = jEntry ? Object.keys(jEntry.criteria).length : 0;
          return `${j.name} (${count}/${criteria.length} เกณฑ์)`;
        });

      sheet6Data.push({
        "ประเภทปัญหา": "ให้คะแนนไม่ครบตามเกณฑ์ (Incomplete)",
        "หมายเลข": `#${item.submission_number}`,
        "ชื่อผลงาน": item.artwork_title,
        "ผู้ส่งผลงาน": item.display_name,
        "สนาม / หมวดหมู่": item.category_name || "ยังไม่จัดหมวด",
        "รายละเอียด": `กรรมการที่ยังตรวจไม่ครบจำนวน ${missing.length} ท่าน`,
        "กรรมการที่ยังไม่ตรวจ": missing.join(", "),
      });
    }
  }

  if (flagged.length > 0) {
    for (const fl of flagged) {
      sheet6Data.push({
        "ประเภทปัญหา": "กรรมการติดธง (Flagged for Review)",
        "หมายเลข": `#${fl.submission_number}`,
        "ชื่อผลงาน": fl.artwork_title,
        "ผู้ส่งผลงาน": fl.display_name,
        "สนาม / หมวดหมู่": fl.category_name || "-",
        "รายละเอียด": `กรรมการ ${fl.judge_name} ติดธงไว้รอการตรวจสอบ`,
        "กรรมการที่ยังไม่ตรวจ": "-",
      });
    }
  }

  if (sheet6Data.length === 0) {
    sheet6Data.push({
      "ประเภทปัญหา": "ไม่มีข้อมูล",
      "หมายเลข": "-",
      "ชื่อผลงาน": "-",
      "ผู้ส่งผลงาน": "-",
      "สนาม / หมวดหมู่": "-",
      "รายละเอียด": "ทุกผลงานได้รับการตรวจครบถ้วน 100% ไม่มีผลงานผิดกติกา",
      "กรรมการที่ยังไม่ตรวจ": "-",
    });
  }

  // Create Workbook & Sheets
  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.json_to_sheet(sheet1Data);
  ws1["!cols"] = [
    { wch: 10 },
    { wch: 10 },
    { wch: 38 },
    { wch: 22 },
    { wch: 25 },
    { wch: 22 },
    { wch: 14 },
    { wch: 24 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "1. คะแนนทั้งหมด");

  const ws2 = XLSX.utils.json_to_sheet(sheet2Data);
  ws2["!cols"] = [
    { wch: 14 },
    { wch: 10 },
    { wch: 38 },
    { wch: 22 },
    { wch: 26 },
    { wch: 26 },
    { wch: 26 },
    { wch: 26 },
    { wch: 22 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "2. คะแนนสนาม 1 (Digital)");

  const ws3 = XLSX.utils.json_to_sheet(sheet3Data);
  ws3["!cols"] = [
    { wch: 14 },
    { wch: 10 },
    { wch: 38 },
    { wch: 22 },
    { wch: 26 },
    { wch: 26 },
    { wch: 26 },
    { wch: 26 },
    { wch: 22 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, "3. คะแนนสนาม 2 (Traditional)");

  const ws4 = XLSX.utils.json_to_sheet(sheet4Data);
  ws4["!cols"] = [
    { wch: 10 },
    { wch: 38 },
    { wch: 22 },
    { wch: 25 },
    ...judges.map(() => ({ wch: 18 })),
    { wch: 16 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, ws4, "4. คะแนนรวมของกรรมการ");

  const ws5 = XLSX.utils.json_to_sheet(sheet5Data);
  ws5["!cols"] = [
    { wch: 16 },
    { wch: 14 },
    { wch: 38 },
    { wch: 22 },
    { wch: 25 },
    { wch: 26 },
    { wch: 26 },
    { wch: 26 },
    { wch: 26 },
    { wch: 22 },
    { wch: 30 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, ws5, "5. คะแนนแยกกรรมการแต่ละคน");

  const ws6 = XLSX.utils.json_to_sheet(sheet6Data);
  ws6["!cols"] = [
    { wch: 32 },
    { wch: 12 },
    { wch: 38 },
    { wch: 22 },
    { wch: 25 },
    { wch: 45 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, ws6, "6. คนที่โหวตไม่ครบหรือผิดกติกา");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(buffer);
}
