# Artventure Judge Console

Internal judging application for configurable fan-art contests. The judge experience is a fast, blind, one-artwork-at-a-time run; the admin experience manages multiple contests, criteria versions, submissions, required judges, live progress, ranking, revisions, audit history, snapshots, and exports.

## Included

- Judge picker with PIN by default, signed HTTP-only sessions, RBAC, PIN throttling, and origin checks
- Blind judge workspace: autosave, optimistic conflict detection, keyboard shortcuts, fullscreen/original image, personal flags, review mode, and a 220 ms checkpoint transition
- Raw score storage at `contest × submission × judge × criteria version × criterion`
- Immutable criteria versions, presets, 100-point validation, and explicit compatible-score migration
- Admin score editing with mandatory reason, score revisions, and global audit logs
- Multi-contest creation/switching/duplication; duplicated events copy settings, judges, and criteria—not submissions or scores
- Google Forms CSV mapping/preview/import, including public Google Drive file links; original source links are retained while display URLs are normalized
- Flexible artwork tracks with paper and digital defaults, custom categories, category ordering/filtering, queue sorting, and per-track rankings
- Visual rankings: Top 3 podium showcase cards per track and full ranking tables with prominent artwork image thumbnails
- Tales Runner & Gartic Phone arcade game UI: 3D tactile buttons, comic borders, official TR logo/stat icons/characters, Rowdies & Prompt typography, Star Power scoreboard, and checkpoint XP progress gauge
- Manual submissions plus validated PNG/JPEG/WEBP uploads with generated thumbnails
- Judge portrait upload/link support shown on login, the runner HUD, and the admin roster
- Required-judge configuration, live progress, analytics, tie handling, result locks, snapshots, and CSV/XLSX/JSON exports
- PostgreSQL/Supabase migrations plus a durable zero-config PGlite demo

## Stack

- Next.js 16 App Router, React 19, TypeScript 6, Tailwind CSS 4
- PostgreSQL via `postgres`; Supabase PostgreSQL in production
- Supabase Storage in production; local `public/uploads` adapter in demo mode
- PGlite for local persistent demo data

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. Without `DATABASE_URL`, data persists in `data/pglite`.

### Initial Administrator Access

- **Admin01** — PIN `2468` (Super Admin)
- กรรมการสามารถเพิ่มและลบได้อย่างอิสระผ่านเมนู **ทีมกรรมการ (`/admin/judges`)** พร้อมเลือกตัวละคร Tales Runner หรืออัปโหลดรูปตัวเอง

📖 **คู่มือการใช้งานระบบภาษาไทยแบบละเอียด:** ดูได้ที่ [USER_GUIDE.md](USER_GUIDE.md)

Quality commands:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Production configuration

1. Copy `.env.example` to `.env.local` or configure the same values in Vercel.
2. Set `DATABASE_URL` to the trusted Supabase PostgreSQL connection, and set a long random `SESSION_SECRET`.
3. Apply every SQL file in `supabase/migrations` in numeric order.
4. Create a public Supabase Storage bucket (default `artworks`) and set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ARTWORK_BUCKET` only on the server.
5. Set `DEMO_MODE=false`, deploy to Vercel, then run the acceptance tests in `docs/SCORING_SYSTEM.md` against the production database.

The optional `ACCOUNT` login mode is intentionally blocked until an external identity provider is connected; `PICKER_PIN` is fully implemented and remains the safe default.

## Main routes

- `/login` — contest-aware staff picker and PIN login
- `/judge` and `/judge/review` — blind judging run and personal review queue
- `/admin` — live operations dashboard
- `/admin/results/[submissionId]` — raw breakdown and controlled score revision
- `/admin/contests`, `/categories`, `/criteria`, `/submissions`, `/judges`, `/progress`, `/analytics`, `/export`, `/audit`, `/settings`

See `docs/` for architecture, database, scoring, operations, and handoff notes.
