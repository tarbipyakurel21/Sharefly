"""Pluggable investigation assistant.

The default implementation is a deterministic template, so the app needs no API
key. To add an LLM later, implement `InvestigationAssistant` (for example a class
that sends the cluster's evidence to a model and asks for a cautious, cited
summary) and return it from `get_assistant()` based on PATTERNWITNESS_ASSISTANT.
"""
from __future__ import annotations

import os
from typing import Protocol

from .models import Message


class InvestigationAssistant(Protocol):
    name: str

    def summarize_cluster(self, cluster: dict, messages: list[Message]) -> str:
        """Return a short analyst-facing summary grounded only in the given evidence."""
        ...


class TemplateAssistant:
    name = "rule-based template"

    def summarize_cluster(self, cluster: dict, messages: list[Message]) -> str:
        signals = [e["title"].lower() for e in cluster["evidence"]]
        return (
            f"{len(cluster['message_ids'])} messages from {len(cluster['accounts'])} accounts "
            f"were linked by: {'; '.join(signals)}. "
            f"Suspicion score {cluster['score']}/100 ({cluster['level']}). "
            "This is a lead for review, not a confirmed finding."
        )


def get_assistant() -> InvestigationAssistant:
    choice = os.environ.get("PATTERNWITNESS_ASSISTANT", "template")
    if choice != "template":
        raise ValueError(f"Unknown assistant '{choice}'. Only 'template' is implemented.")
    return TemplateAssistant()
