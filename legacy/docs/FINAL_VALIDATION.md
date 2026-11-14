# Final validation

Date: 2026-11-14

## Checks run

- Python compilation: **passed** with a writable temporary bytecode cache.
- Deterministic sample analysis: **passed** — 30 messages, 25 accounts, 8 URLs, 4 combined clusters, 14 flagged messages; ablation produced text-only `3/11`, links-only `4/12`, combined `4/14` (clusters/messages).
- Backend `pytest -q`: **blocked** — `pytest` is not installed on the active PATH.
- Frontend `npm run build`: **blocked** — `tsc` is unavailable because frontend dependencies/node_modules are not installed.
- Static review: completed for source, manifests, sample dataset, API routes, tests, and Git history.

## Not claimed as passing

Dependency installation, backend startup, frontend startup, API connectivity, live MongoDB Atlas, external sponsor APIs, disconnected-network behavior, large-file performance, and the live browser demo remain unverified in this environment.

## Manual acceptance checklist

After installing dependencies, run backend tests, `npm install && npm run build`, start both services, load demo data, inspect the ablation, select a cluster, save a review, download a report, and test an invalid CSV. Record actual results here before submission.
