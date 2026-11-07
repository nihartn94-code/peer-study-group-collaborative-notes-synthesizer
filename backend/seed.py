import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend can be imported from root or backend/
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv()

from backend.memory import retain_memory, BANK_ID


def main():
    seed_path = Path(__file__).resolve().parent / "seed_sessions.json"
    if not seed_path.exists():
        seed_path = ROOT_DIR / "backend" / "seed_sessions.json"

    if not seed_path.exists():
        print(f"Error: Could not find seed_sessions.json at {seed_path}")
        sys.exit(1)

    with open(seed_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    sessions = data.get("sessions", [])
    print(f"Found {len(sessions)} sessions in {seed_path.name}. Seeding into bank '{BANK_ID}'...")

    success = 0
    errors = 0

    for idx, s in enumerate(sessions, 1):
        sid = s.get("id")
        author = s.get("author", "Unknown")
        stype = s.get("type", "session")
        topic = s.get("topic", "general")
        content = s.get("content", "")
        timestamp = s.get("timestamp")
        tags = s.get("tags", [])

        # Content formatted as "{Author} ({type}, topic: {topic}): {content}"
        formatted_content = f"{author} ({stype}, topic: {topic}): {content}"

        try:
            retain_memory(
                content=formatted_content,
                timestamp=timestamp,
                context=stype,
                tags=tags,
                document_id=sid,
                bank_id=BANK_ID,
            )
            success += 1
            print(f"[{idx}/{len(sessions)}] Retained {sid} | {author} on {topic}")
        except Exception as e:
            errors += 1
            print(f"[{idx}/{len(sessions)}] Error retaining {sid} ({author} on {topic}): {e}")
            # Continue on error as per requirements

    print(f"\n--- Seeding summary ---")
    print(f"Total: {len(sessions)} | Successfully retained: {success} | Errors: {errors}")


if __name__ == "__main__":
    main()

