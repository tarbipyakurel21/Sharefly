# ShareFly

Giving something away should take seconds. Finding something you need should feel effortless.

ShareFly connects neighbors giving away things they no longer want with people who need them:

- **One-photo listings.** Upload a photo, get an editable title, category and description, publish. Free by default. If AI is unavailable you can still publish.
- **Wishlists with two-way matching.** Describe what you need in plain words. New listings search wishlists; new wishlists search listings. Every match shows plain-language reasons.
- **3D room planner.** Enter length, width and height; preview furniture in a scaled room (Three.js / React Three Fiber). Unknown sizes are labeled "Typical size, not confirmed" and fit is never claimed. Configured real-apartment picks can show a lazy Matterport tour and measured rooms.
- **RideBoard.** Lightweight pickup coordination: request help, drivers offer, requester accepts, either marks it done. No payments, no GPS.

Built at HackPrinceton (Fall 2026). The previous project in this repository, PatternWitness, is preserved in [`legacy/`](legacy/) and in git history.

## Run it

Requires Node 20.19+ (tested on 22.12).

```bash
npm install
cp .env.example .env.local      # DEMO_MODE=true shows the "switch person" menu
npm run db:seed                 # deterministic demo data (SQLite in data/)
npm run dev                     # http://localhost:3000
```

Other commands: `npm test` (unit), `npm run typecheck`, `npm run lint`, `npm run build`,
`npm run test:e2e` (Playwright; first run `npx playwright install chromium`), `npm run demo:reset` (wipe and reseed).

AI is optional. `AI_PROVIDER=none` (default) works for every flow. `AI_PROVIDER=mock` gives deterministic suggestions keyed on the
photo's file name, for demos and tests. `AI_PROVIDER=anthropic` with `ANTHROPIC_API_KEY` uses a real model (not verified against a live key in the build environment).

See [docs/DEMO.md](docs/DEMO.md) for the click-by-click judging script.

## How it is built

| Area | Choice |
|---|---|
| App | Next.js 16 (App Router), TypeScript strict, Tailwind CSS 4 |
| 3D | three, @react-three/fiber, @react-three/drei (OrbitControls, Line); procedural furniture |
| Data | SQLite via better-sqlite3, raw SQL, schema in `lib/db/schema.ts` |
| Validation | Zod on every API input, AI output and environment |
| Tests | Vitest (90 unit tests), Playwright (12 end-to-end tests including the demo and real-apartment paths) |

Logic lives in `lib/` as pure functions (`matching`, `room`, `pickups`, `units`, `ai`). Route handlers validate, authorize, call `lib/`, and return
`{ error: { code, message } }` with a person-readable message on failure. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/AUDIT.md](docs/AUDIT.md), [docs/DECISIONS.md](docs/DECISIONS.md).

## Honest limitations

- Authentication is a lightweight, passwordless sign-in (name + email) with a signed cookie. It is not production-grade; do not put real private data in it.
- Item photos in the seed data are locally stored Unsplash photographs; see [`public/seed/PHOTO_SOURCES.md`](public/seed/PHOTO_SOURCES.md) for sources and licensing.
- The Anthropic provider is implemented but was not exercised against a live key here. Mock and none paths are tested.
- Matching is a rule-based score with a fixed threshold; weights are guesses, not tuned on real data.
- Location is a neighborhood from a small static Princeton-area table, not geocoding.
- CoStar apartment data is used for "Start from a real apartment" (`lib/reference-spaces`, `scripts/import-costar.ts`). The kit stays local and gitignored; without it the feature is hidden. Room sizes from it are **estimates** unless the optional server-side Matterport Model API returns usable dimensions. Atlas support is optional and removable with `npm run atlas:drop -- --yes` after the hackathon.
- Teammates can run everything without private data: seed photos are committed in `public/seed/`, and the CoStar kit, `.env.local`, `data/` and the Matterport SDK bundle (`public/matterport-bundle/`, proprietary, local only) are gitignored. With `REFERENCE_SPACES_PROVIDER=none` and empty Matterport/Atlas keys, the app uses built-in demo spaces and a sq ft estimate; `cp .env.example .env.local && npm run db:seed && npm run dev` is enough.
- Rate limiting is in-memory and per process. Notifications refresh by polling every 25 s (no websockets).
- Uploaded photos are stored on local disk (`data/uploads`).

## Provenance and disclosures

- Code written during the event window with AI assistance (Claude Code). Verify repository creation date and event-written percentage from GitHub before submitting.
- Libraries: next, react, three, @react-three/fiber, @react-three/drei, zod, better-sqlite3, tailwindcss, vitest, @playwright/test, tsx (all permissively licensed). `@google/model-viewer` 4.4.0 (Apache-2.0) for "View in your room" AR, loaded at runtime from jsDelivr (its npm package pins three 0.183; we use 0.187). `heic-to` 1.6.7 (LGPL-3.0, bundles libheif) converts iPhone HEIC photos to JPEG in the browser; used unmodified and loaded as a separate chunk only when a HEIC file is chosen. Fonts DM Sans and Fraunces (SIL OFL) via `next/font/google`.
- The original seed-image generator remains available for fixture regeneration, but the checked-in demo assets are real photographs with sources recorded in `public/seed/PHOTO_SOURCES.md`.
