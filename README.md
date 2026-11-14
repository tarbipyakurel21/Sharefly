# PatternWitness

A cybersecurity investigation dashboard that helps university security teams spot
**potentially coordinated** scam campaigns aimed at students (fake job offers,
phishing), instead of reviewing each reported message in isolation.

Built for HackPrinceton 2026.

> **Suspicious is not confirmed.** PatternWitness flags patterns for a human
> analyst to review. It never labels a message, account or person as fraudulent.
> All bundled data is synthetic: the accounts, messages and `.example` domains
> are invented and do not describe real people or events.

## What works today

- Upload a CSV of messages; the API validates it and reports rejected rows with reasons.
- Investigations, messages, detected clusters, evidence records and analyst reviews are
  persisted in MongoDB Atlas when configured, with local SQLite as the automatic fallback.
- Messages are analysed with explainable rules.
- A NetworkX graph links accounts, messages and shared links, shown with Cytoscape.js.
- Flagged clusters get a transparent 0-100 suspicion score and an evidence panel
  listing each rule that fired, the messages behind it, and what is *not* established.
- Analysts can record a review per cluster (needs review, escalated, dismissed as
  likely benign) with a note, compare the wording of the closest message pair side
  by side, and download a Markdown evidence report. There is deliberately no
  "confirmed fraud" state.
- A synthetic 30-message demo dataset (two campaign-like patterns, one weak pattern,
  one legitimate shared link, and ordinary campus messages).

## Requirements

- Python 3.10 or newer
- Node.js 20.19 or newer (with npm)

## Run it locally

Use two terminals, both starting from the repository root.

