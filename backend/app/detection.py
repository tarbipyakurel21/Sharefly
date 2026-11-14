"""Explainable, rule-based coordination detector.

Three signals link two messages *from different accounts*:
  1. shared_url    - both contain the same normalized URL
  2. similar_text  - word-set Jaccard similarity >= threshold
  3. close_timing  - an already-linked pair was sent within the time window
                     (timing alone never links messages)

Linked messages form a graph; each connected component is reported as one
cluster with the evidence that produced it and a transparent score.
A cluster is a lead for a human analyst. Nothing here confirms fraud.
"""
from __future__ import annotations

import hashlib
from itertools import combinations

import networkx as nx

from .config import DetectionConfig
from .models import Message
from .text_utils import jaccard, tokenize

STATUS_UNCONFIRMED = "suspicious_unconfirmed"

LIMITATIONS = [
    "No fraud has been confirmed. This cluster is a pattern match, not a verdict.",
    "The rules do not check whether a link or sender is legitimate; real campus "
    "announcements that share a link can appear here.",
    "Account ownership, intent and any harm to recipients are not established.",
]


def _level(score: int) -> str:
    if score >= 70:
        return "high"
    if score >= 40:
        return "medium"
    return "low"


def find_links(messages: list[Message], cfg: DetectionConfig,
               signals: frozenset[str] | None = None) -> nx.Graph:
    """Return a graph whose nodes are message ids and whose edges carry the linking signals."""
    signals = signals or frozenset({"shared_url", "similar_text"})
    g = nx.Graph()
    by_url: dict[str, list[Message]] = {}
    for m in messages:
        for url in m.urls:
            by_url.setdefault(url, []).append(m)

    for url, group in by_url.items():
        for a, b in combinations(group, 2):
            if "shared_url" not in signals:
                continue
            if a.sender_id == b.sender_id:
                continue
            if not g.has_edge(a.message_id, b.message_id):
                g.add_edge(a.message_id, b.message_id, urls=[], similarity=None)
            g[a.message_id][b.message_id]["urls"].append(url)

    tokens = {m.message_id: tokenize(m.text) for m in messages}
    comparable = [m for m in messages if len(tokens[m.message_id]) >= cfg.min_tokens]
    for a, b in combinations(comparable, 2):
        if "similar_text" not in signals:
            continue
        if a.sender_id == b.sender_id:
            continue
        sim = jaccard(tokens[a.message_id], tokens[b.message_id])
        if sim >= cfg.similarity_threshold:
            if not g.has_edge(a.message_id, b.message_id):
                g.add_edge(a.message_id, b.message_id, urls=[], similarity=None)
            g[a.message_id][b.message_id]["similarity"] = round(sim, 2)

    by_id = {m.message_id: m for m in messages}
    for a_id, b_id, data in g.edges(data=True):
        gap = abs((by_id[a_id].timestamp - by_id[b_id].timestamp).total_seconds()) / 60
        data["gap_minutes"] = round(gap, 1)
    return g


