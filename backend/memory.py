import os
import re
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
from dotenv import load_dotenv

from reference.hindsight_client import Hindsight

load_dotenv()

logger = logging.getLogger("recallroom.memory")

HINDSIGHT_BASE_URL = os.getenv("HINDSIGHT_BASE_URL", "https://api.hindsight.vectorize.io")
_raw_api_key = os.getenv("HINDSIGHT_API_KEY", "")
HINDSIGHT_API_KEY = _raw_api_key.strip() if _raw_api_key and _raw_api_key.strip() and not _raw_api_key.strip().startswith("paste_your") else None
BANK_ID = os.getenv("BANK_ID", "group-dsa")

_client: Optional[Hindsight] = None


def get_hindsight_client() -> Hindsight:
    """Initialize and cache the Hindsight client."""
    global _client
    if _client is None:
        logger.info("Initializing Hindsight client at %s (has_key=%s)", HINDSIGHT_BASE_URL, bool(HINDSIGHT_API_KEY))
        _client = Hindsight(base_url=HINDSIGHT_BASE_URL, api_key=HINDSIGHT_API_KEY)
    return _client


def create_or_update_bank(
    bank_id: str = BANK_ID,
    name: str = "DSA Prep Group",
    mission: str = "Remember peer explanations, doubts, quiz results and the group's mistakes with who and when.",
    enable_observations: bool = True,
) -> Any:
    """Create or update the memory bank idempotently."""
    client = get_hindsight_client()
    logger.info("Ensuring bank %s exists...", bank_id)
    return client.create_bank(
        bank_id=bank_id,
        name=name,
        mission=mission,
        reflect_mission=mission,
        enable_observations=enable_observations,
    )


def retain_memory(
    content: str,
    timestamp: Optional[str] = None,
    context: Optional[str] = None,
    tags: Optional[List[str]] = None,
    document_id: Optional[str] = None,
    bank_id: str = BANK_ID,
) -> Any:
    """
    Store a memory in the Hindsight memory bank.
    Includes timestamp, context, tags, and optional document_id.
    """
    client = get_hindsight_client()
    clean_tags = [t.lower().strip() for t in tags] if tags else []
    logger.info("Retaining memory [bank=%s, doc=%s, tags=%s]: %s", bank_id, document_id, clean_tags, content[:60])
    return client.retain(
        bank_id=bank_id,
        content=content,
        timestamp=timestamp,
        context=context,
        document_id=document_id,
        tags=clean_tags,
    )


def _format_date(raw_date: Optional[str]) -> str:
    if not raw_date:
        return ""
    try:
        dt = datetime.fromisoformat(str(raw_date).replace("Z", "+00:00"))
        return dt.strftime("%b %d, %Y")
    except Exception:
        return str(raw_date)[:10]


def _parse_memory_result(item: Any, fallback_date: Optional[str] = None) -> Dict[str, Any]:
    """Parse raw Hindsight recall item into clean frontend format."""
    text = getattr(item, "text", "") or (item.get("text", "") if isinstance(item, dict) else str(item))
    raw_tags = getattr(item, "tags", None) or (item.get("tags") if isinstance(item, dict) else []) or []
    
    raw_date = getattr(item, "occurred_start", None) or getattr(item, "mentioned_at", None) or (item.get("occurred_start") if isinstance(item, dict) else None)
    date_str = _format_date(raw_date or fallback_date)

    author = "Unknown"
    topic = "general"

    # Extract metadata from tags first
    for tag in raw_tags:
        if tag.startswith("person:"):
            author = tag.split(":", 1)[1].capitalize()
        elif tag.startswith("topic:"):
            topic = tag.split(":", 1)[1]

    # If author or topic missing from tags, extract from "{Author} ({type}, topic: {topic}): {content}"
    m = re.match(r"^([A-Za-z0-9_]+)\s*\(([^,\)]+),\s*topic:\s*([^\)]+)\):\s*(.*)$", text, re.DOTALL)
    if m:
        if author == "Unknown":
            author = m.group(1).strip()
        if topic == "general":
            topic = m.group(3).strip()

    return {
        "text": text,
        "date": date_str,
        "author": author,
        "tags": list(raw_tags),
        "topic": topic,
    }


