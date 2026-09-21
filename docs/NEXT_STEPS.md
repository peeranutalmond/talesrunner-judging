# Next Steps

1. Create/select the owner's Supabase project and public artwork bucket.
2. Apply migrations `001` through `004`, configure database/storage/session secrets, and set `DEMO_MODE=false`.
3. Run the documented acceptance tests against Supabase with three required judges and representative full-size artwork files.
4. Configure the Vercel project, deploy, verify security headers and uploads, then invite the real judge roster.
5. If `ACCOUNT` mode is required, connect the owner's identity provider and replace the intentional blocked-state adapter before enabling it.

## Do Not Break

- Score history
- Criteria versioning
- Audit logs
- Unique judge score constraint
- Server-side authorization
- Explicit incomplete-judging warnings
- Judges must never receive other judges' scores or ranking data.
- Result pages must remain derived from raw score rows, not snapshots or cached totals.
- Criteria changes must create a version; never rewrite historical criteria IDs.
- Soft reset/archive behavior must preserve revision and audit evidence.

## External Inputs Needed

- Supabase PostgreSQL connection string
- Supabase project URL, server-only service-role key, and artwork bucket name
- Vercel project/team access and production hostname
- Decision and provider credentials only if `ACCOUNT` login mode is needed
