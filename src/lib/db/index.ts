import { mkdir } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import { hash } from "bcryptjs";
import { INITIAL_SCHEMA_SQL } from "./schema";

export interface Queryable {
  query<T extends object>(sql: string, params?: unknown[]): Promise<T[]>;
  transaction<T>(work: (transaction: Queryable) => Promise<T>): Promise<T>;
}

const globalDb = globalThis as unknown as {
  artventureDb?: Promise<Queryable>;
};

async function createClient(): Promise<Queryable> {
  const url = process.env.DATABASE_URL?.trim();
  let client: Queryable;

  if (url?.startsWith("postgres")) {
    const sql = postgres(url, { max: 8, prepare: false });
    await sql.unsafe(INITIAL_SCHEMA_SQL);
    client = {
      async query<T extends object>(text: string, params: unknown[] = []) {
        return [...await sql.unsafe(text, params as never[])] as unknown as T[];
      },
      async transaction<T>(work: (transaction: Queryable) => Promise<T>) {
        const result = await sql.begin(async (transactionSql) => work({
          async query<R extends object>(text: string, params: unknown[] = []) {
            return [...await transactionSql.unsafe(text, params as never[])] as unknown as R[];
          },
          async transaction<R>(nested: (transaction: Queryable) => Promise<R>) {
            return nested(this);
          },
        }));
        return result as unknown as T;
      },
    };
  } else {
    const dataDir = path.join(process.cwd(), "data");
    await mkdir(dataDir, { recursive: true });
    const pglite = new PGlite(path.join(dataDir, "pglite"));
    await pglite.exec(INITIAL_SCHEMA_SQL);
    client = {
      async query<T extends object>(text: string, params: unknown[] = []) {
        const result = await pglite.query<T>(text, params);
        return result.rows;
      },
      async transaction<T>(work: (transaction: Queryable) => Promise<T>) {
        return pglite.transaction(async (transactionClient) => work({
          async query<R extends object>(text: string, params: unknown[] = []) {
            const result = await transactionClient.query<R>(text, params);
            return result.rows;
          },
          async transaction<R>(nested: (transaction: Queryable) => Promise<R>) {
            return nested(this);
          },
        }));
      },
    };
  }

  await seedDemo(client);
  await ensureContestCategories(client);
  return client;
}

export async function getDb(): Promise<Queryable> {
  globalDb.artventureDb ??= createClient();
  return globalDb.artventureDb;
}

export async function query<T extends object>(sql: string, params: unknown[] = []) {
  return (await getDb()).query<T>(sql, params);
}

