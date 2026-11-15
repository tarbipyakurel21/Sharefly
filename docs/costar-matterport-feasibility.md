# CoStar + Matterport feasibility audit

Date: 2026-11-14  
Scope: exploration only; no product integration was added by this audit.

## Executive conclusion

Sharefly already has the best low-risk foundation for the demo: a Next.js app with a Three.js/React Three Fiber room planner, measured dimensions, collision/bounds logic, saved placements, AR export, CoStar reference-space records, lazy Matterport embeds, and a server-only Matterport Model API client with estimate fallback.

The recommended prototype is a **two-pane experience**:

1. Use the Matterport tour as the provenance/exploration pane, with room selection and measured dimensions where available.
2. Use Sharefly's existing React Three Fiber planner as the editable staging pane, with one or two real/licensed GLB furniture assets and the existing placement/collision/save logic.

This is more reliable than trying to turn every Matterport scan into an editable CAD scene. Matterport's Bundle SDK can add GLTF scene objects with position/rotation/scale, but this is a runtime overlay and is distinct from editing or exporting the scan. The Model API documentation explicitly says the API cannot manipulate a model's 3D mesh.

## 1. Current Sharefly architecture

- **Frontend:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4.
- **Backend:** route handlers under `app/api`, Zod validation, SQLite through `better-sqlite3`, local uploads and signed-cookie sessions.
- **3D:** Three.js 0.187, React Three Fiber, Drei. Furniture is currently procedural and measured in real meters.
- **Room model:** rooms store length, width, height, display units, optional source snapshot, and saved placements. Placement uses room bounds, rotated footprint checks, SAT collision, drag/rotate/nudge/remove/undo, autosave, and a 2D fallback.
- **Listing model:** furniture listings have category, optional user-entered dimensions, condition/description fields, provenance text, and image upload. Unknown values remain unknown; the UI does not claim a fit without confirmed dimensions.
- **AI:** optional `none`, deterministic `mock`, Anthropic, and Gemini providers. Providers have timeout/schema/fallback paths. AI is not required for the demo.
- **CoStar reference spaces:** the local hackathon kit is transformed into compact floor-plan records. The dataset is intentionally gitignored. A JSON provider and optional Atlas provider are available.
- **Matterport today:** `lib/matterport/tour.ts` creates a public `my.matterport.com/show/?m=...` URL; `components/room/TourPanel.tsx` lazily embeds candidate community/floor-plan/unit tours. `lib/matterport/model-api.ts` calls the server-side GraphQL Model API for room `dimensionEstimates`; unusable/unavailable results fall back to a clearly labelled CoStar square-footage estimate.

Important existing files: `components/room/RoomCanvas.tsx`, `components/room/Furniture.tsx`, `lib/room/model.ts`, `lib/room/geometry.ts`, `lib/db/queries.ts`, `lib/reference-spaces/*`, `lib/matterport/{tour,model-api,resolve,dimensions}.ts`, `components/room/TourPanel.tsx`, and `app/api/rooms/*`.

## 2. What Matterport actually supports

### Confirmed

