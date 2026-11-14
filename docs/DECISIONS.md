# Decisions

- 2026-11-14: Repo contained PatternWitness, not ShareFly. Owner chose to replace it; old code is in `legacy/`.
- SQLite via `better-sqlite3@11` instead of Prisma: no codegen/engine download, schema stays portable. v13 segfaulted on Node 22.12.
- Raw SQL in `lib/db` rather than an ORM; JSON lists stored as TEXT.
- AI providers implemented: `anthropic` (fetch, no SDK), `mock`, `none`. OpenAI/Google intentionally not implemented (no demo value).
- AI model default `claude-sonnet-5-5`; configurable via `ANTHROPIC_MODEL`. Not verified against a live key in this environment.
- Uploads: local disk (`data/uploads`) served by a route handler.
- CoStar / Matterport: no documentation or credentials were found in the repository, so no endpoint is called. The null provider stays active and no related UI renders.
- Distance: haversine between neighborhood centres from a static table; unknown neighborhoods have null coordinates.
