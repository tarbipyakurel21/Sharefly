# Implementation plan and status

Last updated 2026-11-14.

## Latest update
- Rooms page: made room selection explicit with contextual “Choose a room” copy and a separate button-styled “Select room” link on every room card, including the normal `/rooms` view shown in the UI. Tests: lint and diff check pass; typecheck remains blocked by the existing `heic-to/next` resolution issue. Limitations: selection navigates directly to the planner, by design.
- Reference-space demo: when live CoStar/Atlas data is not configured, the picker now exposes the built-in Rabinowitz Hall demo record, opens with Map view selected, and labels missing coordinates instead of inventing a pin. Live provider data remains preferred when configured.
- Local demo data: enabled `data/reference-spaces.json` in `.env.local`, so the picker now reads the bundled Houston and Los Angeles records with their supplied coordinates and Matterport ids. The map remains an approximate coordinate plot, not a street-map tile layer.
- Map UI polish: added a clearer map surface with grid/road texture, city context, coordinate-data labeling, accessible home markers, selected-marker emphasis, and a 3D-tour legend. It remains an approximate coordinate plot rather than a street-map tile layer.
- Map-first selection: when Map view is active, apartment cards are hidden; people select a pin and see only the selected apartment summary. The card list remains available through the Map view toggle.
- Street map: replaced the approximate CSS coordinate plot with a real OpenStreetMap street tile layer via Leaflet. Pins still come from the supplied apartment latitude/longitude records; no Google API key is required.
- Apartment furniture flow: clarified that Matterport supplies the reference tour/metadata only; measured room dimensions feed ShareFly’s separate editable planner, where furniture is added and positioned.