async function seedDemo(db: Queryable) {
  // Purge legacy demo judges Venus & Zelfur so judges can be freely created and deleted
  await db.query(`
    UPDATE audit_logs SET actor_user_id = NULL WHERE actor_user_id IN ('judge-venus', 'judge-zelfur');
    DELETE FROM score_revisions WHERE changed_by IN ('judge-venus', 'judge-zelfur');
    UPDATE scores SET reset_by = NULL WHERE reset_by IN ('judge-venus', 'judge-zelfur');
    DELETE FROM scores WHERE judge_id IN ('judge-venus', 'judge-zelfur');
    DELETE FROM judging_sessions WHERE judge_id IN ('judge-venus', 'judge-zelfur');
    DELETE FROM judge_submission_order WHERE judge_id IN ('judge-venus', 'judge-zelfur');
    DELETE FROM contest_judges WHERE user_id IN ('judge-venus', 'judge-zelfur');
    DELETE FROM users WHERE id IN ('judge-venus', 'judge-zelfur');
    UPDATE users SET avatar_url = 'https://talesrunner.thehof.gg/asset/images/dt-crt-01.webp' WHERE id = 'admin-01' AND (avatar_url IS NULL OR avatar_url = '');
  `).catch(() => {});

  const existing = await db.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM contests");
  if (Number(existing[0]?.count ?? 0) > 0) return;

  const contestId = "contest-demo";
  const criteriaSetId = "criteria-set-demo";
  const criteriaVersionId = "criteria-v1-demo";
  const users = [
    { id: "admin-01", name: "Admin01", email: "admin@example.local", role: "SUPER_ADMIN", pin: "2468", color: "#FF873A", avatar_url: "https://talesrunner.thehof.gg/asset/images/dt-crt-01.webp" },
  ] as const;

  for (const user of users) {
    await db.query(
      "INSERT INTO users (id,name,email,role,avatar_color,avatar_url,pin_hash) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [user.id, user.name, user.email, user.role, user.color, user.avatar_url, await hash(user.pin, 10)],
    );
  }

  await db.query(
    `INSERT INTO contests (
      id,name,internal_name,description,status,active_criteria_version_id,judge_login_mode,
      aggregation_method,tie_breaker,required_judges,anonymous_judging,judging_order,
      comment_mode,input_mode,allow_judge_editing,result_visibility,progress_animations,metadata_visibility
    ) VALUES ($1,$2,$3,$4,'JUDGING',$5,'PICKER_PIN','SUM','Creativity',NULL,TRUE,'RANDOM_PER_JUDGE','OPTIONAL','STEPPER',TRUE,FALSE,TRUE,FALSE)`,
    [contestId, "Tales Artventure Demo", "tales-artventure-demo", "สนามตัดสินผลงานแฟนอาร์ตสำหรับทีมงาน", criteriaVersionId],
  );

  for (const [index, user] of users.entries()) {
    await db.query(
      "INSERT INTO contest_judges (id,contest_id,user_id,pin_hash,status,required,display_order) VALUES ($1,$2,$3,$4,'ACTIVE',$5,$6)",
      [`cj-${user.id}`, contestId, user.id, await hash(user.pin, 10), (user.role as string) === "JUDGE", index],
    );
  }

  await db.query("INSERT INTO criteria_sets (id,contest_id,name) VALUES ($1,$2,$3)", [criteriaSetId, contestId, "Fan Art Criteria"]);
  await db.query(
    "INSERT INTO criteria_versions (id,criteria_set_id,version_number,status,total_max,created_by) VALUES ($1,$2,1,'ACTIVE',100,$3)",
    [criteriaVersionId, criteriaSetId, "admin-01"],
  );

  const criteria = [
    ["criterion-theme", "Theme & Concept", "ความสอดคล้องกับธีมและความชัดเจนของแนวคิด", 30],
    ["criterion-composition", "Composition & Storytelling", "องค์ประกอบภาพและการเล่าเรื่อง", 25],
    ["criterion-creativity", "Creativity", "ความคิดสร้างสรรค์และความสดใหม่", 20],
    ["criterion-technique", "Technique & Completion", "เทคนิค ความประณีต และความสมบูรณ์", 15],
    ["criterion-expression", "Character Expression", "อารมณ์และบุคลิกของตัวละคร", 10],
  ] as const;
  for (const [index, item] of criteria.entries()) {
    await db.query(
      "INSERT INTO criteria (id,criteria_version_id,name,description,max_score,display_order) VALUES ($1,$2,$3,$4,$5,$6)",
      [item[0], criteriaVersionId, item[1], item[2], item[3], index],
    );
  }

  const titles = [
    "Skyline Sprint", "Forest Checkpoint", "Moonlit Relay", "Cloud Harbor", "Starfall Village",
    "Mint Meadow Dash", "Dragon Kite Day", "Sunset Shortcut", "Crystal Finish", "Festival Lap",
  ];
  for (let i = 0; i < titles.length; i += 1) {
    const number = String(i + 1).padStart(3, "0");
    const id = `submission-${number}`;
    await db.query(
      `INSERT INTO submissions (
        id,contest_id,submission_number,contestant_name,display_name,player_id,email,social_url,
        artwork_title,description,image_url,thumbnail_url,status,display_order
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11,'ACTIVE',$12)`,
      [id, contestId, number, `Demo Artist ${number}`, `Runner ${number}`, `TR-${number}`, `artist${number}@example.local`, "https://example.com/demo", titles[i], "Demo submission for judging workflow validation.", `/api/demo-art/${number}`, i],
    );
  }

  await db.query(
    "INSERT INTO audit_logs (id,contest_id,actor_user_id,action_type,entity_type,entity_id,after_data) VALUES ($1,$2,$3,'CONTEST_CREATED','contest',$2,$4::jsonb)",
    [crypto.randomUUID(), contestId, "admin-01", JSON.stringify({ seeded: true, name: "Tales Artventure Demo" })],
  );
}

async function ensureContestCategories(db: Queryable) {
  const contests = await db.query<{ id: string }>("SELECT id FROM contests");
  const defaults = [
    { slug: "traditional", name: "วาดบนกระดาษ", description: "Traditional art / งานวาดและลงสีบนกระดาษ", color: "#FF873A", icon: "✏️" },
    { slug: "digital", name: "วาดด้วยเครื่องมือดิจิทัล", description: "Digital art / งานที่สร้างด้วยอุปกรณ์และซอฟต์แวร์", color: "#27B8FF", icon: "🖥️" },
    { slug: "unspecified", name: "ยังไม่จัดหมวด", description: "ผลงานที่รอทีมงานตรวจสอบและจัดประเภท", color: "#64748B", icon: "🗂️" },
  ];
  for (const contest of contests) {
    for (const [index, item] of defaults.entries()) {
      await db.query(
        `INSERT INTO submission_categories (id,contest_id,name,slug,description,color,icon,display_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (contest_id,slug) DO NOTHING`,
        [`${contest.id}-category-${item.slug}`, contest.id, item.name, item.slug, item.description, item.color, item.icon, index],
      );
    }
    if (contest.id === "contest-demo") {
      await db.query(
        `UPDATE submissions SET category_id=CASE WHEN MOD(display_order,2)=0
          THEN $1 ELSE $2 END WHERE contest_id=$3 AND category_id IS NULL`,
        [`${contest.id}-category-digital`, `${contest.id}-category-traditional`, contest.id],
      );
    } else {
      await db.query("UPDATE submissions SET category_id=$1 WHERE contest_id=$2 AND category_id IS NULL", [`${contest.id}-category-unspecified`, contest.id]);
    }
  }
}
