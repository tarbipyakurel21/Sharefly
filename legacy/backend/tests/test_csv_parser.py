import pytest

from app.csv_parser import CsvFormatError, parse_csv

HEADER = "message_id,sender_id,timestamp,message_text,urls\n"


def test_valid_rows_are_parsed_and_urls_normalized():
    data = HEADER + 'm1,s1,2026-11-09T14:02:00Z,"See https://WWW.Example.com/a/?x=1",\n'
    result = parse_csv(data.encode())
    assert result.report()["accepted"] == 1
    assert result.messages[0].urls == ["example.com/a"]
    assert result.messages[0].timestamp.isoformat() == "2026-11-09T14:02:00+00:00"


def test_bad_rows_are_reported_and_good_rows_kept():
    data = HEADER + (
        "m1,s1,2026-11-09T14:02:00Z,hello there,\n"
        "m1,s2,2026-11-09T14:03:00Z,duplicate id,\n"
        "m2,s2,yesterday,bad time,\n"
        "m3,,2026-11-09T14:04:00Z,no sender,\n"
        "m4,s4,2026-11-09 14:05:00,,\n"
    )
    report = parse_csv(data.encode()).report()
    assert (report["total_rows"], report["accepted"], report["rejected"]) == (5, 1, 4)
    assert [e["row"] for e in report["errors"]] == [3, 4, 5, 6]


def test_missing_columns_are_rejected():
    with pytest.raises(CsvFormatError, match="timestamp"):
        parse_csv(b"message_id,sender_id,message_text\nm1,s1,hi\n")


def test_empty_and_non_utf8_files_are_rejected():
    with pytest.raises(CsvFormatError):
        parse_csv(b"")
    with pytest.raises(CsvFormatError):
        parse_csv(HEADER.encode())
    with pytest.raises(CsvFormatError):
        parse_csv(b"\xff\xfe\x00bad")
