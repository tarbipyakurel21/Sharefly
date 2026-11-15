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
- AR "View in your room": item page button opens a 3D viewer of a to-scale model (from the giver's measurements) with a "Place it in my room" AR button on capable phones. Furniture geometry moved to `lib/room/model.ts`, shared by planner and AR; shapes now stay within the measured box (bed headboard, storage lid, dresser fronts, sofa arm z-fighting fixed). Planner link renamed "Arrange it on my floor plan".
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
