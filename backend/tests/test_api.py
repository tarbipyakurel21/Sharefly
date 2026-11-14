import pytest
from fastapi import testclient

from app import config
from app.main import app

HEADER = "message_id,sender_id,timestamp,message_text,urls\n"


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "DB_PATH", tmp_path / "test.db")
    monkeypatch.setenv("STORAGE_BACKEND", "sqlite")  # API tests never touch a real cluster
    with testclient.TestClient(app) as c:
        yield c


def test_health(client):
    body = client.get("/api/health").json()
    assert body["status"] == "ok"
    assert body["storage"] == {"backend": "sqlite", "note": None}


def test_upload_persists_clusters_and_evidence(client):
    dataset_id = client.post("/api/datasets/sample").json()["dataset"]["id"]
    stored = client.get(f"/api/datasets/{dataset_id}/clusters").json()
    live = client.get(f"/api/datasets/{dataset_id}/analysis").json()["clusters"]
    assert stored["storage"] == "sqlite"
    assert [c["key"] for c in stored["clusters"]] == [c["key"] for c in live]
    assert stored["clusters"][0]["evidence"] == live[0]["evidence"]
    assert client.get("/api/datasets/999/clusters").status_code == 404


def test_sample_dataset_round_trip(client):
    created = client.post("/api/datasets/sample")
    assert created.status_code == 201
    dataset_id = created.json()["dataset"]["id"]
    assert client.get("/api/datasets").json()[0]["id"] == dataset_id

    analysis = client.get(f"/api/datasets/{dataset_id}/analysis").json()
    assert analysis["stats"]["messages"] == 30
    assert analysis["stats"]["clusters"] == 4
    assert all(c["status"] == "suspicious_unconfirmed" for c in analysis["clusters"])
    assert {n["type"] for n in analysis["graph"]["nodes"]} == {"account", "message", "url"}


def test_upload_reports_invalid_rows(client):
    body = HEADER + "m1,s1,2026-11-09T14:02:00Z,hello there,\nm2,s2,not-a-date,oops,\n"
    response = client.post("/api/datasets", files={"file": ("mine.csv", body.encode(), "text/csv")})
    assert response.status_code == 201
    validation = response.json()["validation"]
    assert (validation["accepted"], validation["rejected"]) == (1, 1)


def test_upload_with_missing_columns_is_rejected(client):
    response = client.post("/api/datasets", files={"file": ("bad.csv", b"a,b\n1,2\n", "text/csv")})
    assert response.status_code == 400
    assert "Missing required column" in response.json()["detail"]


def test_unknown_dataset_is_404(client):
    assert client.get("/api/datasets/999/analysis").status_code == 404


def _first_cluster(client):
    dataset_id = client.post("/api/datasets/sample").json()["dataset"]["id"]
    cluster = client.get(f"/api/datasets/{dataset_id}/analysis").json()["clusters"][0]
    return dataset_id, cluster


def test_clusters_start_as_needs_review(client):
    _, cluster = _first_cluster(client)
    assert cluster["review"] == {"status": "needs_review", "note": "", "updated_at": None}


def test_review_is_saved_and_returned(client):
    dataset_id, cluster = _first_cluster(client)
    url = f"/api/datasets/{dataset_id}/clusters/{cluster['key']}/review"
    saved = client.put(url, json={"status": "escalated", "note": " Sent to IT security. "})
    assert saved.status_code == 200
    again = client.get(f"/api/datasets/{dataset_id}/analysis").json()["clusters"][0]
    assert again["review"]["status"] == "escalated"
    assert again["review"]["note"] == "Sent to IT security."
    assert again["status"] == "suspicious_unconfirmed"  # a review never confirms fraud


def test_review_rejects_unknown_status_and_cluster(client):
    dataset_id, cluster = _first_cluster(client)
    base = f"/api/datasets/{dataset_id}/clusters"
    assert client.put(f"{base}/{cluster['key']}/review", json={"status": "confirmed_fraud"}).status_code == 422
    assert client.put(f"{base}/nope/review", json={"status": "dismissed"}).status_code == 404


def test_cluster_report_is_markdown_with_defanged_links(client):
    dataset_id, cluster = _first_cluster(client)
    response = client.get(f"/api/datasets/{dataset_id}/clusters/{cluster['key']}/report")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/markdown")
    assert "suspicious, unconfirmed" in response.text
    assert "hxxps://" in response.text and "https://" not in response.text
