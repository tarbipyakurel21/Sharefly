"""Run the full pipeline for one dataset: detect -> graph -> summarize."""
from __future__ import annotations

from .assistant import InvestigationAssistant, get_assistant
from .config import DISCLAIMER, DetectionConfig
from .detection import detect_clusters
from .graph_builder import build_graph, graph_to_json
from .models import Message


def analyze(messages: list[Message], cfg: DetectionConfig | None = None,
            assistant: InvestigationAssistant | None = None) -> dict:
    cfg = cfg or DetectionConfig()
    assistant = assistant or get_assistant()
    clusters = detect_clusters(messages, cfg)
    by_id = {m.message_id: m for m in messages}
    for cluster in clusters:
        members = [by_id[i] for i in cluster["message_ids"]]
        cluster["summary"] = assistant.summarize_cluster(cluster, members)
        cluster["summary_source"] = assistant.name

    cluster_of = {mid: c["id"] for c in clusters for mid in c["message_ids"]}
    rows = [
        {**m.to_dict(), "cluster_id": cluster_of.get(m.message_id)}
        for m in sorted(messages, key=lambda m: (m.timestamp, m.message_id))
    ]
    return {
        "stats": {
            "messages": len(messages),
            "accounts": len({m.sender_id for m in messages}),
            "urls": len({u for m in messages for u in m.urls}),
            "clusters": len(clusters),
            "flagged_messages": len(cluster_of),
        },
        "clusters": clusters,
        "graph": graph_to_json(build_graph(messages, clusters, cfg)),
        "messages": rows,
        "config": cfg.to_dict(),
        "disclaimer": DISCLAIMER,
    }
