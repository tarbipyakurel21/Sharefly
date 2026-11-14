"""FastAPI entry point. Run with: uvicorn app.main:app --reload --port 8000"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse
from pydantic import BaseModel, Field

from .analysis import analyze
from .config import DEFAULT_REVIEW, DISCLAIMER, MAX_UPLOAD_BYTES, REVIEW_STATUSES, SAMPLE_CSV
from .csv_parser import CsvFormatError, parse_csv
from .report import build_report
from .storage import Storage, get_storage


class ReviewUpdate(BaseModel):
    status: str
    note: str = Field(default="", max_length=2000)


_storage: Storage | None = None


def store() -> Storage:
    """The active storage backend (MongoDB Atlas, or SQLite as the local fallback)."""
    global _storage
    if _storage is None:
        _storage = get_storage()
    return _storage


@asynccontextmanager
async def lifespan(_: FastAPI):
    global _storage
    _storage = get_storage()
    yield
    _storage = None


app = FastAPI(title="PatternWitness API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _ingest(name: str, content: bytes) -> dict:
    try:
        result = parse_csv(content)
    except CsvFormatError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not result.messages:
        raise HTTPException(
            status_code=422,
            detail={"message": "No valid rows found in the file.", "validation": result.report()},
        )
    dataset = store().save_dataset(name, result.messages)
    # Persist the detection snapshot (clusters + evidence records) alongside the messages.
    store().save_clusters(dataset["id"], analyze(result.messages)["clusters"])
    return {"dataset": dataset, "validation": result.report()}


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "disclaimer": DISCLAIMER,
            "storage": {"backend": store().name, "note": store().note}}


@app.post("/api/datasets", status_code=201)
async def upload_dataset(file: UploadFile = File(...)) -> dict:
    """Parse, validate and store an uploaded CSV. Invalid rows are reported, not stored."""
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File is larger than 5 MB.")
    return _ingest(file.filename or "upload.csv", content)


@app.post("/api/datasets/sample", status_code=201)
def load_sample_dataset() -> dict:
    """Load the bundled synthetic demonstration dataset."""
    return _ingest("Synthetic demo dataset", SAMPLE_CSV.read_bytes())


@app.get("/api/datasets")
def list_datasets() -> list[dict]:
    return store().list_datasets()


def _analysis(dataset_id: int) -> dict:
    """Run detection for a dataset and attach any saved analyst reviews."""
    dataset = store().get_dataset(dataset_id)
    if dataset is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    result = {"dataset": dataset, **analyze(store().get_messages(dataset_id))}
    reviews = store().get_reviews(dataset_id)
    for cluster in result["clusters"]:
        cluster["review"] = reviews.get(cluster["key"], dict(DEFAULT_REVIEW))
    result["review_statuses"] = REVIEW_STATUSES
    return result


def _cluster(analysis: dict, cluster_key: str) -> dict:
    for cluster in analysis["clusters"]:
        if cluster["key"] == cluster_key:
            return cluster
    raise HTTPException(status_code=404, detail="Cluster not found in this dataset.")


@app.get("/api/datasets/{dataset_id}/analysis")
def dataset_analysis(dataset_id: int) -> dict:
    return _analysis(dataset_id)


@app.get("/api/datasets/{dataset_id}/clusters")
def stored_clusters(dataset_id: int) -> dict:
    """The persisted detection snapshot: clusters and evidence records as stored at upload."""
    if store().get_dataset(dataset_id) is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    return {"storage": store().name, "clusters": store().get_clusters(dataset_id)}


@app.put("/api/datasets/{dataset_id}/clusters/{cluster_key}/review")
def review_cluster(dataset_id: int, cluster_key: str, update: ReviewUpdate) -> dict:
    """Record an analyst's decision about a cluster. This never marks anything as fraud."""
    if update.status not in REVIEW_STATUSES:
        raise HTTPException(
            status_code=422, detail="status must be one of: " + ", ".join(REVIEW_STATUSES))
    _cluster(_analysis(dataset_id), cluster_key)
    return store().set_review(dataset_id, cluster_key, update.status, update.note.strip())


@app.get("/api/datasets/{dataset_id}/clusters/{cluster_key}/report")
def cluster_report(dataset_id: int, cluster_key: str) -> PlainTextResponse:
    """Download a Markdown evidence report for one cluster."""
    analysis = _analysis(dataset_id)
    cluster = _cluster(analysis, cluster_key)
    members = [m for m in analysis["messages"] if m["cluster_id"] == cluster["id"]]
    return PlainTextResponse(
        build_report(analysis["dataset"], cluster, members),
        media_type="text/markdown",
        headers={"Content-Disposition":
                 f'attachment; filename="patternwitness-{cluster["id"]}-{cluster_key}.md"'},
    )


@app.get("/api/sample-csv")
def sample_csv() -> FileResponse:
    return FileResponse(SAMPLE_CSV, media_type="text/csv", filename="sample_messages.csv")
