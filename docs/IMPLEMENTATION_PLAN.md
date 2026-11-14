# Implementation plan and status

Last updated 2026-11-14.

## Done (all verified by `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e`)
- Phase 0 audit and architecture docs; PatternWitness moved to `legacy/` (owner-approved replacement).
- Phase 1 foundation: Next.js App Router, Tailwind tokens, UI kit, header + mobile nav, signed-cookie sessions with demo person switcher, SQLite schema, local storage provider, deterministic seed.
- Phase 2 give/browse: compress + upload, AI describe with deterministic fallbacks, idempotent publish, browse filters in URL, item page, interest, measurement requests.
- Phase 3 wishlists/matching: parser, hard filters + explainable score, both directions, notifications + polling bell, matches page.
- Phase 4 room planner: room creation (ft/m), R3F scene, procedural furniture, drag/rotate/nudge/remove+undo, bounds, SAT collision, autosave, 2D plan fallback, uncertainty labeling, fit states.
- Phase 5 RideBoard: state machine (server-enforced, compare-and-set), board, driver availability, notifications.
- Phase 6: Playwright demo path (4 tests), responsive pass at 375 and 1440 px, README and DEMO docs.

## Tests
41 unit tests (units, geometry, matching, parsing, pickups state machine, AI sanitising/provider selection) and 4 e2e tests.

## Known limitations / failures seen
- Anthropic provider untested against a live key. Mock and none paths tested.
- CoStar / Matterport not integrated (no docs/credentials). Null provider only.
- better-sqlite3 v13 segfaulted on Node 22.12 here; pinned to v11.
- Dev-only: R3F logs a deprecation warning for THREE.Clock (library-internal).
- Not tested on a physical phone; mobile checked via 375 px headless screenshots only. Touch drag uses the same pointer-event path as mouse.
- HEIC decoding depends on the browser (Safari decodes; others show a friendly error).

## Next priorities
1. Try the real AI provider with a key and tune the prompt on real photos.
2. Optional photos per listing > 1; real photography for seed data.
3. Reference spaces (CoStar/Matterport) if access is confirmed.
4. Deployment config (hosted DB, object storage).
