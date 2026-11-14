# Target architecture

- **Next.js (App Router) + TypeScript strict + Tailwind 4**, repo root. Server Components read the DB
  directly; client components call `/api/*` route handlers for mutations.
- **SQLite via better-sqlite3**, schema in `lib/db/schema.ts`, created on first use, seeded by `scripts/seed.ts`.
- **Business logic in `lib/`** as pure functions: `units`, `geo`, `matching`, `room`, `pickups`, `ai`.
- **Auth**: HMAC-signed HTTP-only cookie holding a user id. Sign in by name + email. `DEMO_MODE` adds a person switcher.
- **AI**: `AIProvider` interface (`anthropic | mock | none`), Zod-validated output, post-check for invented measurements/brands, deterministic fallbacks.
- **Matching**: hard filters → 0-100 score → human reasons, both directions, upsert on (listing, wishlist).
- **Room planner**: React Three Fiber, 1 unit = 1 m, procedural furniture, SAT collision, 2D SVG fallback.
- **RideBoard**: server-enforced state machine in `lib/pickups/state.ts`.
- **Optional**: `ReferenceSpaceProvider` with a null default.

## Migration
`backend/` and `frontend/` moved to `legacy/` with `git mv` (history preserved). Nothing was deleted.
