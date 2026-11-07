import sys
import os

from backend.main import health_check, get_members
from backend.memory import _format_date, _parse_memory_result
from backend.llm import clean_json_text

def test_routes():
    h = health_check()
    assert h["status"] == "ok"
    m = get_members()
    assert "Rahul" in m["members"]
    print("Health & members OK:", h, m)

def test_memory_parsing():
    sample_text = "Rahul (explanation, topic: dp): Think of DP as filling a table so you never solve the same subproblem twice."
    item = {
        "text": sample_text,
        "occurred_start": "2026-10-03T19:00:00Z",
        "tags": ["topic:dp", "type:explanation", "person:rahul"]
    }
    parsed = _parse_memory_result(item)
    assert parsed["author"] == "Rahul"
    assert parsed["topic"] == "dp"
    assert parsed["date"] == "Oct 03, 2026"
    assert "filling a table" in parsed["text"]
    print("Memory parsing OK:", parsed)

    # Test regex fallback if tags missing
    item2 = {
        "text": sample_text,
        "tags": []
    }
    parsed2 = _parse_memory_result(item2)
    assert parsed2["author"] == "Rahul"
    assert parsed2["topic"] == "dp"
    print("Regex fallback parsing OK:", parsed2)

def test_json_cleaner():
    raw = '```json\n{"items": [{"topic": "dp"}]}\n```'
    cleaned = clean_json_text(raw)
    assert cleaned == '{"items": [{"topic": "dp"}]}'
    print("JSON cleaner OK")

if __name__ == "__main__":
    test_routes()
    test_memory_parsing()
    test_json_cleaner()
    print("ALL PHASE 1 UNIT TESTS PASSED!")

