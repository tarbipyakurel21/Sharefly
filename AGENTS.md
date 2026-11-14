# Agent instructions

## Product mission and boundaries

PatternWitness helps university security analysts review potentially coordinated scam/phishing message campaigns. It is a lead-generation and evidence-review tool, not a fraud classifier, attribution system, or criminal-investigation verdict engine. The bundled dataset is synthetic.

## Repository map and local commands

- `backend/app/`: FastAPI routes, parsing, detection, graph construction, reports, and storage adapters.
- `backend/tests/`: parser, detector, API, and storage contract tests.
- `frontend/src/`: React/Vite dashboard and API client.
- `docs/`: architecture, prize, audit, demo, validation, and submission records.

Backend: `cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000`.
Frontend: `cd frontend && npm install && npm run dev`.
Tests: `cd backend && pytest -q`; build: `cd frontend && npm run build`.

## Engineering conventions

Read this file and inspect the existing implementation before editing. Prefer focused, reversible changes. Keep detection separate from interpretation. Preserve stable cluster keys and API contracts unless a migration is documented. Use TypeScript types for API payloads and Python type hints for backend logic.

## Data, agents, and provenance

Every finding must retain the rule, supporting message IDs, and limitations. Never present deterministic templates or an unavailable model as live agent execution. Any future provider adapter needs timeout, validation, graceful fallback, tests, and an `.env.example` entry. Never commit secrets or private data.

## Privacy and security

Defang links in rendered evidence, validate uploads, respect size/row limits, redact credentials from errors, and do not add authentication bypasses. Use only synthetic or appropriately licensed data.

## Definition of done

A feature is done only when it works end to end, has focused tests or documented validation, has honest limitations, supports a two-minute demo, and updates the relevant docs and prize evidence. Do not claim sponsor eligibility, benchmarks, deployment, interviews, or performance gains without proof.

## Hackathon and attribution record

The event window is Nov 13–15, 2026 with a safe internal cutoff of Nov 15 8:00 AM ET; exactly one main track may be selected. Verify repository creation date and event-written percentage from GitHub/event records. Record reused libraries, third-party assets/licenses, and AI-generated code disclosures in project documentation. Do not rewrite history or force-push.

## Demo-critical functionality and limitations

The critical path is load synthetic data → inspect signal comparison → open cluster graph/evidence → save review → export report. Known limitations are prototype-scale pairwise comparisons, possible false positives from legitimate shared links, no authentication, and no verified external LLM/agent integration.

1. Before proposing or implementing a major feature, inspect `docs/PRIZE_MATRIX.md`, `docs/HACKPRINCETON_TRACKS.md`, and `docs/SPONSOR_APIS.md`. Decide whether it improves legitimate eligibility; never add technology only for superficial eligibility.
2. Prioritize a real problem, working end-to-end functionality, reliability, user experience, meaningful sponsor integrations, then documentation and polish.
3. Every claimed sponsor integration needs actual code usage, meaningful purpose, reproducible demonstration, access/credentials, tests or validation evidence, and documentation.
4. Update the prize matrix after major features. Use only: Not applicable, Potentially eligible, Integration planned, Implemented, Verified, Submitted. Never mark Verified without evidence.
5. Never hardcode secrets. Use `.env.example`, validate external inputs, respect rate limits, use synthetic or licensed data, and protect private information.
6. Record repository creation date, event-written code, reused libraries, third-party assets, attribution/licenses, and AI-generated code disclosures. Do not disguise old code as new work.
7. Every major feature must support a compelling two-minute demo showing problem, user, solution, innovation, working functionality, and measurable benefit.
8. Prefer a smaller reliable prototype over unrelated sponsor integrations.
9. After each major task update `docs/IMPLEMENTATION_PLAN.md` with completed work, tests, failures, limitations, and next priorities.
10. Never fabricate benchmarks, interviews, API functionality, deployments, eligibility, or performance gains.

