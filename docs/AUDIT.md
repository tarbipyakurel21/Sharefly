# Audit (Phase 0)

## Finding
The repository did **not** contain ShareFly. It contained **PatternWitness**, a scam-campaign review
dashboard (FastAPI + Vite/React + MongoDB/SQLite + Cytoscape), built for the same event.
The owner explicitly chose to **replace PatternWitness with ShareFly in this repository** (option 3).

## Stack as found
| Area | Found |
|---|---|
| Frontend | Vite 7, React 19, Tailwind 4, Cytoscape. Single `App.tsx` + 6 components. |
| Backend | Python FastAPI, networkx, pymongo, SQLite fallback. |
| Auth | None. |
| AI | None (a deterministic "assistant" template module). |
| Tests | 34 pytest tests passing (4 skipped). Frontend build passes. |
| Docs | 13 PatternWitness docs, AGENTS.md written for PatternWitness. |

## Feature inventory
All PatternWitness features (CSV upload, rule detection, graph, review, report) were **working**.
None map onto ShareFly (listings, wishlists, rooms, pickups).

## Keep / adapt / replace
| Module | Verdict | Reason |
|---|---|---|
| Tailwind 4 + React 19 toolchain | Adapt | Moved into Next.js. |
| Python backend, Cytoscape UI, CSV parser | Replace | Different product. Preserved in `legacy/` and git history. |
| PatternWitness docs, README | Replace | Preserved in `legacy/docs`, `legacy/README.md`. |
| AGENTS.md | Adapt | Product section rewritten; privacy, provenance and honesty rules kept. |

## Data
No user data. The SQLite file under `backend/data/` was git-ignored runtime output.

## Risks
- better-sqlite3 v13 segfaults on Node 22.12 here; v11 works (see DECISIONS).
- React Three Fiber 9 requires React 19, which matches.
- No CoStar/Matterport credentials or docs are in the repo.
