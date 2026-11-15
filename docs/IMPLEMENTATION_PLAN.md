# Implementation plan and status

Last updated 2026-11-14.

## Done (all verified by `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e`)
- Phase 0 audit and architecture docs; PatternWitness moved to `legacy/` (owner-approved replacement).
- Phase 1 foundation: Next.js App Router, Tailwind tokens, UI kit, header + mobile nav, signed-cookie sessions with demo person switcher, SQLite schema, local storage provider, deterministic seed.
- Phase 2 give/browse: compress + upload, AI describe with deterministic fallbacks, idempotent publish, browse filters in URL, item page, interest, measurement requests.
- Phase 3 wishlists/matching: parser, hard filters + explainable score, both directions, notifications + polling bell, matches page.
- Phase 4 room planner: room creation (ft/m), R3F scene, procedural furniture, drag/rotate/nudge/remove+undo, bounds, SAT collision, autosave, 2D plan fallback, uncertainty labeling, fit states.
- Phase 5 RideBoard: state machine (server-enforced, compare-and-set), board, driver availability, notifications.
- AR "View in your room": item page button opens a 3D viewer of a to-scale model (from the giver's measurements) with a "Place it in my room" AR button on capable phones. Furniture geometry moved to `lib/room/model.ts`, shared by planner and AR; shapes now stay within the measured box (bed headboard, storage lid, dresser fronts, sofa arm z-fighting fixed). Planner link renamed "Arrange it on my floor plan".
- "In a photo of my room" (for laptops): upload a room photo (stays on device); the item is placed on the floor automatically with an estimated phone camera (EXIF lens when available) in true perspective, labeled as an estimate; optional "Make it more accurate" door marking fixes the camera height; turn, camera tilt, save the composite PNG. Scale math in `lib/room/photo.ts`.
- Preview polish (2026-11-14, uncommitted on `feature/preview-polish`): the procedural sofa is now an upholstered model (rounded seat and back cushions, one per seat by width; arms, base, back frame, tapered legs; woven-cloth normal map) that is still exactly the giver's width × depth × height, checked by unit tests and by `<model-viewer>`'s reported dimensions. The modal is larger (up to 1024 px, full-height sheet on phones) with studio lighting, a soft ground shadow, zoom in / zoom out / reset view buttons, a "True to size" chip and a rotate/zoom hint. Both tabs, AR, the GLB export and all test ids are unchanged. No new dependencies (`RoundedBoxGeometry` ships with three). The planner and photo mode share the model, so sofas there look the same.
- Phase 6: Playwright demo path (4 tests), responsive pass at 375 and 1440 px, README and DEMO docs.

## Tests
78 unit tests (incl. furniture-stays-within-measurements for every category) (units, geometry, matching, parsing, pickups state machine, AI sanitising/provider selection) and 7 e2e tests (HEIC fixture through room photo and give flow in Chromium; photo flow: auto placement, optional door refinement, save PNG; AR test checks the gated message, the dialog, that a real binary glTF is produced, and the desktop "open on your phone" hint).

## Known limitations / failures seen
- Anthropic provider untested against a live key. Mock and none paths tested.
- CoStar / Matterport not integrated (no docs/credentials). Null provider only.
- better-sqlite3 v13 segfaulted on Node 22.12 here; pinned to v11.
- Dev-only: R3F logs a deprecation warning for THREE.Clock (library-internal).
- Not tested on a physical phone; mobile checked via 375 px headless screenshots only. Touch drag uses the same pointer-event path as mouse.
- AR not yet tried on a physical phone. AR needs HTTPS, so phones can't use it against `http://<laptop-ip>:3000`; use a deployment or HTTPS tunnel. The AR e2e test needs internet (model-viewer comes from jsDelivr).
- HEIC/HEIF photos now work in every browser (converted on device with `heic-to` where not native). RAW camera files and TIFF (outside Safari) are still rejected with a clear message.
- Preview polish checks: `npm test` (84), typecheck, lint, build pass. E2E was run against `next build && next start` on port 3100 (a dev server was already running, and Next allows one dev server per folder): 6 of 7 pass, including both preview tests. The demo-path test fails there at `getByText(/asked for measurements/)` (strict-mode match on two elements: the owner panel and the notification list, which is always in the DOM). It fails the same way without the polish changes when the server is warm, so it is a timing race in the test, not a product regression; it was not re-run under the standard `npm run test:e2e` dev-server config.
- The new sofa has only been viewed in desktop and 390 px headless Chromium. AR on a real iPhone (Quick Look converts the GLB, including the cloth normal map, to USDZ on the device) and Android is still untested.

## Next priorities
1. Try the real AI provider with a key and tune the prompt on real photos.
2. Optional photos per listing > 1; real photography for seed data.
3. Reference spaces (CoStar/Matterport) if access is confirmed.
4. Deployment config (hosted DB, object storage).

## CoStar stages (2026-11-14)
- Done: importer, estimate-labelled picker, source snapshots, near-college filter, lazy Matterport tour selection, server-side Model API room dimensions with estimate fallback, and curated Rabinowitz Hall.
- Done: optional Atlas store with narrow documents, indexes, JSON fallback, load script, and post-hackathon collection-drop script.
- Tests: 90 unit tests and 12 e2e tests. Typecheck, lint, and e2e pass; the build is blocked by a Turbopack worker panic in this environment.
- Limitations: imported room sizes remain estimates unless Matterport returns positive dimensions; only Houston and Los Angeles are in the local kit; live ids could not be verified from this environment without private hackathon data/credentials. E2E uses synthetic ids and a stub.
- Next: optional Vultr deployment and DEV post, only if access and publication rules are confirmed.
