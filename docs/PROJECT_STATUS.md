# Project Status

Last Updated: 2026-09-18 14:30 ICT

## Current Version

v1.0.0

## Completed
 
- Rebuilt Lobby UI/UX to POP, Gartic Phone game aesthetic (`https://garticphone.com/lobby`) with central character spotlight, `<` `>` swapper arrows, mode tabs (Judge vs Admin), and giant 3D "START" button with instant 1-Click login
- Imported 69 real contestant submissions from official Google Sheet (`[ส่งผลงาน] Tales Artventure : Animal Village with Friends`) with 53 Digital Art and 16 Traditional Art entries, real artist names, UIDs, and Google Drive artwork URLs
- Built dedicated functional On-Site User Guide (`/guide`) with role-based steps for judges and admins, scoring criteria table, shortcuts, and Google Drive access guide
- Enhanced Typography & UX: Integrated Google Fonts `Kanit` and `Prompt`, added 1-Click Fast Login buttons, quick 85% score test buttons, and "ข้ามไปก่อน ⏭️" skip navigation
- Added Google Drive image fallback cards and `referrerPolicy="no-referrer"` handling for seamless artwork viewing
- Signed session authentication, server RBAC, hashed judge PINs, and database-backed PIN throttling
- Multi-contest create/switch/duplicate flow and configurable contest lifecycle
- Submission CRUD-style editing, safe archive/restore, reorder, CSV mapping/import, image upload, and thumbnail generation
- Public Google Drive link normalization for manual and Google Forms CSV imports, with source-link provenance retained
- Flexible artwork tracks: paper/digital defaults, custom categories, reorder/hide, category filters, automatic queue sorting, and per-track ranking
- Judge portrait upload/link support across login, runner HUD, and roster management
- Game-style judge HUD with runner identity, XP/checkpoint progress, worlds/tracks, stages, star power, and blind-mode messaging
- Dynamic criteria editor, reusable presets, immutable versions, and guarded compatible-score migration
- Blind judge scoring, autosave, retry/error states, keyboard navigation, fullscreen/original image, review flags, and responsive checkpoint motion
- Raw per-criterion score storage, optimistic concurrency, score revisions, audit logs, and soft score resets
- Required-judge configuration, live dashboard/progress/ranking, analytics, tie-break configuration, locks, and snapshots
- CSV, XLSX, and JSON exports for ranking, raw scores, judge totals, criteria breakdown, progress, and audit
- Visual ranking: Prominent artwork thumbnails in ranking tables and Top 3 podium showcase cards per artwork track
- Complete UI/UX redesign: Tales Runner + Gartic Phone game aesthetic, official TR logo/stat icons/avatars, Rowdies & Prompt fonts, 3D arcade buttons, and comic cards
- Judge roster freedom: Added `deleteJudgeAction` with transactional cascading cleanup, updated `/admin/judges` with 1-click official Tales Runner character presets (Chowon, Lina, Mingming, Bigbo, DnD, Maki, Rough, Bada), and removed legacy demo accounts Venus & Zelfur
- Comprehensive documentation: Created `USER_GUIDE.md` (detailed Thai user guide for frontend & backend) and updated all documentation
- Versioned Supabase migrations, RLS lockdown, PGlite demo database, security headers, origin checks, and project documentation
- Verified acceptance case: 5 raw rows; 89 total; 17→19 revision; 91 recalculation; audit entry
- Verified category migration against existing scores, paper/digital grouping, Drive URL conversion, concurrent-device conflict, refresh persistence, responsive layout, lint, typecheck, and production build

## In Progress

- Production environment provisioning (requires project-owner credentials)

## Not Started

- Supabase database/storage provisioning
- Vercel environment-secret configuration and deployment
- Optional external identity provider for `ACCOUNT` login mode

## Known Issues

- Production deployment cannot be completed without owner-provided Supabase/Vercel credentials.
- `ACCOUNT` login mode is blocked until an external identity provider is configured; Picker and Picker + PIN are implemented.

## Important Decisions

- Raw scores are stored per judge, submission, criterion, and criteria version.
- Criteria are immutable by version once used.
- Score edits create revision and audit records.
- PGlite is local-only; production uses PostgreSQL/Supabase through the same repository boundary.
- The leaderboard is always derived from current raw rows; result snapshots are immutable evidence, not ranking inputs.
- Submission deletion is implemented as a recoverable archive so historical scores and audit evidence are not destroyed.
