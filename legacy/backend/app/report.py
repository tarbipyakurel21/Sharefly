"""Plain-Markdown evidence report for one cluster, for hand-off to an investigator."""
from __future__ import annotations

from .config import DISCLAIMER, REVIEW_STATUSES
from .text_utils import URL_RE


def defang(text: str) -> str:
    """Make links non-clickable: https://a.example/x -> hxxps://a[.]example/x"""
    return URL_RE.sub(lambda m: "hxxp" + m.group(0)[4:].replace(".", "[.]"), text)


def build_report(dataset: dict, cluster: dict, messages: list[dict]) -> str:
    review = cluster["review"]
    lines = [
        f"# PatternWitness evidence report: cluster {cluster['id']}",
        "",
        f"> {DISCLAIMER}",
        "",
        f"- Dataset: {dataset['name']} (#{dataset['id']}, uploaded {dataset['uploaded_at']})",
        f"- Cluster key: `{cluster['key']}`",
        "- Detection status: suspicious, unconfirmed",
        f"- Suspicion score: {cluster['score']}/100 ({cluster['level']})",
        f"- Active: {cluster['first_seen']} to {cluster['last_seen']}",
        f"- Accounts: {', '.join(cluster['accounts'])}",
        "",
        "## Analyst review",
        "",
        f"- Status: {REVIEW_STATUSES[review['status']]}",
        f"- Note: {review['note'] or '(none)'}",
        f"- Last updated: {review['updated_at'] or '(not reviewed yet)'}",
        "",
        "## Why this was flagged",
        "",
    ]
    for e in cluster["evidence"]:
        detail = e["detail"]
        for item in e["data"].get("urls", []):
            detail = detail.replace(item["url"], item["url"].replace(".", "[.]"))
        lines.append(f"- **{e['title']}** (+{e['points']}): {detail}")
        lines.append(f"  - Messages: {', '.join(e['message_ids'])}")
    lines += ["", "## What this does not establish", ""]
    lines += [f"- {text}" for text in cluster["limitations"]]
    lines += ["", "## Messages (links defanged)", ""]
    for m in messages:
        lines.append(f"- `{m['message_id']}` | {m['timestamp']} | `{m['sender_id']}`")
        lines.append(f"  > {defang(m['text'])}")
    return "\n".join(lines) + "\n"
