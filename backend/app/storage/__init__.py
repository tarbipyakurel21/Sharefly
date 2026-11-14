"""Storage selection.

STORAGE_BACKEND=auto (default): use MongoDB Atlas when MONGODB_URI is set and
reachable, otherwise fall back to local SQLite. `sqlite` and `mongodb` force one
backend (`mongodb` fails at startup instead of falling back).

Credentials are read only from the environment / backend/.env and never logged.
"""
from __future__ import annotations

import logging
import os

from .. import config
from .base import Storage
from .sqlite_store import SqliteStorage

log = logging.getLogger("patternwitness.storage")

__all__ = ["Storage", "get_storage"]


def get_storage() -> Storage:
    choice = os.environ.get("STORAGE_BACKEND", "auto").strip().lower()
    uri = os.environ.get("MONGODB_URI", "").strip()
    if choice not in {"auto", "sqlite", "mongodb"}:
        raise ValueError("STORAGE_BACKEND must be auto, sqlite or mongodb.")

    if choice == "sqlite" or (choice == "auto" and not uri):
        return SqliteStorage(config.DB_PATH)
    if not uri:
        raise RuntimeError("STORAGE_BACKEND=mongodb requires MONGODB_URI to be set.")

    try:
        from .mongo_store import MongoStorage

        return MongoStorage.connect(
            uri,
            os.environ.get("MONGODB_DB", "patternwitness"),
            int(os.environ.get("MONGODB_TIMEOUT_MS", "5000")),
        )
    except Exception as exc:  # noqa: BLE001 - any driver/network failure triggers the fallback
        if choice == "mongodb":
            # Re-raise without the original message: driver errors can echo connection details.
            raise RuntimeError(f"Could not connect to MongoDB ({type(exc).__name__}).") from None
        note = f"MongoDB unavailable ({type(exc).__name__}); using local SQLite."
        log.warning(note)
        return SqliteStorage(config.DB_PATH, note=note)
