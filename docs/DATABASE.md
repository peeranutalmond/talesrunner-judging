# Database

The authoritative schema lives in versioned files under `supabase/migrations`.

## Core relationships

- A contest has flexible submission categories, submissions, assigned judges, one active criteria version, judging sessions, settings, and result snapshots.
- A criteria set has immutable numbered versions; each version has ordered criteria.
- A score belongs to one contest, submission, judge, criterion, and criteria version.
- A score update writes `score_revisions` and `audit_logs` in the same transaction boundary.
- `judge_submission_order` persists each judge's queue and personal review flag, so refreshes never reshuffle the run.
- `result_snapshots` stores immutable calculated result payloads; it is never a source for current ranking.
- `auth_attempts` stores one-way attempt keys for PIN throttling and never stores raw IP addresses.

## Main tables

- `contests` — lifecycle, active criteria version, login/scoring/order/comment modes, visibility, and lock state
- `users`, `contest_judges` — global identity plus portrait URL, contest membership, PIN hash, status, required flag, and display order
- `submission_categories` — configurable contest tracks with name, slug, color, icon, active state, and display order
- `submissions` — contestant metadata, normalized/original-source/thumbnail URLs, category, status, notes, and ordering
- `criteria_sets`, `criteria_versions`, `criteria` — immutable numbered scoring definitions
- `judge_submission_order`, `judging_sessions` — fixed queue and session/progress support
- `scores` — current and reset raw criterion score rows with optimistic `version`
- `score_revisions` — before/after score, actor, reason, and timestamp
- `audit_logs` — global mutation evidence with JSONB before/after payloads
- `result_snapshots` — named versioned ranking evidence
- `auth_attempts` — login rate-limit events

## Constraints

- Score values are non-negative in SQL and additionally checked against `criterion.max_score` on the server.
- One active score exists per `(submission_id, judge_id, criterion_id, criteria_version_id)` through the partial unique index `uq_scores_active`.
- Criteria activation requires an application-validated total maximum of exactly 100.
- Foreign keys prevent cross-contest orphan records.
- `internal_name` is unique across contests.
- Score resets preserve rows by setting `is_active=false` with reset actor, reason, and time.

## Indexes

Indexes cover contest/status lookup, submission and judge score lookup, criterion lookup, queue position, audit and revision chronology, unique contest names, and recent authentication attempts.

## Security policies

The application performs server-side RBAC and never exposes database credentials to the browser. Migration `004` enables RLS on every application table and revokes direct `anon`/`authenticated` access. The trusted Next.js server connection performs all reads and writes. Storage service-role credentials are server-only.

## Migration history

- `001_initial_schema.sql` — contests, identity, criteria versioning, submissions, scores, revisions, sessions, ordering, audit, and snapshots.
- `002_auth_rate_limit.sql` — persistent PIN-attempt tracking and lookup index.
- `003_unique_contest_internal_name.sql` — unique internal event names.
- `004_rls_lockdown.sql` — enables RLS and removes direct browser table privileges.
- `005_categories_drive_and_profiles.sql` — artwork tracks, source image provenance, category assignment, and judge portraits.

The local PGlite bootstrap mirrors these structures in `src/lib/db/schema.ts`. Production changes must be added as a new numbered migration and mirrored there when the local runtime also needs them.
