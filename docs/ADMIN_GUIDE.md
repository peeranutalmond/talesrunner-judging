# Admin Guide

1. Sign in as Admin01 or another admin.
2. Open **Contests** to switch, create a draft, or duplicate the current event. Duplication copies settings, judges, and active criteria only.
3. Open **Artwork Tracks** to manage contest categories. Paper and digital tracks are created automatically; add, hide, recolor, iconize, or reorder more tracks as needed.
4. Open **Judges** (`/admin/judges`) to add new judges (with 4-6 digit PINs and official Tales Runner character presets or custom uploads), edit profiles, toggle Required or Optional, disable, or delete judges cleanly with full audit logging. Legacy demo judges Venus & Zelfur have been removed.
5. Open **Scoring Criteria**. Apply a preset or edit/reorder criteria until the total is exactly 100. Type `CREATE VERSION`, then create an empty version or explicitly migrate compatible scores.
6. Open **Submissions** to search/filter by track, add manually, upload an image, paste a public Google Drive link, or import a Google Forms CSV. Use the queue sorter for track/number, number, submission time, or artist name. Detail pages edit metadata and track, replace images, reorder, archive, or restore.
7. Open **Settings**, verify anonymity, comments, input mode, queue order, aggregation, tie-breaker, and set status to `JUDGING`.
8. Monitor the live dashboard, required-judge progress, incomplete artwork counts, analytics, and recent audit events.
9. Open **Results** to inspect live ranking. The page displays a Top 3 Podium showcase for each artwork track and full ranking tables with prominent artwork image thumbnails. Click an artwork image or number for raw judge × criterion rows, revision history, criterion averages, and controlled admin edits with a mandatory reason.
10. Resolve incomplete entries and visible ties. Create a named snapshot, type `LOCK`, and lock final results.
11. Export ranking, all raw/historical scores, judge totals, criteria breakdown, progress, and audit data as CSV, XLSX, or JSON.

## Confirmation phrases

- New criteria version: `CREATE VERSION`
- Disqualify: `DISQUALIFY`
- Reset scores: `RESET` plus a reason
- Replace artwork: `REPLACE`
- Archive artwork: `DELETE`
- Duplicate contest: `DUPLICATE`
- Lock/unlock results: `LOCK` / `UNLOCK`

Never share service-role credentials in the browser. Upload replacement does not delete the prior storage object, and archive/reset operations preserve historical evidence. Unlocking results and administrative score changes are recorded in the audit log.