- **Embedding and controls:** The Showcase Embed SDK connects to an iframe, exposes actions/events, and exposes model metadata through `Model.getData()`/`getDetails()`. An SDK key and allowed domains are required. See [Matterport Embed SDK](https://developers.matterport.com/embed-sdk/) and [SDK overview](https://developers.matterport.com/overview/).
- **Room measurements:** The Model API can query room/floor/model `dimensionEstimates` including area, width, depth, height, units, and measurement metadata. Property Intelligence dimension data is Enterprise-only and values can be null/zero for irregular or unrefined rooms. See [Dimension Estimates](https://developers.matterport.com/api/property-intelligence/dimensions/).
- **Spatial/model data:** The Model API can query metadata, images, videos, panoramas, position points, tags, and purchased assets. MatterPak can include an OBJ/MTL mesh, point cloud, reflected-ceiling image, and photogrammetry floor plan; availability and ordering depend on account/add-ons. See [Model API overview](https://developers.matterport.com/api/model/overview/) and [add-ons](https://developers.matterport.com/api/model/ordering-addons/).
- **Runtime furniture overlays:** The Bundle SDK's Scene Framework can create scene objects, load GLTF, and transform nodes through position/quaternion/scale. Scene objects can be serialized/deserialized. The official examples include GLTF loading and a [Virtual Staging example](https://developers.matterport.com/tutorials/scene-objects/). Scene APIs are Bundle-only; they are not available in the ordinary Embed SDK. See [Scene reference](https://developers.matterport.com/reference/scene/).
- **Coordinate caveat:** Showcase SDK coordinates and MatterPak/API coordinates differ. Matterport documents a conversion and notes MatterPak uses Z-up. Do not assume Three.js coordinates match without a calibration test. See [Matterport API overview and coordinate notes](https://developers.matterport.com/api/).

### Requires access, purchase, or confirmation

- Private model embedding/OAuth requires higher-level access and a commercial partnership path; public visibility is the practical route for a hackathon. See [OAuth overview](https://developers.matterport.com/oauth/).
- Dimension estimates require Enterprise-level Property Intelligence access.
- OBJ/point cloud/floor-plan export may require the corresponding purchased/unlocked add-on; a public tour URL does not imply export permission.
- Bundle SDK availability, production licensing, model ownership, and the HackPrinceton dataset's permitted use must be confirmed by the sponsor. The repo does not contain the SDK key, API token, token secret, or a verified production entitlement.

### Not supported or unsafe to claim

- A public tour URL does **not** grant editable geometry, mesh download, or room-level authoring rights.
- The Model API cannot manipulate the scanned mesh; it can read/set model details, assets, tags, labels, and bundles. Existing scan furniture cannot be reliably separated from walls/structural geometry through the currently documented API.
- Embed SDK Mattertags/overlays are session-scoped unless the app separately persists its own arrangement. They are not a durable furniture catalog or object-placement database.
- Occlusion, collision, semantic furniture classification, and physically correct placement should not be promised without testing a specific Bundle model and asset.

## 3. Furniture assets and licensing

| Source | Useful output | Recommendation |
|---|---|---|
| Poly Haven | GLB/glTF-style assets, images/textures, CC0 | Best low-risk source for generic high-quality furniture; [license](https://polyhaven.com/license) says assets are CC0. |
| Sketchfab | Product-like models and viewer/download APIs | Viable only per asset: record author, URL, license, attribution, and whether commercial/promotional use is allowed. Editorial assets are unsuitable; see [license](https://sketchfab.com/licenses) and [download guidelines](https://sketchfab.com/developers/download-api/guidelines). |
| Wayfair | Realtime 3D model API and product metadata, where access remains available | Potentially strong for real products, but access, endpoint status, branding, and redistribution terms need sponsor/vendor confirmation; do not scrape. See [Wayfair Realtime 3D Model API](https://www.aboutwayfair.com/realtime-models). |
| IKEA | Product photos and some web 3D viewers | Do not extract or redistribute models/images from the consumer site for the app without written permission. Use product links/photos only under permitted terms, or obtain a partner feed. |
| Khronos glTF samples | Format/testing fixtures | Useful for pipeline tests, not a real-product catalog. Confirm the individual sample's license in the source repository. |

For the hackathon, ship one or two local, compressed GLBs from CC0 or explicitly permitted sources, with a small manifest containing source URL, author, license, dimensions, and checksum. Keep product identity separate from geometry: a generic “sofa-like model” must not be presented as an IKEA/Wayfair product.

## 4. Three placement approaches

| Approach | Difficulty | Realism | Dependencies | Reliability | CoStar relevance |
|---|---|---|---|---|---|
| A. Matterport native/Bundle overlay | High | High for the scan, medium for overlay alignment | SDK key, Bundle SDK entitlement, public/authorized model, coordinate calibration | Medium; vendor/account dependent | High |
| B. Sharefly Three.js/R3F scene | Medium | Medium-high with good GLBs | Existing stack plus local assets | High; deterministic and testable | Medium-high when dimensions/model IDs come from Matterport/CoStar |
| C. 2D photo placement | Low-medium | Convincing in one image, weak spatial truth | Existing photo placer and image assets | High for a constrained demo | Low unless photo is linked to a reference space |

Approach A is technically feasible for a tightly controlled model, but it should be a stretch goal. Approach B is the recommended core because Sharefly already has the hard interaction work. Approach C is a strong fallback/demo flourish, not a substitute for a spatial room plan.

## 5. Agentic CoStar/Matterport concept

The useful agent is a constrained planner, not a chat wrapper:

1. Read CoStar reference-space metadata and the chosen Matterport model/room dimensions.
2. Normalize the user's request and candidate listing dimensions.
3. Filter candidates by confirmed dimensions, room bounds, clearance rules, and collision checks.
4. Produce a ranked arrangement with explicit reasons and uncertainty labels.
5. Execute only typed tools: `get_reference_space`, `get_measured_rooms`, `list_candidates`, `validate_placement`, and `save_placements`.
6. Return a plan plus a reproducible audit trail. If dimensions or model access are missing, ask for measurements or use the current labelled estimate path.

Vexcel should be an optional third evidence layer only after sponsor credentials/API terms are supplied. A defensible initial use would be property context/visual verification, not indoor geometry. Do not claim Vexcel integration from the existence of the sponsor layer alone.

## 6. Recommended minimal demo

1. Select a CoStar reference apartment or Rabinowitz Hall record.
2. Open the lazy Matterport tour in one panel.
3. Select a room with usable Matterport dimensions; otherwise edit the CoStar estimate.
4. Choose a listing with confirmed dimensions and a licensed GLB/thumbnail.
5. Open the existing R3F planner, drag/rotate the asset, show bounds/collision feedback, and save.
6. Display the source chain: CoStar property/floor-plan metadata, Matterport model ID/tour, room dimension status, furniture source/license, and “overlay is Sharefly-rendered” disclosure.
7. Continue the existing demo path to match and pickup request.

This is achievable without rewriting the application and remains functional if Matterport API credentials fail: the room estimate and local planner still work.

## 7. Exact implementation surface after feasibility approval

- Add a typed asset manifest near `lib/room/` and a small server route/catalog adapter for approved GLBs and metadata.
- Extend `components/room/Furniture.tsx` or add a sibling GLTF furniture component; keep procedural models as fallback.
- Reuse `RoomCanvas.tsx`, `lib/room/geometry.ts`, placement APIs, and `lib/db/queries.ts`; do not duplicate collision or persistence logic.
- Add a Matterport SDK client component only after SDK key/Bundle entitlement is confirmed. Keep keys public/client-safe only where Matterport documents them; keep Model API token/secret server-side.
- Add a placement provenance snapshot to the room/placement schema if Matterport overlay coordinates are persisted.
- Add Zod schemas, timeout/fallback behavior, tests for coordinate conversion and asset metadata, and one Playwright path.
- Update `.env.example`, `docs/IMPLEMENTATION_PLAN.md`, `docs/DECISIONS.md`, and README provenance/licensing disclosures.

## 8. Credentials and sponsor confirmations needed

- CoStar kit access rules, permitted fields, and whether demo-time API/MCP/OpenAPI access exists beyond the local kit.
- Matterport SDK application key with localhost allow-list; Bundle SDK availability/license; Model API Token ID/Token Secret; Enterprise Property Intelligence entitlement; permission to embed/use each supplied model; and whether MatterPaks/floor plans are unlocked.
- Vexcel API/base URL, credential type, rate limits, allowed demo use, and exact fields/imagery the challenge permits.
- Approved furniture asset URLs/licenses or a vendor-provided product feed.

## 9. Prioritized checklist

### P0 — reliable demo

- [ ] Confirm one public/authorized Matterport model and one room with non-zero dimensions.
- [ ] Run the existing Model API query against that model and record the actual room label/units.
- [ ] Select two licensed GLBs, normalize their origin/up-axis/scale, and record dimensions.
- [ ] Render them in existing R3F planner; preserve fallback procedural furniture.
- [ ] Show source/license/uncertainty labels and test the full wishlist → room → listing → match → placement → pickup path.

### P1 — sponsor depth

- [ ] Add Bundle SDK runtime overlay for one controlled model.
- [ ] Calibrate SDK/API coordinate conversion against a known room corner.
- [ ] Add an agent tool loop with server-side validation and placement audit trail.
- [ ] Add Vexcel only if credentials and allowed fields are confirmed.

### P2 — only if time remains

- [ ] Persist/reload Bundle scene serialization.
- [ ] Purchase/consume MatterPak or schematic floor-plan add-on.
- [ ] Add richer product catalog and photo/GLB pairing.

## Sources

- [Matterport SDK overview](https://developers.matterport.com/overview/)
- [Matterport Embed SDK](https://developers.matterport.com/embed-sdk/)
- [Matterport Model API](https://developers.matterport.com/api/model/overview/)
- [Matterport dimension estimates](https://developers.matterport.com/api/property-intelligence/dimensions/)
- [Matterport add-ons](https://developers.matterport.com/api/model/ordering-addons/)
- [Matterport coordinate/API limitations](https://developers.matterport.com/api/)
- [Matterport Bundle scene objects](https://developers.matterport.com/tutorials/scene-objects/)
- [Poly Haven license](https://polyhaven.com/license)
- [Sketchfab licensing](https://sketchfab.com/licenses)
- [Wayfair Realtime 3D Model API](https://www.aboutwayfair.com/realtime-models)
