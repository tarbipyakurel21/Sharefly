from datetime import datetime, timedelta, timezone

from app.config import SAMPLE_CSV
from app.csv_parser import parse_csv
from app.detection import STATUS_UNCONFIRMED, detect_clusters
from app.models import Message
from app.text_utils import extract_urls

T0 = datetime(2026, 11, 9, 14, 0, tzinfo=timezone.utc)
SCAM = "Earn $400 weekly as a remote campus assistant, no experience needed, apply at the link today"


def msg(mid, sender, minutes, text, urls=None):
    return Message(mid, sender, T0 + timedelta(minutes=minutes), text,
                   urls if urls is not None else extract_urls(text))


def test_unrelated_messages_are_not_flagged():
    messages = [
        msg("a", "s1", 0, "Chess club meets tonight at seven in the student union"),
        msg("b", "s2", 5, "Office hours move to Tuesday afternoon this week only"),
        msg("c", "s3", 9, "Flu shots are available at the health center all week"),
    ]
    assert detect_clusters(messages) == []


def test_shared_url_similar_text_and_timing_combine():
    messages = [
        msg("a", "s1", 0, SCAM + " https://jobs.example/apply"),
        msg("b", "s2", 10, SCAM + " http://www.jobs.example/apply/"),
        msg("c", "s3", 20, SCAM + " https://jobs.example/apply?ref=3"),
    ]
    (cluster,) = detect_clusters(messages)
    assert cluster["message_ids"] == ["a", "b", "c"]
    assert cluster["accounts"] == ["s1", "s2", "s3"]
    assert {e["rule"] for e in cluster["evidence"]} == {
        "shared_url", "similar_text", "close_timing", "multiple_accounts"}
    assert cluster["score"] == sum(e["points"] for e in cluster["evidence"]) == 95
    assert cluster["level"] == "high"


def test_same_account_repeating_itself_is_not_coordination():
    messages = [msg("a", "s1", 0, SCAM + " https://jobs.example/apply"),
                msg("b", "s1", 5, SCAM + " https://jobs.example/apply")]
    assert detect_clusters(messages) == []


def test_timing_alone_never_links_messages():
    messages = [msg("a", "s1", 0, "Lab seven is posted and due next Friday at five"),
                msg("b", "s2", 1, "Intramural volleyball sign-ups close on Friday at noon")]
    assert detect_clusters(messages) == []


def test_distant_similar_messages_get_no_timing_evidence():
    messages = [msg("a", "s1", 0, SCAM), msg("b", "s2", 600, SCAM)]
    (cluster,) = detect_clusters(messages)
    assert [e["rule"] for e in cluster["evidence"]] == ["similar_text"]
    assert cluster["level"] == "low"


def test_every_cluster_is_marked_unconfirmed_with_limitations():
    messages = [msg("a", "s1", 0, SCAM), msg("b", "s2", 5, SCAM)]
    for cluster in detect_clusters(messages):
        assert cluster["status"] == STATUS_UNCONFIRMED
        assert cluster["limitations"]


def test_sample_dataset_expected_clusters():
    messages = parse_csv(SAMPLE_CSV.read_bytes()).messages
    clusters = detect_clusters(messages)
    found = {tuple(c["message_ids"]): c["level"] for c in clusters}
    assert found == {
        ("m007", "m008", "m009", "m010"): "high",
        ("m001", "m002", "m003", "m004", "m005", "m006"): "high",
        ("m011", "m012"): "low",
        ("m013", "m014"): "low",  # legitimate shared campus link: shown, but low
    }


def test_cluster_key_is_stable_and_order_independent():
    messages = [msg("a", "s1", 0, SCAM), msg("b", "s2", 5, SCAM)]
    (first,) = detect_clusters(messages)
    (second,) = detect_clusters(list(reversed(messages)))
    assert first["key"] == second["key"] and len(first["key"]) == 12