def _build_cluster(ids: set[str], links: nx.Graph, by_id: dict[str, Message],
                   cfg: DetectionConfig) -> dict:
    members = sorted((by_id[i] for i in ids), key=lambda m: (m.timestamp, m.message_id))
    senders = sorted({m.sender_id for m in members})
    edges = [(a, b, d) for a, b, d in links.subgraph(ids).edges(data=True)]
    evidence: list[dict] = []

    # Rule 1: shared URLs
    url_senders: dict[str, set[str]] = {}
    url_messages: dict[str, set[str]] = {}
    for a, b, d in edges:
        for url in d["urls"]:
            url_senders.setdefault(url, set()).update({by_id[a].sender_id, by_id[b].sender_id})
            url_messages.setdefault(url, set()).update({a, b})
    if url_senders:
        points = min(40, 30 + 10 * (len(url_senders) - 1))
        details = [
            {"url": u, "accounts": sorted(url_senders[u]), "message_ids": sorted(url_messages[u])}
            for u in sorted(url_senders)
        ]
        evidence.append({
            "rule": "shared_url",
            "title": "Same link sent by different accounts",
            "detail": "; ".join(
                f"{d['url']} appears in {len(d['message_ids'])} messages from "
                f"{len(d['accounts'])} accounts" for d in details
            ),
            "points": points,
            "message_ids": sorted(set().union(*url_messages.values())),
            "data": {"urls": details},
        })

    # Rule 2: similar text
    sim_pairs = [(a, b, d["similarity"]) for a, b, d in edges if d["similarity"] is not None]
    if sim_pairs:
        avg = sum(s for _, _, s in sim_pairs) / len(sim_pairs)
        points = 30 + (5 if avg >= 0.8 else 0)
        evidence.append({
            "rule": "similar_text",
            "title": "Near-identical wording across accounts",
            "detail": (
                f"{len(sim_pairs)} message pair(s) from different accounts share at least "
                f"{int(cfg.similarity_threshold * 100)}% of their wording "
                f"(average {int(round(avg * 100))}%)"
            ),
            "points": points,
            "message_ids": sorted({i for a, b, _ in sim_pairs for i in (a, b)}),
            "data": {"pairs": [{"a": a, "b": b, "similarity": s} for a, b, s in sorted(sim_pairs)]},
        })

    # Rule 3: close timing between already-linked messages
    close = [(a, b, d["gap_minutes"]) for a, b, d in edges
             if d["gap_minutes"] <= cfg.time_window_minutes]
    if close:
        shortest = min(gap for _, _, gap in close)
        evidence.append({
            "rule": "close_timing",
            "title": "Linked messages sent close together",
            "detail": (
                f"{len(close)} linked pair(s) from different accounts were sent within "
                f"{cfg.time_window_minutes} minutes of each other (shortest gap {shortest:g} min)"
            ),
            "points": 20,
            "message_ids": sorted({i for a, b, _ in close for i in (a, b)}),
            "data": {"pairs": [{"a": a, "b": b, "gap_minutes": gap} for a, b, gap in sorted(close)]},
        })

    # Rule 4: breadth
    if len(senders) >= 3:
        evidence.append({
            "rule": "multiple_accounts",
            "title": "Three or more accounts involved",
            "detail": f"{len(senders)} distinct accounts are linked in this cluster",
            "points": 10,
            "message_ids": [m.message_id for m in members],
            "data": {"accounts": senders},
        })

    score = min(100, sum(e["points"] for e in evidence))
    member_ids = sorted(ids)
    return {
        # Stable across re-runs (unlike C1, C2...), so analyst reviews can be attached to it.
        "key": hashlib.sha1("|".join(member_ids).encode()).hexdigest()[:12],
        "status": STATUS_UNCONFIRMED,
        "score": score,
        "level": _level(score),
        "message_ids": [m.message_id for m in members],
        "accounts": senders,
        "urls": sorted(url_senders),
        "first_seen": members[0].timestamp.isoformat(),
        "last_seen": members[-1].timestamp.isoformat(),
        "evidence": evidence,
        "limitations": LIMITATIONS,
    }


def detect_clusters(messages: list[Message], cfg: DetectionConfig | None = None,
                    signals: frozenset[str] | None = None) -> list[dict]:
    """Return flagged clusters, highest score first, with ids C1, C2, ..."""
    cfg = cfg or DetectionConfig()
    links = find_links(messages, cfg, signals)
    by_id = {m.message_id: m for m in messages}
    clusters = [_build_cluster(set(c), links, by_id, cfg) for c in nx.connected_components(links)]
    clusters.sort(key=lambda c: (-c["score"], c["first_seen"], c["message_ids"][0]))
    for i, cluster in enumerate(clusters, start=1):
        cluster["id"] = f"C{i}"
    return clusters
