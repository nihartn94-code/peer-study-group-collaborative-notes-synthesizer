import os
import json
import re
import time
import logging
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

logger = logging.getLogger("recallroom.llm")

GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
DEFAULT_MODEL = os.getenv("LLM_MODEL", "openai/gpt-oss-120b")
FALLBACK_MODEL = "qwen/qwen3-32b"


def get_openai_client() -> Optional[OpenAI]:
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key or api_key.startswith("paste_your"):
        return None
    try:
        return OpenAI(base_url=GROQ_BASE_URL, api_key=api_key)
    except Exception as e:
        logger.warning("Could not initialize OpenAI client: %s", e)
        return None


def clean_json_text(text: str) -> str:
    """Extract json from markdown code fences or raw string."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1).strip()
    return text


def call_llm(
    messages: List[Dict[str, str]],
    system_prompt: Optional[str] = None,
    temperature: float = 0.2,
    as_json: bool = False,
    fallback_text: str = "I don't have anything on that yet.",
    max_retries: int = 3,
) -> str:
    """
    Execute Groq LLM completion with up to max_retries attempts.
    Never crashes a request. Falls back to a safe answer after retries fail.
    """
    client = get_openai_client()
    if client is None:
        logger.warning("GROQ_API_KEY is not configured or invalid. Returning fallback text.")
        if as_json:
            return json.dumps({"items": [], "error": "GROQ_API_KEY not configured"})
        return fallback_text

    full_messages: List[Dict[str, str]] = []
    if system_prompt:
        full_messages.append({"role": "system", "content": system_prompt})
    full_messages.extend(messages)

    current_model = DEFAULT_MODEL
    last_error = None

    for attempt in range(1, max_retries + 1):
        try:
            # Use fallback model if primary model failed on previous attempt
            if attempt > 1 and current_model == DEFAULT_MODEL:
                current_model = FALLBACK_MODEL

            kwargs: Dict[str, Any] = {
                "model": current_model,
                "messages": full_messages,
                "temperature": temperature,
            }
            if as_json:
                kwargs["response_format"] = {"type": "json_object"}

            response = client.chat.completions.create(**kwargs)
            choice = response.choices[0]
            content = choice.message.content or ""
            content = content.strip()

            if as_json:
                cleaned = clean_json_text(content)
                # Validate that it parses as JSON
                json.loads(cleaned)
                return cleaned

            if content:
                return content

            raise ValueError("Empty response received from LLM")
        except Exception as e:
            last_error = e
            logger.warning("LLM attempt %d failed with error: %s", attempt, str(e))
            time.sleep(0.5 * attempt)

    logger.error("All %d LLM attempts failed. Last error: %s. Returning fallback.", max_retries, str(last_error))
    if as_json:
        return json.dumps({"error": str(last_error), "fallback": fallback_text})
    return fallback_text