def recall_memories(
    query: str,
    tags: Optional[List[str]] = None,
    bank_id: str = BANK_ID,
    max_tokens: int = 4096,
) -> List[Dict[str, Any]]:
    """
    Recall memories using semantic retrieval and optional tags.
    Uses include_source_facts=True. Returns clean list of dicts.
    """
    client = get_hindsight_client()
    try:
        clean_tags = [t.lower().strip() for t in tags] if tags else None
        response = client.recall(
            bank_id=bank_id,
            query=query,
            tags=clean_tags,
            include_source_facts=True,
            max_tokens=max_tokens,
        )

        results: List[Dict[str, Any]] = []
        seen_texts = set()

        if hasattr(response, "results") and response.results:
            for item in response.results:
                parsed = _parse_memory_result(item)
                if parsed["text"] not in seen_texts:
                    seen_texts.add(parsed["text"])
                    results.append(parsed)

        # Also inspect source_facts if available for deeper attribution
        if hasattr(response, "source_facts") and response.source_facts:
            for sf_id, sf_item in response.source_facts.items():
                parsed_sf = _parse_memory_result(sf_item)
                if parsed_sf["text"] not in seen_texts:
                    seen_texts.add(parsed_sf["text"])
                    results.append(parsed_sf)

        return results
    except Exception as e:
        logger.error("Recall failed for query '%s': %s", query, e)
        return []


def reflect_on(
    query: str,
    tags: Optional[List[str]] = None,
    bank_id: str = BANK_ID,
) -> str:
    """
    Reflect on memories in the bank to synthesize a reasoned response.
    """
    client = get_hindsight_client()
    try:
        clean_tags = [t.lower().strip() for t in tags] if tags else None
        response = client.reflect(
            bank_id=bank_id,
            query=query,
            tags=clean_tags,
        )
        if hasattr(response, "text") and response.text:
            return response.text.strip()
        return "I don't have anything on that yet."
    except Exception as e:
        logger.error("Reflect failed for query '%s': %s", query, e)
        return "I don't have anything on that yet."


def get_or_create_gap_mental_model(bank_id: str = BANK_ID) -> str:
    """
    Get or create the Hindsight mental model 'Group knowledge gaps' idempotently.
    Falls back to reflect_on if needed.
    """
    model_id = "group-knowledge-gaps"
    name = "Group knowledge gaps"
    source_query = "Which topics did several members fail or ask repeated doubts about, and who?"

    client = get_hindsight_client()
    try:
        # Check if already exists
        try:
            existing = client.get_mental_model(bank_id=bank_id, mental_model_id=model_id, detail="content")
            if existing and hasattr(existing, "content") and existing.content:
                return existing.content.strip()
        except Exception:
            pass

        # Also inspect list_mental_models
        models_resp = client.list_mental_models(bank_id=bank_id, detail="content")
        items = getattr(models_resp, "items", []) or []
        for m in items:
            if getattr(m, "id", None) == model_id or getattr(m, "name", None) == name:
                content = getattr(m, "content", "")
                if content:
                    return content.strip()

        # Create mental model if not present
        client.create_mental_model(
            bank_id=bank_id,
            name=name,
            source_query=source_query,
            id=model_id,
        )
        # Attempt to read fresh content
        created = client.get_mental_model(bank_id=bank_id, mental_model_id=model_id, detail="content")
        if created and hasattr(created, "content") and created.content:
            return created.content.strip()
    except Exception as e:
        logger.warning("Mental model creation/retrieval failed: %s. Falling back to reflect_on.", e)

    # Fallback to reflect_on
    return reflect_on(query=source_query, bank_id=bank_id)
