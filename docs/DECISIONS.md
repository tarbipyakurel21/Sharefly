# Decisions

- 2026-11-14: Repo contained PatternWitness, not ShareFly. Owner chose to replace it; old code is in `legacy/`.
- SQLite via `better-sqlite3@11` instead of Prisma: no codegen/engine download, schema stays portable. v13 segfaulted on Node 22.12.
- Raw SQL in `lib/db` rather than an ORM; JSON lists stored as TEXT.
- AI providers implemented: `anthropic` (fetch, no SDK), `mock`, `none`. OpenAI/Google intentionally not implemented (no demo value).
- 2026-11-14: Added `gemini` provider (REST via fetch, `x-goog-api-key` header, JSON response mode) at the owner's request. Shares timeout/retry/Zod-sanitize logic with `anthropic`. Verified live on 2026-11-14 with `gemini-3.5-flash` (`gemini-2.5-flash` is retired for new keys; thinking tokens count against `maxOutputTokens`, so it is set to 2048).
- AI model default `claude-sonnet-5-5`; configurable via `ANTHROPIC_MODEL`. Not verified against a live key in this environment.
- Uploads: local disk (`data/uploads`) served by a route handler.
- CoStar / Matterport: no documentation or credentials were found in the repository, so no endpoint is called. The null provider stays active and no related UI renders.
- Distance: haversine between neighborhood centres from a static table; unknown neighborhoods have null coordinates.
- 2026-11-14: CoStar reference spaces. One compact record per apartment floor plan, written by `scripts/import-costar.ts` to `data/reference-spaces.json` (gitignored). Rent 0 becomes null ("not provided"). Matterport ids are kept at community, floor-plan and unit level (types 36/234, `videoKey`); no media is downloaded.
- Room size from a floor plan is an ESTIMATE: main room = floor-plan sq ft x share (studio 80%, 1 bed 40%, 2 bed 30%, 3+ bed 25%), 1.25:1 shape, 8 ft ceiling (the kit has none). Editable, always labelled. Smaller end of the sq ft range is used.
- Rooms store a JSON `source` snapshot (server-built from the space id; clients never supply it) so the source label survives dataset changes.
- Max-rent filter hides floor plans with unknown rent rather than assuming they are cheap.
- E2E uses a synthetic fixture (`tests/fixtures/reference-spaces.sample.json`), not CoStar data, so tests never need the kit.
