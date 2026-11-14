"""SQLite storage (standard library only). The zero-configuration local fallback."""
from __future__ import annotations

import json
import sqlite3
from contextlib import closing
from datetime import datetime
from pathlib import Path

from ..models import Message
from .base import utc_now

SCHEMA = """
CREATE TABLE IF NOT EXISTS datasets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    uploaded_at TEXT NOT NULL,
    message_count INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS messages (
    dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    message_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    text TEXT NOT NULL,
    urls TEXT NOT NULL,
    PRIMARY KEY (dataset_id, message_id)
);
CREATE TABLE IF NOT EXISTS reviews (
    dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    cluster_key TEXT NOT NULL,
    status TEXT NOT NULL,
    note TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (dataset_id, cluster_key)
);
CREATE TABLE IF NOT EXISTS clusters (
    dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    cluster_key TEXT NOT NULL,
    score INTEGER NOT NULL,
    detected_at TEXT NOT NULL,
    record TEXT NOT NULL,
    PRIMARY KEY (dataset_id, cluster_key)
);
"""


class SqliteStorage:
    name = "sqlite"

    def __init__(self, path: Path, note: str | None = None) -> None:
        self.path = Path(path)
        self.note = note
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with closing(self._connect()) as conn, conn:
            conn.executescript(SCHEMA)

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.path)
        conn.row_factory = sqlite3.Row
        return conn

    def save_dataset(self, name: str, messages: list[Message]) -> dict:
        uploaded_at = utc_now()
        with closing(self._connect()) as conn, conn:
            cur = conn.execute(
                "INSERT INTO datasets (name, uploaded_at, message_count) VALUES (?, ?, ?)",
                (name, uploaded_at, len(messages)),
            )
            dataset_id = cur.lastrowid
            conn.executemany(
                "INSERT INTO messages VALUES (?, ?, ?, ?, ?, ?)",
                [(dataset_id, m.message_id, m.sender_id, m.timestamp.isoformat(), m.text,
                  json.dumps(m.urls)) for m in messages],
            )
        return {"id": dataset_id, "name": name, "uploaded_at": uploaded_at,
                "message_count": len(messages)}

    def list_datasets(self) -> list[dict]:
        with closing(self._connect()) as conn:
            rows = conn.execute("SELECT * FROM datasets ORDER BY id DESC").fetchall()
        return [dict(r) for r in rows]

    def get_dataset(self, dataset_id: int) -> dict | None:
        with closing(self._connect()) as conn:
            row = conn.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,)).fetchone()
        return dict(row) if row else None

    def get_messages(self, dataset_id: int) -> list[Message]:
        with closing(self._connect()) as conn:
            rows = conn.execute(
                "SELECT * FROM messages WHERE dataset_id = ? ORDER BY timestamp, message_id",
                (dataset_id,),
            ).fetchall()
        return [
            Message(r["message_id"], r["sender_id"], datetime.fromisoformat(r["timestamp"]),
                    r["text"], json.loads(r["urls"]))
            for r in rows
        ]

    def save_clusters(self, dataset_id: int, clusters: list[dict]) -> str:
        detected_at = utc_now()
        with closing(self._connect()) as conn, conn:
            conn.execute("DELETE FROM clusters WHERE dataset_id = ?", (dataset_id,))
            conn.executemany(
                "INSERT INTO clusters VALUES (?, ?, ?, ?, ?)",
                [(dataset_id, c["key"], c["score"], detected_at, json.dumps(c)) for c in clusters],
            )
        return detected_at

    def get_clusters(self, dataset_id: int) -> list[dict]:
        with closing(self._connect()) as conn:
            rows = conn.execute(
                "SELECT detected_at, record FROM clusters WHERE dataset_id = ? "
                "ORDER BY score DESC, cluster_key",
                (dataset_id,),
            ).fetchall()
        return [{**json.loads(r["record"]), "detected_at": r["detected_at"]} for r in rows]

    def get_reviews(self, dataset_id: int) -> dict[str, dict]:
        with closing(self._connect()) as conn:
            rows = conn.execute(
                "SELECT cluster_key, status, note, updated_at FROM reviews WHERE dataset_id = ?",
                (dataset_id,),
            ).fetchall()
        return {r["cluster_key"]: {"status": r["status"], "note": r["note"],
                                   "updated_at": r["updated_at"]} for r in rows}

    def set_review(self, dataset_id: int, cluster_key: str, status: str, note: str) -> dict:
        updated_at = utc_now()
        with closing(self._connect()) as conn, conn:
            conn.execute(
                "INSERT INTO reviews VALUES (?, ?, ?, ?, ?) "
                "ON CONFLICT (dataset_id, cluster_key) DO UPDATE SET "
                "status = excluded.status, note = excluded.note, updated_at = excluded.updated_at",
                (dataset_id, cluster_key, status, note, updated_at),
            )
        return {"status": status, "note": note, "updated_at": updated_at}