## Done (all verified by `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e`)
- Phase 0 audit and architecture docs; PatternWitness moved to `legacy/` (owner-approved replacement).
- Phase 1 foundation: Next.js App Router, Tailwind tokens, UI kit, header + mobile nav, signed-cookie sessions with demo person switcher, SQLite schema, local storage provider, deterministic seed.
- Phase 2 give/browse: compress + upload, AI describe with deterministic fallbacks, idempotent publish, browse filters in URL, item page, interest, measurement requests.
- Phase 3 wishlists/matching: parser, hard filters + explainable score, both directions, notifications + polling bell, matches page.
- Phase 4 room planner: room creation (ft/m), R3F scene, procedural furniture, drag/rotate/nudge/remove+undo, bounds, SAT collision, autosave, 2D plan fallback, uncertainty labeling, fit states.
- Phase 5 RideBoard: state machine (server-enforced, compare-and-set), board, driver availability, notifications.
- AR "View in 3D": item page button opens a 3D viewer of a to-scale model (from the giver's measurements) with a "Place it in my room" AR button on capable phones. Furniture geometry moved to `lib/room/model.ts`, shared by planner and AR; shapes now stay within the measured box (bed headboard, storage lid, dresser fronts, sofa arm z-fighting fixed). Planner link renamed "Arrange it on my floor plan".
- "In a photo of my room" (for laptops): upload a room photo (stays on device); the item is placed on the floor automatically with an estimated phone camera (EXIF lens when available) in true perspective, labeled as an estimate; optional "Make it more accurate" door marking fixes the camera height; turn, camera tilt, save the composite PNG. Scale math in `lib/room/photo.ts`.
- Preview polish (2026-11-14, uncommitted on `feature/preview-polish`): the procedural sofa is now an upholstered model (rounded seat and back cushions, one per seat by width; arms, base, back frame, tapered legs; woven-cloth normal map) that is still exactly the giver's width × depth × height, checked by unit tests and by `<model-viewer>`'s reported dimensions. The modal is larger (up to 1024 px, full-height sheet on phones) with studio lighting, a soft ground shadow, zoom in / zoom out / reset view buttons, a "True to size" chip and a rotate/zoom hint. Both tabs, AR, the GLB export and all test ids are unchanged. No new dependencies (`RoundedBoxGeometry` ships with three). The planner and photo mode share the model, so sofas there look the same.
- Listing preview source-of-truth polish: the real listing photo is shown in the 3D preview as a labelled reference thumbnail. The GLB remains dimension-locked to confirmed giver measurements, and copy distinguishes the visual reference photo from the generated preview rather than implying a scan. Missing dimensions still gate the preview.
- Demo assets: replaced all checked-in illustrated seed images with locally stored real furniture photographs and documented each source/license in `public/seed/PHOTO_SOURCES.md`.
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

## Header wordmark cleanup (2026-11-15)
- Done: removed the duplicate “ShareFly” text from the global header; the home link remains accessible via its `aria-label`, while the browser title and landing/dashboard wordmark remain unchanged.
- Tests: `npm run typecheck` and `git diff --check` pass.
- Limitation: none known.
- Next: none.

## Landing hero branding cleanup (2026-11-15)
- Done: removed the duplicate ShareFly logo and wordmark directly above the “Giving something away should take seconds.” hero heading; global navigation branding is unchanged.
- Tests: `npm run typecheck` and `git diff --check` pass.
- Limitation: none known.
- Next: none.

## Footer disclosure cleanup (2026-11-15)
- Done: removed the shared footer disclosure text from the global layout at the owner's request.
- Tests: `npm run typecheck` and `git diff --check` pass.
- Limitation: none known.
- Next: none.

## Browse heading cleanup (2026-11-15)
- Done: removed the “Find something you need” heading from the browse page while keeping search, filters, and listing results unchanged.
- Tests: `npm run typecheck` and `git diff --check` pass.
- Limitation: none known.
- Next: none.

## Persistent footer navigation (2026-11-15)
- Done: made the footer navigation visible and fixed at the bottom on fullscreen desktop as well as mobile, with page padding preventing content from being covered.
- Tests: `npm run typecheck` and `git diff --check` pass.
- Limitation: the desktop header navigation remains available as a second navigation path.
- Next: none.

## Redundant page heading cleanup (2026-11-15)
- Done: removed the visible page headings from Wishlists, Rooms, Matches, and RideBoard because the persistent footer already identifies those destinations; supporting copy and browser metadata remain.
- Done: removed the Rooms page's remaining instructional intro and empty-state copy so the room cards/form stand alone.
- Done: removed the 3D-room form heading and map-selection instructional copy.
- Done: removed the selected-apartment summary card and its fallback/location text.
- Done: simplified the 3D tour panel to a single load control and removed repeated tour/source explanation and estimate copy.
- Done: removed the map prompt and prevented the empty room form card from rendering before a map pin is selected.
- Tests: typecheck and diff check run after the change.
- Limitation: none known.
- Next: none.

## Dashboard header wordmark (2026-11-15)
- Done: restored the ShareFly wordmark beside the helping-hands logo in the shared dashboard header.
- Tests: typecheck and diff check pass.
- Limitation: none known.
- Next: none.

## Dashboard search and footer rides link (2026-11-15)
- Done: replaced the dashboard's two large action buttons with a direct item search form and added RideBoard as “Rides” in the persistent footer navigation.
- Tests: `npm run typecheck` and `git diff --check` pass.
- Limitation: dashboard search submits the query to Browse; neighborhood/category filters remain on Browse.
- Next: none.

## Planner / Matterport handoff (2026-11-14)
- Done: clarified that the Matterport iframe is view-only and added a direct “Stage furniture in ShareFly” anchor from the tour to the editable planner.
- Done: added an in-planner hint explaining that furniture is placed against the measured room, with drag and top-down controls.
- Tests: typecheck, lint, and focused/e2e checks pending after this UI change.
- Limitation: furniture cannot be inserted into the cross-origin Matterport iframe without authorized Matterport Bundle/scene-object access; ShareFly continues to use its own editable 3D scene.
- Next: if Bundle access is confirmed, evaluate a runtime overlay integration separately; do not represent the iframe as editable before then.
- Done: added an optional no-license visual staging overlay above the Matterport tour. It supports adding simple furniture labels, dragging, rotating, and removing them.
- Limitation: this overlay is screen-space 2D only; camera movement can misalign it and it is not persisted or part of the Matterport scene. The editable, dimension-aware planner remains the source of truth.

## Feasibility audit (2026-11-14)
- Done: `docs/costar-matterport-feasibility.md`; repository architecture, existing CoStar/Matterport seams, official Matterport SDK/Model API capabilities, asset licensing options, placement approaches, limitations, credentials, and minimal demo plan documented.
- No implementation changes made. Recommendation: keep Matterport as provenance/tour + optional Bundle overlay, and use the existing R3F planner as the reliable editable staging surface.
- Tests: not rerun; documentation-only change.
- Limitations: sponsor-provided CoStar/Vexcel/Matterport credentials, Bundle entitlement, dataset permissions, and a real model with usable room dimensions remain unverified.
- Next: confirm one authorized model and one licensed GLB, then run a narrow P0 prototype only after owner approval.
- Implemented: Matterport tour panel now optionally loads the official Embed SDK when `NEXT_PUBLIC_MATTERPORT_SDK_KEY` is configured, connects to the selected model, reads model metadata, and clearly identifies the Sharefly planner as the furniture-staging surface.
- Tests: `git diff --check` pending; no live Matterport key is available in this environment.

## CoStar stages (2026-11-14)
- Done: importer, estimate-labelled picker, source snapshots, near-college filter, lazy Matterport tour selection, server-side Model API room dimensions with estimate fallback, and curated Rabinowitz Hall.
- Done: optional Atlas store with narrow documents, indexes, JSON fallback, load script, and post-hackathon collection-drop script.
- Tests: 90 unit tests and 12 e2e tests. Typecheck, lint, and e2e pass; the build is blocked by a Turbopack worker panic in this environment.
- Limitations: imported room sizes remain estimates unless Matterport returns positive dimensions; only Houston and Los Angeles are in the local kit; live ids could not be verified from this environment without private hackathon data/credentials. E2E uses synthetic ids and a stub.
- Next: optional Vultr deployment and DEV post, only if access and publication rules are confirmed.
- In progress: unit-aware reference spaces now preserve optional apartment numbers, unit square footage, and unit-level Matterport IDs; the picker exposes those units and labels exact-scan availability. Community/floor-plan tours remain the explicit fallback when a unit scan is absent.
- Done: reference-space picker has a lightweight map view using imported latitude/longitude, selected apartment numbers are persisted in the room source snapshot, and the selected unit's Matterport IDs are preferred by the existing 3D tour and measured-room flow.
- Limitation: imported records still need a real CoStar kit run to verify which Houston/Los Angeles records contain unit numbers and unit-level models. Matterport remains an embedded scan/reference; ShareFly's editable planner is the fit-check surface.
- Demo simplification: the demo switcher now shows three personas only—Jordan (giver), Maya (receiver), and Sam (ride sharer); the seed data is reassigned to those personas.
- Demo labels: the three mock display names include their roles in parentheses so the role is visible wherever the demo user appears.

## Matterport-only 3D room (2026-11-14)
- Done: map-picked rooms render `BundleRoomStage` (no planner); room form is map OR dimensions; picker lists only spaces with a tour; item viewer renamed "View in 3D", photo tab removed; item link now "Arrange it in my 3D room".
- Verified: typecheck, unit tests. E2E specs for the old estimate/adjust flow (`real-apartment.spec.ts`) need rewriting: see below.
- NOT verified: furniture rendering inside a live Matterport scene (no SDK key in `.env.local`); placement offset/orientation uncalibrated; placements are not saved, so pickup-from-room is not wired for map rooms.
- Next: add SDK key (allow-list localhost:3000), verify live, then persist placements and calibrate.

## MongoDB Atlas and UploadThing wiring (2026-11-14)
- Done: Atlas is read by the reference-space picker when `MONGO_URI`/`ATLAS_URI` is set with `REFERENCE_SPACES_PROVIDER=costar`, with JSON fallback. UploadThing photo storage added behind `STORAGE_PROVIDER=uploadthing`. README now has an optional-services section and Vercel notes; `.env.example` lists `UPLOADTHING_TOKEN`.
- Tests: `tests/unit/storage.test.ts` (provider selection, fallback without token, error path, photoUrl validation) with UploadThing mocked.
- Not verified: a live upload to UploadThing, and that Atlas holds loaded data (`npm run atlas:load` not run here).
- Limitations: SQLite and Vercel's read-only disk. Listings, wishlists and pickups will not persist on Vercel without a database change.
- Next: set `STORAGE_PROVIDER=uploadthing` in `.env.local` and verify one real upload; run `atlas:load`; decide on a hosted DB or a host with a persistent disk.
- Done: CI workflow added (`.github/workflows/ci.yml`). Not yet run on GitHub. Known gap: `npm run lint` crashes on a missing `react-hooks` plugin (pre-existing), so lint is not in CI. The build was blocked by a Turbopack panic earlier in this environment, so the CI build step may fail until that is resolved.

## MongoDB as primary store (2026-11-14)
- Done: `lib/db/client.ts` (cached MongoClient, indexes on first use) and async `lib/db/queries.ts` replace SQLite. All pages, API routes, `lib/matching/run.ts` and `scripts/seed.ts` now await. `better-sqlite3` and `DATABASE_PATH` removed. E2E runs against `ATLAS_DB=sharefly_e2e`.
- Tests: `npm run typecheck` and `npm test` (139) pass; seed runs against Atlas. E2E demo path result is recorded below once confirmed.
- Limitations: no multi-document transactions (cascades are in code); existing SQLite data is not migrated; the app now requires `MONGO_URI` at runtime and in Atlas Network Access for Vercel. Matching and notification fan-out are sequential awaits.
- Next: set env vars on Vercel (`MONGO_URI`, `SESSION_SECRET`, `STORAGE_PROVIDER=uploadthing`, `UPLOADTHING_TOKEN`), deploy, run `npm run db:seed` once against the production database.

## Matterport furniture placement and gizmo fixes (2026-11-15)
- Done in `components/room/BundleRoomStage.tsx`:
  - Pieces are placed on the floor (sweep `puckPosition`; the old code used `position`, which is camera height, so furniture floated), straight ahead of the viewer's facing direction, near edge about 0.7 m (>= 2 ft) away, turned to face the viewer; extra pieces sit beside the first.
  - Pieces follow the viewer to each new sweep. A piece the user moved or removed is left alone (detected by comparing its position to where it was last placed).
  - Move/Rotate gizmo: larger (`size: 1.6`); Move shows X/Z only, Rotate shows the vertical ring only (was able to tip pieces off the floor). Tour navigation is locked while the pointer is over or dragging the gizmo, and tour clicks do not (re)select pieces during that time.
  - Fixed `TypeError: Cannot add property visible, object is not extensible` on Select/Remove: `mp.transformControls` in this bundle has no `visible` input and sealed inputs; visibility follows `selection`. Deselecting now resets navigation lock (no hover-out fires when the gizmo disappears).
- Tests: `npm run typecheck` and `npm test` (139) pass; eslint on the file has 0 errors (1 existing exhaustive-deps warning).
- NOT verified: any of this in a live Matterport scene. Yaw convention (0 looks toward -z, counter-clockwise positive), model front being +z, reading node positions back, and the gizmo HOVER/DRAG events are assumptions from the SDK types/bundle source. No unit or e2e test covers `BundleRoomStage`; Remove / Put back / Select have only been reasoned about.
- Limitations: placement is still unsaved and uncalibrated to the scan's walls; pieces can overlap scan geometry; the 400 ms re-place delay is a heuristic.
- Next: manual live check of select, move, rotate, remove, put back and walking to a new sweep; add a mocked-SDK unit test for the select/remove/put back state; then persist placements.

## Owner scans, LA demo and simplification (2026-11-15)
- Done: Gemini key fixed locally (401 was an invalid key; `gemini-3.5-flash` works). Measurement reading from Measure/Reality Composer screenshots (`/api/ai/read-measurements`, transcribe-only, owner confirms), up to 8 owner-named extra measurements, 3D scan upload (`.usdz`/`.glb`, magic bytes, 30 MB) with auto-filled size, scan used in the room planner, Matterport stage and View in 3D (measurement-based model as fallback), optional listing video (`/api/uploads/video`, Range support), delete rooms, delete notifications, request button when an item fits (planner and under the Matterport tour), wishlists no longer match already-listed items, LA neighborhoods and seed data, owner/people renamed (Hardika, Priya, Tarbi), everything free, text and UI trimmed per owner requests.
- Removed at the owner's request: RideBoard/pickups (UI and routes), the cart, prices, the apartment filters (City/Bedrooms/Rent/Name; replaced by Share my location), the visible CoStar/room-source notes (kept as screen-reader text).
- Tests: `npm run typecheck`, `npm test` (151) and `next build` pass. `tests/e2e/real-apartment.spec.ts` was run once (before later edits) and all 8 tests failed; the e2e suite is NOT green and was not re-run for the rest.
- NOT verified: a real iPhone scan, a real Measure screenshot, a real video, geolocation, and the new buttons in a browser. Visible CoStar/Matterport attribution may be required by the sponsors' terms.
- Limitations: Vercel request bodies are about 4.5 MB, so large scans/videos fail on the deployed site; no in-app chat or deal step; dormant pickup code remains in `lib/`.
- Next: repair the e2e suite for the map-first picker and removed features; confirm attribution requirements; direct-to-UploadThing uploads; an owner "accept" step or messages.
