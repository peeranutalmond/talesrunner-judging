# Changelog

## 2026-09-18

### Added

- **Add Judge Modal Interactive Controls & Auto-Close**:
  - Replaced the uncloseable HTML `<details>` element on `/admin/judges` with an interactive, controlled `AddJudgeModal` component.
  - Added a dedicated **"✕ ปิด"** button at the top-right of the modal.
  - Added a **"✕ ยกเลิก / ปิด"** button at the bottom next to the submit button.
  - Added click-outside-to-close (backdrop click) and `Escape` key listener.
  - Form now automatically closes itself as soon as the new judge is submitted.
- **Quick Switch to Admin & Instant Logout in Judge HUD**:
  - Added a prominent **"👑 ไปหลังบ้าน"** button directly to the top HUD bar on the judging screen (`/judge`) for 1-click transition to the admin dashboard.
  - Added a **"🚪 Logout"** button to the top HUD bar on `/judge` for immediate sign-out to the lobby.
  - Added a **"🎮 ไปห้องตัดสิน (Judge) →"** button in the Admin sidebar to instantly switch back to the judging arena without manual re-login.
  - Added `tab=admin` query support to `/login` to automatically pre-select the Admin tab.
- **Blind Judging Privacy Safeguard**: Fixed the fallback artwork card in the judge workspace so contestant names, Tales Runner usernames, and UIDs from Google Sheet descriptions are strictly hidden when `anonymous_judging` is active, maintaining blind judging integrity.
- **Gartic Phone Style POP Lobby (`/login`)**:
  - Rebuilt the main lobby into a centered, playful, Gartic Phone-inspired game party room (`https://garticphone.com/lobby`).
  - **Interactive Character Spotlight**: Features a giant circular avatar frame with thick cartoon borders, left/right `<` `>` carousel arrows to cycle through characters (Chowon, etc.), role badges, and a mini-avatar strip for direct tapping.
  - **Role Mode Selector Tabs**: Chunky POP toggle between `🏃 โหมดกรรมการ (Judge)` and `👑 โหมดแอดมิน (Admin)`.
  - **Giant 3D "START" Button (`.arcade-btn-giant`)**: Massive emerald green/amber button with heavy 3D bottom bevel and tactile press animation (`active:translate-y-2`), enabling instant 1-Click login without typing PINs.
  - **Polka-dot Pattern Background (`.gartic-pattern`)**: Cheerful cyan-dotted party background with bottom badges highlighting the 69 artworks, Blind Judging mode, and 100-point criteria.
  - **Collapsible Custom PIN Keypad**: Hidden by default for effortless 1-click entry, expandable on demand for custom PINs.
- **Google Sheet Submissions Ingestion**: Imported all 69 real contestant artworks and details directly from the official Google Sheet (`[ส่งผลงาน] Tales Artventure : Animal Village with Friends`):
  - 53 Digital Art (`contest-demo-category-digital`) and 16 Traditional Art (`contest-demo-category-traditional`) submissions.
  - Mapped real contestant pen names, Tales Runner usernames, UIDs, artwork titles, and Google Drive artwork URLs.
  - Populated judge queue (`judge_submission_order`) for `judge-chowon` and `admin-01` to immediately score all 69 entries.
- **Dedicated Functional On-Site User Guide (`/guide`)**:
  - Built `/guide` route with clean, practical, step-by-step instructions for Judges (5 steps) and Admins.
  - 5-part scoring criteria reference table (Theme 30 pts, Composition 25 pts, Creativity 20 pts, Technique 15 pts, Expression 10 pts = 100 pts).
  - Keyboard shortcuts reference (`ArrowLeft`, `ArrowRight`, `F`, `Esc`).
  - Google Drive image permission & troubleshooting guidance with direct fallback links.
  - Prominent "📖 วิธีใช้งาน (User Guide)" link banner on login page and top HUD bar in judging workspace.
- **Typography & UX Polish**:
  - Switched font stack to clean Google Fonts `Kanit` and `Prompt` for crystal-clear Thai text rendering without illegible chunkiness.
  - Added 1-Click Instant Login buttons ("เข้าตัดสินทันที 1-Click" for Chowon, "เข้าแอดมินทันที 1-Click" for Admin01).
  - Added "ใส่คะแนนด่วน (85% ทุกเกณฑ์)" button and "ข้ามไปก่อน ⏭️" button in judging workspace for testing without friction.
  - Added Google Drive image fallback card and `referrerPolicy="no-referrer"` on all artwork images to avoid CORS/origin issues.
