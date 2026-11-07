# Cursor prompts (paste one at a time, in Agent mode; test after each)

## Before you start
1. Put `hindsight_client.py` and the Hindsight `docs/developer/api/` folder into `reference/`.
2. Put the `.cursor/rules/project.mdc` file from this folder into your project.
3. Put `backend/seed_sessions.json` into your project's `backend/` folder.
4. Create `backend/.env` with:
   HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io
   HINDSIGHT_API_KEY=your_key
   GROQ_API_KEY=your_key
   BANK_ID=group-dsa

---

## PROMPT 1: Backend skeleton + memory wrapper

@reference/hindsight_client.py @.cursor/rules/project.mdc

Create a FastAPI app in `backend/`:
- `main.py` with CORS enabled for http://localhost:3000 and a GET `/health` route.
- `memory.py` that creates one Hindsight client from `.env`
  (HINDSIGHT_BASE_URL, HINDSIGHT_API_KEY) and exposes three functions:
  `retain_memory(content, author, timestamp, context, tags)`,
  `recall_memories(query, tags=None)` and `reflect_on(query)`.
  Use only methods and parameters that exist in the reference client.
  `recall_memories` must use `include_source_facts=True` and return a plain list
  of dicts (text, date, tags, author if available) so the frontend can show them.
- `requirements.txt` with fastapi, uvicorn, python-dotenv, hindsight-client, openai.
- Add a GET `/debug/recall?q=...` route that returns the raw recall result so I can
  inspect what Hindsight returns.

Do not build anything else yet. Tell me how to run it.

---

## PROMPT 2: Bank setup script

@backend/memory.py @reference/hindsight_client.py

Write `backend/setup_bank.py`. It should call `create_bank` for bank id from
`BANK_ID` with:
- name: "DSA Prep Group"
- mission: "Remember explanations that peers gave, doubts people raised, quiz
  results, and concepts the group got wrong. Always keep who said it and when."
- enable_observations=True

Make it safe to run twice (catch the already-exists case and print a message).
Check the real `create_bank` signature in the reference file before writing it.

---

## PROMPT 3: Seed script (loads my prepared data, do NOT generate new data)

@backend/memory.py @backend/seed_sessions.json

Write `backend/seed.py` that:
1. Reads `backend/seed_sessions.json` (it has a `sessions` array; each item has
   `timestamp`, `author`, `type`, `topic`, `tags`, `content`).
2. For each session, calls `retain_memory` with:
   - content: "{Author} ({type}, topic: {topic}): {content}"
   - timestamp: the session timestamp
   - context: the session type
   - tags: the session tags
3. Prints progress like "12/27 retained".
4. Skips nothing silently: if a retain fails, print the error and continue.
5. Is idempotent: use a stable `document_id` per session (its `id` field) so
   running it twice updates instead of duplicating. Check the reference client's
   retain signature to do this correctly.

After running, tell me how to verify the memories in the Hindsight UI.

---

## Quick test after Prompt 3 (do this yourself)
Hit `/debug/recall?q=shortcut for dynamic programming` and confirm the result
mentions Rahul's "filling a table" explanation. If it does, memory works and you
can move on to the /ask endpoint, memory toggle, and UI.
