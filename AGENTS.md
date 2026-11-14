# Agent instructions

## Product

ShareFly connects people giving away items with people who need them: one-photo AI-assisted listings, wishlists with two-way matching,
a 3D room planner, and RideBoard pickup coordination. It is a hackathon MVP. (The earlier PatternWitness project lives in `legacy/`.)

## Repository map and commands

- `app/` Next.js App Router pages and `app/api/*` route handlers. `components/` UI. `lib/` pure logic (`matching`, `room`, `pickups`, `units`, `ai`, `db`).
- `scripts/` seed and seed-image generation. `tests/unit` (Vitest), `tests/e2e` (Playwright). `docs/` audit, architecture, decisions, demo, plan.
- `npm install`, `cp .env.example .env.local`, `npm run db:seed`, `npm run dev`. Checks: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e`.

## Rules

- Read the existing code before editing. Prefer focused, reversible changes. Do not rewrite history or force-push.
- Never invent facts about an item (condition, brand, measurements). Unknown is `null` and shown as "not provided". Never show "fits" for unconfirmed sizes.
- Never present deterministic templates or the mock provider as live AI. Any AI call needs timeout, schema validation, fallback, tests and an `.env.example` entry.
- Every API input is validated with Zod; errors are `{ error: { code, message } }` with human wording. Secrets stay server-side; never commit them.
- Photos: validate by magic bytes, cap size. Locations are neighborhoods only, never street addresses.
- Do not claim sponsor eligibility, benchmarks, deployments or integrations without code and proof. CoStar/Matterport stay behind `lib/reference-spaces` until access is confirmed.
- After each major task update `docs/IMPLEMENTATION_PLAN.md` (done, tests, failures, limitations, next). Record decisions in `docs/DECISIONS.md`.
- Demo-critical path: wishlist + room -> photo listing -> match -> preview in room -> pickup request. Keep `npm run test:e2e` green.
- Record reused libraries, assets/licenses and AI-generated code disclosures in the README.
