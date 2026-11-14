"""Parse and validate an uploaded message CSV.

File-level problems (wrong encoding, missing columns) raise CsvFormatError.
Row-level problems are collected and reported; valid rows are still accepted.
"""
from __future__ import annotations

import csv
import io
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone

from .config import MAX_ROWS
from .models import Message
from .text_utils import extract_urls, normalize_url

REQUIRED_COLUMNS = ("message_id", "sender_id", "timestamp", "message_text")
OPTIONAL_COLUMNS = ("urls",)
ALIASES = {
    "id": "message_id",
    "sender": "sender_id",
    "text": "message_text",
    "message": "message_text",
    "url": "urls",
}


class CsvFormatError(ValueError):
    """The file as a whole cannot be used."""


@dataclass
class RowError:
    row: int  # 1-based line number in the file (header is row 1)
    message_id: str | None
    reason: str

    def to_dict(self) -> dict:
        return {"row": self.row, "message_id": self.message_id, "reason": self.reason}


@dataclass
class ParseResult:
    messages: list[Message] = field(default_factory=list)
    errors: list[RowError] = field(default_factory=list)
    total_rows: int = 0

    def report(self) -> dict:
        return {
            "total_rows": self.total_rows,
            "accepted": len(self.messages),
            "rejected": len(self.errors),
            "errors": [e.to_dict() for e in self.errors],
        }


def parse_timestamp(value: str) -> datetime:
    """Accept ISO 8601 (with or without timezone). Naive values are treated as UTC."""
    dt = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def parse_csv(content: bytes) -> ParseResult:
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise CsvFormatError("File is not valid UTF-8 text.") from exc

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise CsvFormatError("File is empty or has no header row.")

    header = {}
    for name in reader.fieldnames:
        key = (name or "").strip().lower()
        header[name] = ALIASES.get(key, key)
    missing = [c for c in REQUIRED_COLUMNS if c not in header.values()]
    if missing:
        raise CsvFormatError(
            "Missing required column(s): " + ", ".join(missing)
            + ". Required: " + ", ".join(REQUIRED_COLUMNS) + ". Optional: urls."
        )

    result = ParseResult()
    seen_ids: set[str] = set()
    for line_no, raw in enumerate(reader, start=2):
        row = {header[k]: (v or "").strip() for k, v in raw.items() if k in header}
        if not any(row.values()):
            continue  # blank line
        result.total_rows += 1
        if result.total_rows > MAX_ROWS:
            raise CsvFormatError(f"File has more than {MAX_ROWS} rows; split it into smaller files.")

        message_id = row.get("message_id") or None
        problem = None
        timestamp = None
        if not message_id:
            problem = "message_id is empty"
        elif message_id in seen_ids:
            problem = f"duplicate message_id '{message_id}'"
        elif not row.get("sender_id"):
            problem = "sender_id is empty"
        elif not row.get("message_text"):
            problem = "message_text is empty"
        else:
            try:
                timestamp = parse_timestamp(row.get("timestamp", ""))
            except ValueError:
                problem = (
                    f"timestamp '{row.get('timestamp', '')}' is not ISO 8601 "
                    "(example: 2026-11-09T14:02:00Z)"
                )
        if problem or timestamp is None or message_id is None:
            result.errors.append(RowError(line_no, message_id, problem or "invalid row"))
            continue

        seen_ids.add(message_id)
        urls: list[str] = []
        listed = (normalize_url(u) for u in re.split(r"[;|\s]+", row.get("urls", "")) if u)
        for url in [*listed, *extract_urls(row["message_text"])]:
            if url and url not in urls:
                urls.append(url)
        result.messages.append(
            Message(message_id, row["sender_id"], timestamp, row["message_text"], urls)
        )
    if result.total_rows == 0:
        raise CsvFormatError("File has a header but no data rows.")
    return result
