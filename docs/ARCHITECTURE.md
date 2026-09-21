# Architecture

## Runtime

The application uses Next.js App Router. Server components read operational data; server actions and route handlers perform mutations. Client components are limited to fast scoring, live refresh, image upload, CSV mapping, keyboard control, and presentation after confirmed writes.

## Boundaries

- `src/lib/db` owns provider selection, schema bootstrapping, seed data, transactions, and query helpers.
- `src/lib/auth` owns signed sessions and role enforcement.
- `src/lib/services` owns contest, judging, ranking, required-judge, revision, audit, and administration rules.
- `src/app` owns routes and server actions.
- `src/components` owns reusable application UI.

Production selects PostgreSQL when `DATABASE_URL` is configured. Local development selects durable PGlite storage. The SQL schema stays PostgreSQL-compatible.

Artwork storage is also provider-based. `/api/uploads` validates type and size, inspects the image, creates a WEBP thumbnail, and writes to Supabase Storage when its server-only variables exist; otherwise it writes to the ignored local demo directory.

## Core request flows

### Judge score write

1. The server reads the signed HTTP-only session and fixes the judge identity from it.
2. The request origin, contest, judge membership, contest status, active criteria version, comment requirement, and every score bound are validated.
3. A transaction locks the contest and score rows.
4. New score rows are inserted or version-matched rows are updated.
5. Updates create `score_revisions` and `audit_logs` in the same transaction.
6. The UI displays Saved only after the committed response; stale devices receive `SCORE_CONFLICT`.

### Ranking read

The ranking service reads active raw score rows for active required judges and the active criteria version. It derives judge totals and the configured aggregate on demand. Incomplete entries receive no rank. Optional criterion tie-breaking is explicit; unresolved equal values remain marked `TIE`.

### Criteria change

The editor always inserts a new immutable version. The admin chooses either an empty version or compatible migration. Compatible migration requires one-to-one criterion-name matching and valid score bounds; any mismatch rolls back the entire transaction.

## Trust model

Every mutation validates inputs and repeats authorization on the server. Judge pages never receive other judges' raw scores or live rankings. Destructive or high-impact operations require typed confirmation and are audited. Score writes use a partial unique index and optimistic version number. Mutation APIs reject untrusted origins, sessions are signed and HTTP-only, login attempts are throttled in PostgreSQL, security headers are emitted globally, and browser roles have no direct Supabase table access.
