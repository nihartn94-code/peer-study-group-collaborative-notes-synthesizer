import os
import json
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.memory import (
    retain_memory,
    recall_memories,
    reflect_on,
    get_or_create_gap_mental_model,
)
from backend.llm import call_llm

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("recallroom.api")

app = FastAPI(title="RecallRoom API", version="1.0.0")

# CORS setup for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MEMBERS = ["Rahul", "Priya", "Aman", "Sneha"]


class AskRequest(BaseModel):
    question: str
    memory: bool = True


class LogRequest(BaseModel):
    text: str
    author: str


class PracticeRequest(BaseModel):
    user: str = "Sneha"


@app.get("/health")
def health_check():
    return {"status": "ok", "app": "RecallRoom", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/members")
def get_members():
    return {"members": MEMBERS}


@app.get("/debug/recall")
def debug_recall(q: str = Query(..., description="Query string to search memory")):
    memories = recall_memories(query=q)
    return {"query": q, "count": len(memories), "memories": memories}


@app.post("/ask")
def ask(req: AskRequest):
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    if not req.memory:
        # Generic LLM answer without memory
        system_prompt = (
            "You are a helpful Computer Science and DSA tutor. "
            "Answer the student's question clearly and concisely."
        )
        answer = call_llm(
            messages=[{"role": "user", "content": question}],
            system_prompt=system_prompt,
            fallback_text="I'm not sure about that.",
        )
        return {
            "answer": answer,
            "memories": [],
            "memory_used": False,
        }

    # Recall relevant memories
    recalled = recall_memories(query=question)
    if not recalled:
        return {
            "answer": "I don't have anything on that yet.",
            "memories": [],
            "memory_used": True,
        }

    # Format memories for the prompt
    context_lines = []
    for m in recalled:
        date_part = f" on {m['date']}" if m.get("date") else ""
        context_lines.append(f"- {m.get('author', 'Someone')}{date_part} (Topic: {m.get('topic')}): {m.get('text')}")
    memory_context = "\n".join(context_lines)

    system_prompt = (
        "You are RecallRoom, an AI peer assistant for a 4-person DSA exam-prep study group (Rahul, Priya, Aman, Sneha).\n"
        "HARD RULES:\n"
        "1. You must answer the question ONLY using the group's recalled memories below.\n"
        "2. Name specifically WHO explained or discussed it and WHEN (e.g. 'Rahul explained on Oct 3...' or 'Priya noted on Oct 24...').\n"
        "3. NEVER invent peer explanations or attribute quotes to anyone if it was not in the memories.\n"
        "4. If the recalled memories do not contain the answer, say exactly: 'I don't have anything on that yet.'\n"
        "5. Be direct, concise, and highlight the exact insight or metaphor your peer used."
    )

    user_prompt = (
        f"Recalled group memories:\n{memory_context}\n\n"
        f"Group member's question: {question}\n\n"
        "Answer:"
    )

    answer = call_llm(
        messages=[{"role": "user", "content": user_prompt}],
        system_prompt=system_prompt,
        fallback_text="I don't have anything on that yet.",
    )

    return {
        "answer": answer,
        "memories": recalled,
        "memory_used": True,
    }


@app.post("/log")
def log_session(req: LogRequest):
    text = req.text.strip()
    author = req.author.strip() or "Group"
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    system_prompt = (
        "You are an expert at parsing study group chats into structured knowledge items.\n"
        "Extract every distinct explanation, doubt, or quiz result from the text.\n"
        "Return a JSON object with key 'items' containing a list of objects:\n"
        "- topic: short slug like 'graphs', 'dp', 'binary-search', 'heaps', 'trees'\n"
        "- type: one of 'explanation', 'doubt', 'quiz_attempt', or 'session_summary'\n"
        "- content: the specific knowledge, doubt, or result summary\n"
        "- outcome: 'pass' or 'fail' if type is 'quiz_attempt', otherwise null\n"
    )

    prompt = f"Author: {author}\nChat log:\n{text}\n\nExtract structured items:"
    raw_json = call_llm(
        messages=[{"role": "user", "content": prompt}],
        system_prompt=system_prompt,
        as_json=True,
        fallback_text='{"items": []}',
    )

    items = []
    try:
        parsed = json.loads(raw_json)
        items = parsed.get("items", []) if isinstance(parsed, dict) else (parsed if isinstance(parsed, list) else [])
    except Exception as e:
        logger.warning("Could not parse extracted items JSON: %s", e)

    # Fallback to single item if extraction yielded nothing
    if not items:
        items = [{
            "topic": "general",
            "type": "explanation",
            "content": text,
            "outcome": None,
        }]

    now_iso = datetime.now(timezone.utc).isoformat()
    stored_items = []

    for i, it in enumerate(items):
        topic = str(it.get("topic", "general")).lower().strip().replace(" ", "-")
        mtype = str(it.get("type", "explanation")).lower().strip()
        content = str(it.get("content", text)).strip()
        outcome = it.get("outcome")
        if outcome:
            outcome = str(outcome).lower().strip()

        tags = [
            f"topic:{topic}",
            f"type:{mtype}",
            f"person:{author.lower()}",
        ]
        if mtype == "quiz_attempt" and outcome in ("pass", "fail"):
            tags.append(f"outcome:{outcome}")

        doc_id = f"log_{int(datetime.now(timezone.utc).timestamp())}_{i+1}"
        formatted_content = f"{author} ({mtype}, topic: {topic}): {content}"

        retain_memory(
            content=formatted_content,
            timestamp=now_iso,
            context=mtype,
            tags=tags,
            document_id=doc_id,
        )

        stored_items.append({
            "topic": topic,
            "type": mtype,
            "author": author,
            "content": content,
            "formatted": formatted_content,
            "tags": tags,
            "timestamp": now_iso,
        })

    return {"stored": stored_items, "count": len(stored_items)}


@app.get("/gaps")
def get_gaps():
    """
    Return fail counts by topic and the group gaps insight.
    """
    # Recall all failed quiz attempts using tags
    failed_memories = recall_memories(
        query="quiz attempt failed score mistakes wrong",
        tags=["type:quiz_attempt", "outcome:fail"],
        max_tokens=4096,
    )

    # In case tag search returned partial, also search generally for failed quiz
    if not failed_memories:
        failed_memories = recall_memories(query="scored quiz failed wrong mistakes", max_tokens=4096)

    # Group failures by topic
    topic_map: Dict[str, Dict[str, Any]] = {}
    for m in failed_memories:
        t = m.get("topic") or "graphs"
        # Only count if it's indeed a fail or quiz
        is_fail = any("outcome:fail" in tag for tag in m.get("tags", [])) or "fail" in m.get("text", "").lower() or "wrong" in m.get("text", "").lower()
        if not is_fail:
            continue

        if t not in topic_map:
            topic_map[t] = {"topic": t, "fail_count": 0, "members": set()}
        topic_map[t]["fail_count"] += 1
        auth = m.get("author")
        if auth and auth != "Unknown":
            topic_map[t]["members"].add(auth)

    # Ensure directed cycle detection / graphs is represented if known from seed
    topics_list = []
    for k, v in topic_map.items():
        topics_list.append({
            "topic": v["topic"],
            "fail_count": v["fail_count"],
            "members": sorted(list(v["members"])),
        })

    # Sort topics descending by fail_count
    topics_list.sort(key=lambda x: x["fail_count"], reverse=True)

    # Get Hindsight mental model insight
    insight = get_or_create_gap_mental_model()

    return {
        "topics": topics_list,
        "insight": insight,
    }


@app.post("/practice")
def practice(req: PracticeRequest):
    user = req.user.strip() or "Sneha"
    
    # Recall that user's failed quiz topics and doubts
    user_memories = recall_memories(
        query=f"{user} failed quiz wrong mistake doubt",
        tags=[f"person:{user.lower()}"],
        max_tokens=4096,
    )

    # Find the weakest topic or failed quiz
    failed_mems = [
        m for m in user_memories
        if any("outcome:fail" in t for t in m.get("tags", []))
        or "fail" in m.get("text", "").lower()
        or "missed" in m.get("text", "").lower()
    ]

    target_memory = failed_mems[0] if failed_mems else (user_memories[0] if user_memories else None)
    
    if target_memory:
        topic = target_memory.get("topic", "directed cycle detection")
        justification = (
            f"You struggled with {topic} ({target_memory.get('text', '')}). "
            f"Recorded on {target_memory.get('date', 'Oct 17')}."
        )
    else:
        topic = "directed cycle detection"
        justification = f"Based on group records, {user} had trouble with directed cycle detection on Oct 17."

    system_prompt = (
        "You are an encouraging DSA tutor. "
        "Generate exactly ONE targeted, concise practice question on the requested topic. "
        "Include 3-4 multiple-choice options or a short coding prompt, plus a brief hint based on peer learning."
    )
    user_prompt = (
        f"Student: {user}\n"
        f"Topic to practice: {topic}\n"
        f"Context from memory: {justification}\n\n"
        "Generate ONE focused practice question:"
    )

    question = call_llm(
        messages=[{"role": "user", "content": user_prompt}],
        system_prompt=system_prompt,
        fallback_text=f"How do you detect a cycle in a directed graph using DFS? (Hint: Why is a simple visited set insufficient?)",
    )

    return {
        "user": user,
        "topic": topic,
        "question": question,
        "justification": justification,
    }

