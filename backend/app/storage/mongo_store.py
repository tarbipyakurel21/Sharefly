"""MongoDB Atlas storage.

Collections (database name from MONGODB_DB, default "patternwitness"):

  investigations  one document per uploaded dataset            _id = integer id
  messages        one document per message                     unique (investigation_id, message_id)
  clusters        one document per detected cluster            unique (investigation_id, key)
  evidence        one document per rule that fired in a cluster
  reviews         latest analyst review per cluster            unique (investigation_id, cluster_key)
  counters        integer id sequence for investigations

Integer investigation ids keep the HTTP API identical for both backends.
"""
from __future__ import annotations

from datetime import timezone
from typing import Any

from ..models import Message
from .base import utc_now

ASC, DESC = 1, -1  # same values as pymongo.ASCENDING / pymongo.DESCENDING


class MongoStorage:
    name = "mongodb"
    note = None

    def __init__(self, db: Any) -> None:
        """`db` is a pymongo Database (or a compatible test double such as mongomock)."""
        self.db = db
        self._ensure_indexes()

    @classmethod
    def connect(cls, uri: str, db_name: str, timeout_ms: int = 5000) -> "MongoStorage":
        from pymongo import MongoClient

        client = MongoClient(uri, serverSelectionTimeoutMS=timeout_ms, tz_aware=True,
                             appname="PatternWitness")
        client.admin.command("ping")  # fail fast if the cluster is unreachable
        return cls(client[db_name])

    def _ensure_indexes(self) -> None:
        db = self.db
        db.investigations.create_index([("uploaded_at", DESC)])
        db.messages.create_index([("investigation_id", ASC), ("message_id", ASC)], unique=True)
        db.messages.create_index([("investigation_id", ASC), ("timestamp", ASC)])  # timelines
        db.messages.create_index([("investigation_id", ASC), ("sender_id", ASC)])  # per account
        db.messages.create_index([("urls", ASC)])                                  # shared links
        db.clusters.create_index([("investigation_id", ASC), ("key", ASC)], unique=True)
        db.clusters.create_index([("investigation_id", ASC), ("score", DESC)])
        db.evidence.create_index([("investigation_id", ASC), ("cluster_key", ASC)])
        db.evidence.create_index([("rule", ASC)])
        db.reviews.create_index([("investigation_id", ASC), ("cluster_key", ASC)], unique=True)

    def _next_id(self) -> int:
        doc = self.db.counters.find_one_and_update(
            {"_id": "investigations"}, {"$inc": {"seq": 1}}, upsert=True,
            return_document=True,  # pymongo.ReturnDocument.AFTER
        )
        return int(doc["seq"])

    @staticmethod
    def _dataset(doc: dict) -> dict:
        return {"id": doc["_id"], "name": doc["name"], "uploaded_at": doc["uploaded_at"],
                "message_count": doc["message_count"]}

    def save_dataset(self, name: str, messages: list[Message]) -> dict:
        doc = {"_id": self._next_id(), "name": name, "uploaded_at": utc_now(),
               "message_count": len(messages)}
        self.db.investigations.insert_one(doc)
        try:
            self.db.messages.insert_many([
                {"investigation_id": doc["_id"], "message_id": m.message_id,
                 "sender_id": m.sender_id, "timestamp": m.timestamp, "text": m.text,
                 "urls": list(m.urls)}
                for m in messages
            ])
        except Exception:
            # Do not leave a half-written investigation behind.
            self.db.messages.delete_many({"investigation_id": doc["_id"]})
            self.db.investigations.delete_one({"_id": doc["_id"]})
            raise
        return self._dataset(doc)

    def list_datasets(self) -> list[dict]:
        return [self._dataset(d) for d in self.db.investigations.find().sort("_id", DESC)]

    def get_dataset(self, dataset_id: int) -> dict | None:
        doc = self.db.investigations.find_one({"_id": dataset_id})
        return self._dataset(doc) if doc else None

    def get_messages(self, dataset_id: int) -> list[Message]:
        cursor = self.db.messages.find({"investigation_id": dataset_id}).sort(
            [("timestamp", ASC), ("message_id", ASC)])
        messages = []
        for d in cursor:
            ts = d["timestamp"]
            if ts.tzinfo is None:  # drivers return naive UTC unless tz_aware is set
                ts = ts.replace(tzinfo=timezone.utc)
            messages.append(Message(d["message_id"], d["sender_id"], ts.astimezone(timezone.utc),
                                    d["text"], list(d["urls"])))
        return messages

    def save_clusters(self, dataset_id: int, clusters: list[dict]) -> str:
        detected_at = utc_now()
        scope = {"investigation_id": dataset_id}
        self.db.clusters.delete_many(scope)
        self.db.evidence.delete_many(scope)
        if not clusters:
            return detected_at
        cluster_docs, evidence_docs = [], []
        for c in clusters:
            summary = {k: v for k, v in c.items() if k != "evidence"}
            cluster_docs.append({**summary, **scope, "detected_at": detected_at})
            for position, e in enumerate(c["evidence"]):
                evidence_docs.append({**e, **scope, "cluster_key": c["key"], "position": position,
                                      "detected_at": detected_at})
        self.db.clusters.insert_many(cluster_docs)
        if evidence_docs:
            self.db.evidence.insert_many(evidence_docs)
        return detected_at

    def get_clusters(self, dataset_id: int) -> list[dict]:
        scope = {"investigation_id": dataset_id}
        hidden = {"_id": 0, "investigation_id": 0}
        evidence: dict[str, list[dict]] = {}
        for e in self.db.evidence.find(scope, hidden).sort("position", ASC):
            key = e.pop("cluster_key")
            e.pop("position", None)
            e.pop("detected_at", None)
            evidence.setdefault(key, []).append(e)
        clusters = []
        for c in self.db.clusters.find(scope, hidden).sort([("score", DESC), ("key", ASC)]):
            clusters.append({**c, "evidence": evidence.get(c["key"], [])})
        return clusters

    def get_reviews(self, dataset_id: int) -> dict[str, dict]:
        return {
            r["cluster_key"]: {"status": r["status"], "note": r["note"],
                               "updated_at": r["updated_at"]}
            for r in self.db.reviews.find({"investigation_id": dataset_id})
        }

    def set_review(self, dataset_id: int, cluster_key: str, status: str, note: str) -> dict:
        review = {"status": status, "note": note, "updated_at": utc_now()}
        self.db.reviews.update_one(
            {"investigation_id": dataset_id, "cluster_key": cluster_key},
            {"$set": review}, upsert=True,
        )
        return review