- Next.js 16 application, responsive fantasy-racing visual system, reusable UI, and PGlite demo mode
- Signed HTTP-only sessions, RBAC, contest-aware picker, hashed PINs, persistent PIN throttling, security headers, and mutation-origin checks
- Multi-contest create/switch/duplicate workflow and configurable status/settings
- Submission search/filter/pagination, manual editing, CSV mapping/preview/import, safe archive/restore, reorder, validated uploads, originals, and generated thumbnails
- Dynamic criteria editor, presets, immutable version history, typed confirmation, and transactional compatible-score migration
- Blind judge workspace, autosave, retry/conflict states, quick score controls, keyboard shortcuts, fullscreen/original view, fixed randomized queues, review flags, completion screen, and 220 ms checkpoint motion
- Raw judge × submission × criterion × criteria-version score records, soft resets, score revisions, and full audit logging
- Required/optional judges, live progress, analytics, derived ranking, incomplete warnings, criterion/manual tie-breaking, result locks, and result snapshots
- Raw score breakdown with controlled admin revision and mandatory reasons
- CSV/XLSX/JSON exports for ranking, raw/historical scores, judge totals, criteria breakdown, progress, and audit
- Supabase migrations for the base schema, auth rate limiting, unique contest names, and RLS lockdown
- Full project, architecture, database, scoring, admin, judge, and continuation documentation
- Visual rankings: Artwork image previews on all ranking rows and Top 3 Podium showcase cards per category/track
- UI/UX overhaul to POP, Tales Runner & Gartic Phone arcade game aesthetic:
  - Official Tales Runner logo, character portraits (Chowon, Mingming, Lina), and stat icons (Speed, Accel, Strength, Control) from the official Thai website
  - Google Fonts integration: Rowdies (arcade game typography) and Prompt (Thai/body typography)
  - Chunky comic cards with bold borders (`border-2.5 border-slate-900`) and 3D arcade push buttons (`active:translate-y-1`)
  - Redesigned Scoring Workspace (`/judge`): Runner HUD, checkpoint XP progress bar, Star Power scoreboard, stat-based criteria cards with quick score multipliers, speech-bubble comment box, and juicy CLEAR & NEXT button
  - Redesigned Character Select Lobby (`/login`) with TR character cards and arcade PIN input
  - Redesigned Stage Clear & Trophy Gallery (`/judge/review`) with comic status stamps
- Flexible paper/digital/custom artwork tracks with admin ordering, filtering, safe activation, queue sorting, and per-track leaderboards
- Judge Roster Freedom: Implemented `deleteJudgeAction` server action with transactional cascading score/session/queue cleanup and audit logging; admins can now freely add and delete judges
- Redesigned Judge Management (`/admin/judges`) with 1-click official Tales Runner character presets (Chowon, Lina, Mingming, Bigbo, DnD, Maki, Rough, Bada), custom avatar upload, status toggles, and safe deletion confirmation dialogs
- Purged demo judges Venus and Zelfur from local database and seeds, leaving only Admin01 (`2468`) and user-added judges
- Comprehensive User Manual: Added `USER_GUIDE.md` detailing both Frontend and Backend architectures, workflows, operations, and guidelines in Thai
- Google Forms CSV ingestion with direct public Google Drive link normalization and retained source provenance
- Judge portraits from upload, direct URL, or Drive link, displayed in the picker and game-style runner HUD
- Game HUD concepts including runner identity, checkpoint XP, world/track, stage, star power, and blind-mode privacy copy
- Migration `005_categories_drive_and_profiles.sql` for upgraded production databases

### Fixed

- Autosave no longer refreshes into the next incomplete artwork while retaining stale client state
- Admin progress query groups by judge display order correctly
- Active-version and required-judge filters now prevent historical or optional scores from distorting ranking
- Concurrent first writes now return a conflict instead of overwriting a newer device
- Comment-required and judge-editing settings are enforced on the server

### Verified

- `pnpm typecheck`, `pnpm lint`, and `pnpm build`
- Raw score/revision/audit acceptance case, refresh persistence, two-tab conflict handling, admin routes, and 390×844 responsive judge layout
