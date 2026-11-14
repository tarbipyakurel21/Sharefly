from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Message:
    message_id: str
    sender_id: str
    timestamp: datetime
    text: str
    urls: list[str] = field(default_factory=list)  # normalized (see text_utils.normalize_url)

    def to_dict(self) -> dict:
        return {
            "message_id": self.message_id,
            "sender_id": self.sender_id,
            "timestamp": self.timestamp.isoformat(),
            "text": self.text,
            "urls": self.urls,
        }
