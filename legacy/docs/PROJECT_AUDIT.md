# PatternWitness project audit

Audit date: 2026-11-14. Findings below are based on the checked-in source, tests, sample CSV, package manifests, and Git history.

## Product

PatternWitness is a local-first investigation dashboard for university security teams reviewing potentially coordinated scam or phishing messages. It does not identify criminals or prove fraud. Its primary user is an analyst who needs to move from isolated reports to a reviewable pattern with source evidence.

The original technical contribution is an explainable coordination detector that combines normalized shared links, cross-account wording similarity, timing, and account breadth into connected components. NetworkX then exposes account/message/link relationships. The new signal comparison makes the combined contribution measurable on each dataset.

## Verified working functionality

- CSV upload with UTF-8, required-column, row, timestamp, duplicate, size, and row-count validation.
- Deterministic synthetic 30-message demo dataset.
- SQLite default persistence; MongoDB Atlas adapter with explicit fallback behavior.
- Rule-based detection, stable cluster keys, evidence records, limitations, and transparent scores.
- Cytoscape relationship graph, cluster/message inspection, analyst review states, and Markdown report export with defanged URLs.
- API tests, detector tests, parser tests, and storage contract tests are present.
- Frontend source is TypeScript/React/Vite and includes loading/error/empty states.

## Gaps and risks

- No configured external LLM, DeepAgents, Gemini, or Bedrock integration is verified; the default assistant is intentionally deterministic.
- No authentication, deployment, review history, or large-file optimization.
- The detector is a prototype: pairwise text comparisons, URL equality, and rule weights can produce false positives; the sample includes a legitimate shared campus link to demonstrate this.
- The current environment lacks installed `pytest` and frontend `tsc`/`node_modules`, so local validation is incomplete until dependencies are installed.
- Git history shows an initial implementation and planning merge; repository creation/event-written-code compliance must be verified by the team and GitHub, not inferred from source timestamps.

## Strongest two-minute proof

Load the synthetic data, show the combined-signal comparison, select the high-scoring cluster, inspect the graph and evidence pairs, save an analyst review, and export the cited report. The surprising moment is that harmless-looking messages become a review lead only when wording, link reuse, and cross-account relationships are considered together.

## Track assessment

Best main-track fit: Science and Discovery, because the product demonstrates an interpretable graph/data-analysis method and human-verifiable findings. Business and Enterprise is a credible alternative for a university security operations story, but only one main track may be selected and organizer descriptions remain unverified.

The strongest sponsor opportunities are the Arlequin social-analysis/forensics concepts if organizers confirm them, and MongoDB Atlas because the repository contains a real storage adapter and persistence tests. Gemini, DeepAgents, Bedrock, Vultr, Tiger Data, and other sponsor integrations are not claimed without actual code, credentials/access, and validation evidence.

## Git and attribution

Observed commits: `0be8df1` initial commit, `0ae9efd` initial PatternWitness implementation, `6e2193c` planning-doc merge. Existing libraries include FastAPI, NetworkX, PyMongo, SQLite, React, Vite, Tailwind, and Cytoscape.js. Bundled data is synthetic and uses `.example` domains. Event-written percentages and exact repository creation date require GitHub/event records.
