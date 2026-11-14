# Technical overview

The pipeline is `CSV -> validation -> storage -> normalized messages -> pairwise signal graph -> connected components -> evidence/score -> graph UI -> human review -> Markdown report`.

Two messages from different accounts can be linked by a normalized shared URL or word-set Jaccard similarity. Timing is supporting evidence only; it never creates a link by itself. Connected components become clusters. Evidence records retain rule, points, message IDs, and supporting pair data. Scores are capped at 100 and are explicitly investigative leads.

The signal ablation reruns the same detector with text similarity only, shared links only, and both signals. This is not a benchmark or accuracy claim; it is a per-dataset explanation of what each layer contributes.

Storage is behind a small interface. SQLite is the deterministic local fallback. MongoDB Atlas is available through `MONGODB_URI` and is never required for the demo. The default assistant is a deterministic template; no LLM output is represented as live agent execution.

Known failure modes include legitimate shared links, paraphrases missed by Jaccard similarity, false grouping through transitive graph connections, sender identity uncertainty, and prototype-scale pairwise comparisons. The product exposes limitations and requires analyst review.
