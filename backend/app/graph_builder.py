"""Build the account / message / URL relationship graph with NetworkX."""
from __future__ import annotations

import networkx as nx

from .config import DetectionConfig
from .detection import find_links
from .models import Message


def build_graph(messages: list[Message], clusters: list[dict],
                cfg: DetectionConfig | None = None) -> nx.Graph:
    cfg = cfg or DetectionConfig()
    cluster_of = {mid: c["id"] for c in clusters for mid in c["message_ids"]}
    g = nx.Graph()
    for m in messages:
        msg_node = f"message:{m.message_id}"
        acct_node = f"account:{m.sender_id}"
        cid = cluster_of.get(m.message_id)
        g.add_node(msg_node, type="message", label=m.message_id, cluster_id=cid)
        g.add_node(acct_node, type="account", label=m.sender_id)
        g.add_edge(acct_node, msg_node, type="sent")
        for url in m.urls:
            url_node = f"url:{url}"
            g.add_node(url_node, type="url", label=url)
            g.add_edge(msg_node, url_node, type="contains")

    for a, b, data in find_links(messages, cfg).edges(data=True):
        if data["similarity"] is not None:
            g.add_edge(f"message:{a}", f"message:{b}", type="similar", weight=data["similarity"])

    # An account or URL belongs to a cluster only if every flagged message it touches agrees.
    for node, attrs in g.nodes(data=True):
        if attrs["type"] == "message":
            continue
        ids = {g.nodes[n].get("cluster_id") for n in g.neighbors(node)
               if g.nodes[n]["type"] == "message"} - {None}
        attrs["cluster_id"] = ids.pop() if len(ids) == 1 else None
    return g


def graph_to_json(g: nx.Graph) -> dict:
    nodes = [
        {"id": n, "type": a["type"], "label": a["label"], "cluster_id": a.get("cluster_id"),
         "degree": g.degree(n)}
        for n, a in g.nodes(data=True)
    ]
    edges = [
        {"id": f"e{i}", "source": u, "target": v, "type": a["type"], "weight": a.get("weight")}
        for i, (u, v, a) in enumerate(g.edges(data=True))
    ]
    return {"nodes": nodes, "edges": edges}
