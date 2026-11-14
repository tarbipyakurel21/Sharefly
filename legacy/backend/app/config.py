"""Central configuration. Tune detection thresholds here."""
from __future__ import annotations

import os
from dataclasses import asdict, dataclass
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent

# Load backend/.env if present (never committed; see .env.example). Real environment
# variables take precedence over the file.
try:
    from dotenv import load_dotenv

    load_dotenv(BACKEND_DIR / ".env")
except ImportError:  # python-dotenv is optional
    pass

SAMPLE_CSV = BACKEND_DIR / "sample_data" / "sample_messages.csv"
DB_PATH = Path(os.environ.get("PATTERNWITNESS_DB", BACKEND_DIR / "data" / "patternwitness.db"))

MAX_UPLOAD_BYTES = 5 * 1024 * 1024
MAX_ROWS = 5000

DISCLAIMER = (
    "PatternWitness surfaces patterns that may indicate coordination. A flag is an "
    "investigative lead, not a finding of fraud. Every cluster requires human review "
    "before any conclusion or action."
)


@dataclass(frozen=True)
class DetectionConfig:
    similarity_threshold: float = 0.6  # Jaccard similarity of word sets
    time_window_minutes: int = 60      # "close timing" window for linked messages
    min_tokens: int = 5                # shorter messages are not compared by text

    def to_dict(self) -> dict:
        return asdict(self)

# Analyst review states. There is deliberately no "confirmed fraud" state: confirming
# fraud is a decision for the institution's own process, outside this tool.
REVIEW_STATUSES = {
    "needs_review": "Needs review",
    "escalated": "Escalated for investigation",
    "dismissed": "Dismissed as likely benign",
}
DEFAULT_REVIEW = {"status": "needs_review", "note": "", "updated_at": None}
