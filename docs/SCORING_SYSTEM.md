# Scoring System

## Storage

Each criterion score is an independent database row. Judge totals and rankings are calculated from raw rows; cached totals are never the source of truth.

An active row is uniquely identified by `(submission_id, judge_id, criterion_id, criteria_version_id)`. A soft reset retires current rows instead of deleting them.

## Criteria versions

Every score references a criteria version. A criteria version that has scores is not edited in place. Administrators confirm `CREATE VERSION`, then choose:

- `Create empty version` — historical scores remain on the archived version and active-version progress starts empty.
- `Migrate compatible scores` — copies current rows only when old/new criterion names match one-to-one and every score fits the new maximum; otherwise the transaction rolls back.

## Completion

A judge-submission pair is complete only when all active criteria contain valid scores. A submission is complete only when the configured required judges have completed it.

## Ranking

Supported methods are `SUM`, `AVERAGE`, `MEDIAN`, and `DROP_HIGHEST_LOWEST`. Only active required judges contribute. Incomplete submissions are labeled and receive no rank. A configured criterion total can break ties; `MANUAL` leaves equal entries visibly marked `TIE`.

## Conflict handling

Score records carry a version counter. Writes can include the last observed version; stale concurrent edits return a conflict instead of silently overwriting another device.

## Revision rules

- Initial score rows create `SCORE_CREATED` audit events.
- Any changed score or comment increments the row version, adds `score_revisions`, and adds `SCORE_UPDATED` audit evidence.
- Admin score edits require a reason.
- Judges can edit only while results are unlocked, the contest is in `JUDGING`, and `allow_judge_editing` is enabled.
- Result locks block all score writes until an audited unlock.

## Acceptance checks completed

### Raw score and revision

Venus scored Artwork #001 as 28, 21, 17, 14, 9. Database inspection confirmed five active rows and total 89. Admin changed Creativity 17→19 with a reason. Database inspection confirmed current total 91, a 17→19 revision, and `SCORE_UPDATED` audit data; the leaderboard recalculated to 91.

### Refresh

After scoring Artwork #002, a full browser refresh restored 28, 21, 17, 14, 9 and progress 2/10 without duplicate rows.

### Two devices

Two tabs loaded an unscored artwork. The first saved successfully. The stale second tab received the visible conflict state and did not overwrite the committed rows.

### Production checks

After connecting Supabase, repeat these cases plus three required judges (91, 87, 90 → total 268, average 89.33) before opening a real contest.
