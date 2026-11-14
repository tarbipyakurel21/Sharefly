"""Small, dependency-free helpers for URL and text comparison."""
from __future__ import annotations

import re
from urllib.parse import urlsplit

URL_RE = re.compile(r"https?://[^\s<>\"')\]]+", re.IGNORECASE)
TOKEN_RE = re.compile(r"[a-z0-9$]+")
STOPWORDS = frozenset(
    "a an and are as at be by for from has have in is it of on or that the this to "
    "was will with you your".split()
)


def normalize_url(url: str) -> str:
    """Reduce a URL to host + path so trivially different copies compare equal."""
    url = url.strip().rstrip(".,;:!?")
    if not url:
        return ""
    if "://" not in url:
        url = "http://" + url
    parts = urlsplit(url)
    host = (parts.hostname or "").lower()
    if host.startswith("www."):
        host = host[4:]
    if not host:
        return ""
    return host + parts.path.rstrip("/")


def extract_urls(text: str) -> list[str]:
    return [u for u in (normalize_url(m) for m in URL_RE.findall(text)) if u]


def tokenize(text: str) -> frozenset[str]:
    """Lowercased word set with URLs and common stopwords removed."""
    text = URL_RE.sub(" ", text.lower())
    return frozenset(t for t in TOKEN_RE.findall(text) if t not in STOPWORDS)


def jaccard(a: frozenset[str], b: frozenset[str]) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)