**Terminal 1: backend (http://127.0.0.1:8000)**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Terminal 2: frontend (http://localhost:5173)**

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and click **Load demo data**, or upload
`backend/sample_data/sample_messages.csv`. Interactive API docs are at
http://127.0.0.1:8000/docs.

## Storage: MongoDB Atlas with SQLite fallback

With no configuration the app uses a local SQLite file, so the demo always runs.
To use MongoDB Atlas:

1. In Atlas, create a free cluster, a database user, and allow your IP address
   under Network Access.
2. Copy the example file and put your connection string in it:

   ```bash
   cd backend
   cp .env.example .env
   # edit .env and set MONGODB_URI=mongodb+srv://...
   ```

   `backend/.env` is ignored by git. Do not commit it or share its contents.
3. Check the connection, then restart the backend:

   ```bash
   python -m app.check_storage     # prints "Active storage backend: mongodb"
   ```

The dashboard header and `GET /api/health` show which backend is active. If Atlas
is unreachable in `auto` mode, the app logs a warning and uses SQLite; set
`STORAGE_BACKEND=mongodb` to make that a startup error instead.

| Collection       | One document per                         | Indexes                                                         |
| ---------------- | ---------------------------------------- | --------------------------------------------------------------- |
| `investigations` | uploaded dataset                         | `uploaded_at`                                                   |
| `messages`       | message                                  | unique `(investigation_id, message_id)`; `(investigation_id, timestamp)`; `(investigation_id, sender_id)`; `urls` |
| `clusters`       | detected cluster (snapshot at upload)    | unique `(investigation_id, key)`; `(investigation_id, score)`   |
| `evidence`       | rule that fired in a cluster             | `(investigation_id, cluster_key)`; `rule`                       |
| `reviews`        | analyst review of a cluster              | unique `(investigation_id, cluster_key)`                        |

Data is not copied between backends: datasets uploaded while on SQLite stay in SQLite.

## Tests

```bash
cd backend
source .venv/bin/activate
pytest
```

`tests/test_detection.py` covers the detection rules, `tests/test_csv_parser.py`
the CSV validation, `tests/test_api.py` the HTTP endpoints, and
`tests/test_storage.py` the persistence contract. The storage tests run against
SQLite and an in-memory MongoDB double (`mongomock`). To also run them against a
real Atlas cluster (in a throwaway database that is dropped afterwards):

```bash
PATTERNWITNESS_TEST_MONGODB_URI="$(grep '^MONGODB_URI=' .env | cut -d= -f2-)" pytest tests/test_storage.py
```

## CSV format

| Column         | Required | Notes                                                    |
| -------------- | -------- | -------------------------------------------------------- |
| `message_id`   | yes      | Unique per file                                          |
| `sender_id`    | yes      | Account identifier                                       |
| `timestamp`    | yes      | ISO 8601, e.g. `2026-11-09T14:02:00Z` (no zone = UTC)    |
| `message_text` | yes      | Links inside the text are extracted automatically        |
| `urls`         | no       | Extra links, separated by `;`                            |

Limits: 5 MB and 5,000 rows per file. Rows that fail validation are skipped and listed in the upload report.

## How a cluster gets flagged

Two messages are linked only if they come from **different accounts** and:

| Rule             | Condition                                                        | Points          |
| ---------------- | ---------------------------------------------------------------- | --------------- |
| Shared link      | Same normalised URL (host + path)                                | 30, +10 per extra link (max 40) |
| Similar wording  | Word-set Jaccard similarity of at least 0.6                      | 30, +5 if average is 0.8 or more |
| Close timing     | An already-linked pair was sent within 60 minutes                | 20              |
| Several accounts | Three or more accounts in the cluster                            | 10              |

Linked messages form connected components; each component is one cluster.
Score 70+ is "high", 40-69 "medium", below 40 "low". Timing alone never links
messages. Thresholds live in `backend/app/config.py`.

Known limits: the rules cannot tell a scam link from a genuine campus link
(the demo data includes a legitimate shared link that is flagged "low" on
purpose), and pairwise text comparison is meant for prototype-sized files.

## Project structure

```
backend/
  app/
    main.py           FastAPI routes
    csv_parser.py     CSV parsing and validation
    detection.py      Rule-based coordination detector
    graph_builder.py  NetworkX account/message/link graph
    analysis.py       Pipeline: detect -> graph -> summary
    assistant.py      Pluggable summary interface (LLM hook, no API key needed)
    report.py         Markdown evidence report for a cluster
    storage/          Storage interface, SQLite and MongoDB Atlas backends
    check_storage.py  Prints the active storage backend
    config.py         Thresholds and paths
  sample_data/sample_messages.csv
  tests/
frontend/
  src/
    App.tsx           Dashboard layout and state
    api.ts            Backend client
    components/       GraphView, ClusterList, EvidencePanel, ReviewForm,
                      WordingCompare, MessageTable, UploadZone
```

## API

| Method | Path                           | Purpose                                 |
| ------ | ------------------------------ | --------------------------------------- |
| GET    | `/api/health`                  | Liveness check and active storage backend |
| POST   | `/api/datasets`                | Upload a CSV (multipart field `file`)   |
| POST   | `/api/datasets/sample`         | Load the bundled synthetic dataset      |
| GET    | `/api/datasets`                | List stored datasets                    |
| GET    | `/api/datasets/{id}/analysis`  | Stats, clusters, graph and messages     |
| GET    | `/api/datasets/{id}/clusters`  | Stored clusters and evidence records    |
| PUT    | `/api/datasets/{id}/clusters/{key}/review` | Save an analyst review (`status`, `note`) |
| GET    | `/api/datasets/{id}/clusters/{key}/report` | Download a Markdown evidence report |
| GET    | `/api/sample-csv`              | Download the sample CSV                 |

## Adding an LLM later

`backend/app/assistant.py` defines an `InvestigationAssistant` protocol with one
method, `summarize_cluster(cluster, messages)`. The default `TemplateAssistant`
is deterministic and needs no key. To add a model, write a class with the same
method, return it from `get_assistant()`, and select it with the
`PATTERNWITNESS_ASSISTANT` environment variable. Keep the model's input limited
to the cluster's evidence so its summary stays grounded in what the rules found.

## Not built yet

- LLM-assisted investigation and evidence-gathering agents
- Review history / audit trail (only the latest review per cluster is kept)
- Allow-list for known campus domains, domain-level link matching
- Authentication, deployment, large-file performance

---

# HackPrinceton Fall 2026 — Prize-Aware Project Setup

Status: **project selected (PatternWitness); prototype implemented — see above.**

This repository is the planning and compliance baseline for a HackPrinceton Fall 2026 project. The event is in person at Princeton, November 13–15, 2026, with a 36-hour build window. Teams may contain up to four members, and exactly one of the six HackPrinceton main tracks may be selected; sponsor tracks may be added when their independent requirements are met.

## Goals and judging

Build one useful, technically credible product with a strong two-minute demonstration. The official judging dimensions are creativity, utility, charity/social impact, and avidity/presentation quality. The project must be new work created in the permitted event window, use a public GitHub repository, and document libraries, attribution, and meaningful sponsor usage.

## Prize strategy

We will select exactly one main track and pursue only compatible sponsor opportunities. Current verified opportunities and their planning status are in [the prize matrix](docs/PRIZE_MATRIX.md). The strongest initial combination is one meaningful Gemini-powered workflow plus MongoDB Atlas or Tiger Data for durable/event data, with Vultr only if deployment improves the demo. SpaceXSI is a workflow/raffle opportunity, not a product integration.

## Technology strategy

Provider states are deliberately explicit: planned means researched but not configured; configured means credentials and local setup exist; implemented means real product code uses it; tested means validation evidence exists; verified means the submission evidence is complete. See [SPONSOR_APIS.md](docs/SPONSOR_APIS.md), [ARCHITECTURE.md](docs/ARCHITECTURE.md), and [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).

## Configuration and credentials

Setup and run commands for PatternWitness are in [Run it locally](#run-it-locally) above. The backend reads `backend/.env` (template: `backend/.env.example`); the root `.env.example` lists every provider the team has considered. Create `.env` files from the examples and keep credentials out of Git.

## Sponsor compliance

For every claimed integration, retain code references, configuration evidence, a reproducible demo path, test/validation output, and a short explanation of meaningful user value. An installed SDK or unused API key is not evidence of eligibility.

## Project status

- [x] Official source research started and conflicts recorded
- [x] Prize, API, architecture, idea, and submission planning documents created
- [ ] Organizer confirmation of unlisted sponsor tracks and final deadline
- [ ] Team selects one main track and sponsor strategy
- [ ] Product implementation begins after approval

See [AGENTS.md](AGENTS.md) for permanent repository rules.
