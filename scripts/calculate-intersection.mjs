import postgres from "postgres";

const sql = postgres("postgresql://neondb_owner:npg_XzoIP1EsmK3d@ep-cold-sky-b4yiy5jl-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require");

const [contest] = await sql`SELECT * FROM contests WHERE id = 'contest-demo'`;
const activeVer = contest.active_criteria_version_id;

// Fetch all judge scores grouped by judge, submission, category
const scores = await sql`
  SELECT u.name AS judge_name, s.id AS submission_id, s.submission_number, s.artwork_title, s.display_name,
         cat.name AS category_name, cat.slug AS category_slug,
         SUM(sc.score)::float8 AS total_score
  FROM scores sc
  JOIN users u ON u.id = sc.judge_id
  JOIN submissions s ON s.id = sc.submission_id
  LEFT JOIN submission_categories cat ON cat.id = s.category_id
  WHERE sc.contest_id = 'contest-demo' AND sc.is_active = TRUE AND sc.criteria_version_id = ${activeVer} AND u.role = 'JUDGE'
  GROUP BY u.name, s.id, s.submission_number, s.artwork_title, s.display_name, cat.name, cat.slug
  ORDER BY u.name, total_score DESC
`;

// Separate by category and judge
const judges = [...new Set(scores.map(s => s.judge_name))];

for (const catSlug of ["digital", "traditional"]) {
  const catName = catSlug === "digital" ? "Digital Art" : "Traditional Art";
  console.log(`\n========================================`);
  console.log(`🎯 HIGHEST SCORED TOP 5 BY EACH JUDGE: ${catName}`);
  console.log(`========================================`);

  const judgeTop5Map = {};
  const submissionCounts = {}; // submission_number -> { item, count, judges: [] }

  for (const j of judges) {
    const jScores = scores.filter(s => s.judge_name === j && s.category_slug === catSlug);
    const top5 = jScores.slice(0, 5);
    judgeTop5Map[j] = top5;

    console.log(`\n👨‍⚖️ ${j} Top 5:`);
    top5.forEach((item, idx) => {
      console.log(`  ${idx + 1}. #${item.submission_number} [${item.total_score} คะแนน] - ${item.artwork_title} (${item.display_name})`);
      if (!submissionCounts[item.submission_number]) {
        submissionCounts[item.submission_number] = {
          submission_number: item.submission_number,
          artwork_title: item.artwork_title,
          display_name: item.display_name,
          scores: [],
          judges: []
        };
      }
      submissionCounts[item.submission_number].judges.push(j);
      submissionCounts[item.submission_number].scores.push(item.total_score);
    });
  }

  // Find Intersection (U ตรงกลางที่ซ้ำกันมากที่สุด)
  console.log(`\n----------------------------------------`);
  console.log(`⭐ INTERSECTION (จุดร่วมที่กรรมการให้คะแนนตรงกันมากที่สุดใน ${catName})`);
  console.log(`----------------------------------------`);
  const sortedIntersection = Object.values(submissionCounts)
    .map(item => ({
      ...item,
      intersect_count: item.judges.length,
      avg_score: item.scores.reduce((a, b) => a + b, 0) / item.scores.length
    }))
    .sort((a, b) => b.intersect_count - a.intersect_count || b.avg_score - a.avg_score);

  sortedIntersection.slice(0, 5).forEach((item, idx) => {
    console.log(`🏆 อันดับ ${idx + 1}: #${item.submission_number} - ${item.artwork_title} (${item.display_name})`);
    console.log(`   👉 กรรมการเลือกตรงกัน: ${item.intersect_count} / ${judges.length} ท่าน [${item.judges.join(", ")}]`);
    console.log(`   👉 คะแนนเฉลี่ยในกลุ่มที่เลือก: ${item.avg_score.toFixed(2)} คะแนน\n`);
  });
}

await sql.end();
