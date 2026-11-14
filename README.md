# HackPrinceton Fall 2026 — Prize-Aware Project Setup

Status: **idea selection pending; application development intentionally not started.**

This repository is the planning and compliance baseline for a HackPrinceton Fall 2026 project. The event is in person at Princeton, November 13–15, 2026, with a 36-hour build window. Teams may contain up to four members, and exactly one of the six HackPrinceton main tracks may be selected; sponsor tracks may be added when their independent requirements are met.

## Goals and judging

Build one useful, technically credible product with a strong two-minute demonstration. The official judging dimensions are creativity, utility, charity/social impact, and avidity/presentation quality. The project must be new work created in the permitted event window, use a public GitHub repository, and document libraries, attribution, and meaningful sponsor usage.

## Prize strategy

We will select exactly one main track and pursue only compatible sponsor opportunities. Current verified opportunities and their planning status are in [the prize matrix](docs/PRIZE_MATRIX.md). The strongest initial combination is one meaningful Gemini-powered workflow plus MongoDB Atlas or Tiger Data for durable/event data, with Vultr only if deployment improves the demo. SpaceXSI is a workflow/raffle opportunity, not a product integration.

## Technology strategy

Provider states are deliberately explicit: planned means researched but not configured; configured means credentials and local setup exist; implemented means real product code uses it; tested means validation evidence exists; verified means the submission evidence is complete. See [SPONSOR_APIS.md](docs/SPONSOR_APIS.md), [ARCHITECTURE.md](docs/ARCHITECTURE.md), and [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).

## Getting started

There is no application to run yet. Do not use placeholder commands as if they were functional. Once a project is approved, add its stack-specific prerequisites and commands here, create `.env` from `.env.example`, and keep credentials out of Git. Current planning documents can be reviewed with any Markdown viewer.

## Sponsor compliance

For every claimed integration, retain code references, configuration evidence, a reproducible demo path, test/validation output, and a short explanation of meaningful user value. An installed SDK or unused API key is not evidence of eligibility.

## Project status

- [x] Official source research started and conflicts recorded
- [x] Prize, API, architecture, idea, and submission planning documents created
- [ ] Organizer confirmation of unlisted sponsor tracks and final deadline
- [ ] Team selects one main track and sponsor strategy
- [ ] Product implementation begins after approval

See [AGENTS.md](AGENTS.md) for permanent repository rules.

