"""The same persistence contract is checked against every available backend.

- sqlite     always runs
- mongomock  runs when the `mongomock` package is installed (in-memory MongoDB double)
- atlas      runs only when PATTERNWITNESS_TEST_MONGODB_URI is set; it uses a throwaway
             database that is dropped afterwards, never your real one
"""
import os
import uuid

import pytest

from app import config
from app.config import SAMPLE_CSV
from app.csv_parser import parse_csv
from app.detection import detect_clusters
from app.storage import get_storage
from app.storage.sqlite_store import SqliteStorage


@pytest.fixture(params=["sqlite", "mongomock", "atlas"])
def storage(request, tmp_path):
    if request.param == "sqlite":
        yield SqliteStorage(tmp_path / "contract.db")
    elif request.param == "mongomock":
        mongomock = pytest.importorskip("mongomock")
        from app.storage.mongo_store import MongoStorage

        yield MongoStorage(mongomock.MongoClient(tz_aware=True)["patternwitness_test"])
    else:
        uri = os.environ.get("PATTERNWITNESS_TEST_MONGODB_URI")
        if not uri:
            pytest.skip("PATTERNWITNESS_TEST_MONGODB_URI is not set")
        from app.storage.mongo_store import MongoStorage

        name = f"patternwitness_test_{uuid.uuid4().hex[:8]}"
        store = MongoStorage.connect(uri, name)
        try:
            yield store
        finally:
            store.db.client.drop_database(name)


@pytest.fixture()
def messages():
    return parse_csv(SAMPLE_CSV.read_bytes()).messages


def test_dataset_and_messages_round_trip(storage, messages):
    first = storage.save_dataset("first", messages[:3])
    second = storage.save_dataset("second", messages)
    assert second["id"] != first["id"] and second["message_count"] == 30
    assert [d["id"] for d in storage.list_datasets()] == [second["id"], first["id"]]
    assert storage.get_dataset(second["id"]) == second
    assert storage.get_dataset(10**9) is None

    loaded = storage.get_messages(second["id"])
    expected = sorted(messages, key=lambda m: (m.timestamp, m.message_id))
    assert loaded == expected  # same ids, senders, UTC timestamps, text and urls
    assert len(storage.get_messages(first["id"])) == 3


def test_clusters_and_evidence_round_trip(storage, messages):
    dataset = storage.save_dataset("demo", messages)
    clusters = detect_clusters(messages)
    detected_at = storage.save_clusters(dataset["id"], clusters)

    stored = storage.get_clusters(dataset["id"])
    assert [c["key"] for c in stored] == [c["key"] for c in clusters]  # highest score first
    for original, saved in zip(clusters, stored):
        assert saved["detected_at"] == detected_at
        assert saved["status"] == "suspicious_unconfirmed"
        assert saved["evidence"] == original["evidence"]
        assert {k: saved[k] for k in original if k != "evidence"} == {
            k: v for k, v in original.items() if k != "evidence"}

    storage.save_clusters(dataset["id"], clusters[:1])  # a re-run replaces the snapshot
    assert len(storage.get_clusters(dataset["id"])) == 1
    storage.save_clusters(dataset["id"], [])
    assert storage.get_clusters(dataset["id"]) == []


def test_reviews_are_upserted_per_cluster(storage, messages):
    dataset = storage.save_dataset("demo", messages)
    assert storage.get_reviews(dataset["id"]) == {}
    storage.set_review(dataset["id"], "abc", "escalated", "first note")
    saved = storage.set_review(dataset["id"], "abc", "dismissed", "second note")
    assert storage.get_reviews(dataset["id"]) == {"abc": saved}
    assert saved["status"] == "dismissed" and saved["note"] == "second note"


def test_datasets_are_isolated(storage, messages):
    a = storage.save_dataset("a", messages)
    b = storage.save_dataset("b", messages[:2])
    storage.save_clusters(a["id"], detect_clusters(messages))
    storage.set_review(a["id"], "abc", "escalated", "")
    assert storage.get_clusters(b["id"]) == [] and storage.get_reviews(b["id"]) == {}


# --- backend selection -------------------------------------------------------------

@pytest.fixture()
def env(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "DB_PATH", tmp_path / "select.db")
    monkeypatch.delenv("MONGODB_URI", raising=False)
    monkeypatch.delenv("STORAGE_BACKEND", raising=False)
    return monkeypatch


def test_defaults_to_sqlite_without_a_mongodb_uri(env):
    store = get_storage()
    assert (store.name, store.note) == ("sqlite", None)


def test_auto_falls_back_to_sqlite_when_mongodb_is_unreachable(env):
    env.setenv("MONGODB_URI", "mongodb://user:not-a-real-secret@127.0.0.1:1/")
    env.setenv("MONGODB_TIMEOUT_MS", "300")
    store = get_storage()
    assert store.name == "sqlite"
    assert "MongoDB unavailable" in store.note
    assert "not-a-real-secret" not in store.note  # credentials never leak into notes/logs


def test_forced_mongodb_fails_loudly_without_leaking_the_uri(env):
    env.setenv("STORAGE_BACKEND", "mongodb")
    with pytest.raises(RuntimeError, match="requires MONGODB_URI"):
        get_storage()
    env.setenv("MONGODB_URI", "mongodb://user:not-a-real-secret@127.0.0.1:1/")
    env.setenv("MONGODB_TIMEOUT_MS", "300")
    with pytest.raises(RuntimeError) as error:
        get_storage()
    assert "not-a-real-secret" not in str(error.value)
