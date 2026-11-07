import json
from backend.main import ask, get_gaps, practice, AskRequest, PracticeRequest
from backend.memory import recall_memories

def test_four_demo_queries():
    print("\n=== Testing Demo Query 1 (DP Shortcut) ===")
    req1_off = AskRequest(question="What was that shortcut explanation for dynamic programming we talked about last month?", memory=False)
    resp1_off = ask(req1_off)
    print("Memory OFF Answer:", resp1_off["answer"][:100], "...")
    assert resp1_off["memory_used"] is False

    req1_on = AskRequest(question="What was that shortcut explanation for dynamic programming we talked about last month?", memory=True)
    resp1_on = ask(req1_on)
    print("Memory ON Answer:", resp1_on["answer"])
    print("Recalled memories count:", len(resp1_on["memories"]))
    assert resp1_on["memory_used"] is True
    assert len(resp1_on["memories"]) > 0
    assert any("Rahul" in m["author"] for m in resp1_on["memories"])

    print("\n=== Testing Demo Query 2 (Graph Quiz Failures) ===")
    req2_on = AskRequest(question="Why did we fail the graph quiz?", memory=True)
    resp2_on = ask(req2_on)
    print("Memory ON Answer:", resp2_on["answer"])
    authors = set(m["author"] for m in resp2_on["memories"])
    print("Recalled Authors:", authors)
    assert "Aman" in authors or "Priya" in authors or "Sneha" in authors

    print("\n=== Testing Demo Query 3 (Midterm Practice) ===")
    req3_on = AskRequest(question="What should I practice before the midterm?", memory=True)
    resp3_on = ask(req3_on)
    print("Memory ON Answer:", resp3_on["answer"])

    print("\n=== Testing Demo Query 4 (Dijkstra Negative Edges) ===")
    req4_on = AskRequest(question="Why does Dijkstra not work with negative edges?", memory=True)
    resp4_on = ask(req4_on)
    print("Memory ON Answer:", resp4_on["answer"])
    assert any("Priya" in m["author"] for m in resp4_on["memories"])

def test_gap_map():
    print("\n=== Testing Gap Map (/gaps) ===")
    gaps = get_gaps()
    print("Topics:", gaps["topics"])
    print("Insight preview:", gaps["insight"][:150], "...")
    assert len(gaps["topics"]) > 0
    top_gap = gaps["topics"][0]
    print("Top Gap:", top_gap)
    assert "graph" in top_gap["topic"].lower() or "cycle" in top_gap["topic"].lower() or "dp" in top_gap["topic"].lower()
    assert "Sneha" in top_gap["members"] or "Aman" in top_gap["members"] or "Priya" in top_gap["members"]

def test_practice_for_sneha():
    print("\n=== Testing Practice for Sneha (/practice) ===")
    req = PracticeRequest(user="Sneha")
    res = practice(req)
    print("User:", res["user"])
    print("Topic:", res["topic"])
    print("Justification:", res["justification"])
    print("Generated Question:", res["question"])
    assert res["user"] == "Sneha"
    assert "cycle" in res["topic"].lower() or "graph" in res["topic"].lower()
    assert "Oct 17" in res["justification"] or "graphs" in res["justification"].lower()

if __name__ == "__main__":
    test_four_demo_queries()
    test_gap_map()
    test_practice_for_sneha()
    print("\n>>> ALL CRITICAL ACCEPTANCE TESTS PASSED! <<<")
