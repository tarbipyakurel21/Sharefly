# Judge Q&A

**Why AI?** The current core is deliberately deterministic because analysts need reproducibility. A future model can summarize bounded evidence, but the product value does not depend on invented model certainty.

**Why not an LLM wrapper?** The system parses data, builds a graph, computes transparent signals, stores evidence, supports review, and exports a cited report. Interpretation is separate from detection.

**What is novel?** The combined semantic-plus-relational view and the per-dataset ablation showing what each signal adds.

**What does the graph add?** It reveals cross-account reuse and connected components; text similarity alone cannot show the relationship structure or link hub.

**How evaluated?** Unit tests cover known positive/negative cases, timing-only non-links, stable keys, parser errors, API review/report behavior, and storage contracts. No unsupported accuracy percentage is claimed.

**What if it is wrong?** The UI says suspicious is not confirmed, shows limitations, and only offers review states: needs review, escalated, or dismissed as likely benign.

**What data?** Bundled synthetic messages and invented `.example` domains. No private or real-person data is required.

**Limitations?** Rules are prototype-scale and can miss paraphrases or flag legitimate shared links; no auth or production deployment.

**Why use it tomorrow?** A university security team can upload its exported message report and obtain a reviewable, source-linked lead without waiting for model training or external services.
