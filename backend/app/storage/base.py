from __future__ import annotations

from datetime import datetime, timezone
from typing import Protocol

from ..models import Message


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class Storage(Protocol):
    """Everything the API needs from a database. Implemented for SQLite and MongoDB."""

    name: str          # "sqlite" or "mongodb"
    note: str | None   # set when this backend is a fallback

    def save_dataset(self, name: str, messages: list[Message]) -> dict: ...
    def list_datasets(self) -> list[dict]: ...
    def get_dataset(self, dataset_id: int) -> dict | None: ...
    def get_messages(self, dataset_id: int) -> list[Message]: ...

    def save_clusters(self, dataset_id: int, clusters: list[dict]) -> str:
        """Replace the stored detection snapshot (clusters + evidence). Returns detected_at."""
        ...

    def get_clusters(self, dataset_id: int) -> list[dict]:
        """Stored clusters, highest score first, each with its evidence records."""
        ...

    def get_reviews(self, dataset_id: int) -> dict[str, dict]: ...
    def set_review(self, dataset_id: int, cluster_key: str, status: str, note: str) -> dict: ...
