# Ranked project ideas

## 1. Octate — trustworthy surgical-video annotation copilot

Problem: surgical researchers need consistent temporal labels and explanations from video. User: clinical research teams. Novelty: uncertainty-aware, human-in-the-loop annotation with evidence clips. Feasibility: high with a small synthetic/sample video and lightweight vision pipeline. Demo: upload a short clip, review suggested phases, correct one label, export an auditable annotation. Main fit: Healthcare or Science and Discovery. Compatible: Gemini, MongoDB/Tiger Data, Vultr, possibly Physical AI. Risk: medical claims, compute, and prior-implementation reuse; only new event code may be used unless rules permit otherwise. MVP: clip upload, timestamp labels, reviewer corrections, JSON/CSV export.

## 2. EvidenceGraph — forensic media provenance workspace

Problem: investigators need to connect files, hashes, timestamps, and claims without losing provenance. User: digital-forensics students and analysts. Novelty: every AI conclusion links to source evidence and confidence. Feasibility: high with NIST CFReDS fixtures. Demo: ingest a case, detect relationships, inspect an evidence-backed claim, export a report. Main fit: Science and Discovery or Business. Compatible: Gemini, MongoDB, Arlequin Forensics if confirmed, DEV. Risk: sponsor dataset access and avoiding overclaiming forensic validity. MVP: fixture ingestion, graph, citations, report.

## 3. CareRoute — accessible healthcare navigation agent

Problem: patients struggle to turn confusing care instructions into safe next steps. User: patients/caregivers. Novelty: constraint-aware planning with explicit uncertainty and escalation. Feasibility: medium; must avoid diagnosis and use vetted synthetic content. Demo: transform a discharge plan into accessible tasks and show an escalation boundary. Main fit: Healthcare. Compatible: Gemini, MongoDB, DEV, possibly Amazon Practical AI. Risk: safety, medical scope, and evaluation. MVP: structured plan parser, reminders, accessibility modes, source citations.

## 4. SignalBrief — social narrative and misinformation triage

Problem: researchers need to understand how narratives evolve across public posts. User: journalists, civic researchers, trust-and-safety teams. Novelty: clusters claims, timelines, and counter-evidence with uncertainty. Feasibility: medium using public/licensed datasets. Demo: load a dataset, reveal an emerging narrative, inspect representative posts and caveats. Main fit: Science and Discovery or Entertainment and Media. Compatible: Gemini, Tiger Data, Arlequin Social Media if confirmed. Risk: privacy, bias, platform terms, and sponsor access.

## 5. LabPilot — reproducible scientific research workflow agent

Problem: students lose time coordinating literature, experiments, and provenance. User: research labs. Novelty: agent turns a question into a traceable plan while separating evidence from hypotheses. Feasibility: medium. Demo: ask a question, inspect cited sources, run a small analysis, export a lab notebook. Main fit: Science and Discovery or Education. Compatible: Gemini, Deepagents if confirmed, Tiger Data, Vultr. Risk: retrieval quality and agent complexity. MVP: source-backed plan, one analysis tool, notebook export.

Recommendation: **Octate** if the team has genuine surgical-video expertise and can build a fresh event-window prototype; otherwise choose **EvidenceGraph** for the strongest risk-adjusted two-minute demo. No product implementation should begin until the team approves one.

