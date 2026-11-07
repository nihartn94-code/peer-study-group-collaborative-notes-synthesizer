# MASTER PROMPT (paste into Cursor Agent mode as ONE message)

Before pasting, make sure these exist in your project:
- .cursor/rules/project.mdc
- reference/hindsight_client.py  (plus reference/ docs: retain, recall, reflect, mental-models)
- backend/seed_sessions.json
- backend/.env  (HINDSIGHT_BASE_URL, HINDSIGHT_API_KEY (may be empty if self-hosted), GROQ_API_KEY, BANK_ID=group-dsa)

---- COPY EVERYTHING BELOW THIS LINE ----

@.cursor/rules/project.mdc @reference/hindsight_client.py @backend/seed_sessions.json

Build the complete hackathon prototype "RecallRoom" end to end, in the phases below.
Work through ALL phases yourself. After each phase, actually run the code, check it works,
fix errors, and make a git commit before moving on. Only stop and ask me if you are truly
blocked (for example a missing API key). Follow the project rules file strictly.

## What the product is
A "Community Knowledge Memory" for a group that learns together (demo scenario: a 4-person
DSA exam-prep group: Rahul, Priya, Aman, Sneha). It remembers peer explanations, doubts and
quiz results using Hindsight memory. Memory must be the star: a visitor must clearly SEE the
difference between a generic AI answer and a memory-backed answer, and SEE which memories were
recalled. Keep scope tight. No auth, no extra database.

## Hard rules
- Only use Hindsight client methods and parameters that exist in reference/hindsight_client.py.
  Read it before writing memory code. Never invent methods.
- All Hindsight calls live in backend/memory.py.
- Client init: Hindsight(base_url=..., api_key=...) from .env. api_key may be empty (self-hosted
  Hindsight at http://localhost:8888), so treat an empty key as None.
- Tags on every retain: topic:<x>, type:<x>, person:<x>, and outcome:<pass|fail> for quiz_attempt.
- Groq via the openai Python package with base_url https://api.groq.com/openai/v1.
  Model from env LLM_MODEL, default "openai/gpt-oss-120b".
- Every LLM call goes through ONE helper in backend/llm.py that retries up to 3 times on errors
  or malformed output, then falls back to a plain-text answer. Never crash a request.
- NEVER invent peer explanations or attribute quotes to anyone. If recall is empty, answer
  "I don't have anything on that yet."
- Secrets only in .env, and .env is in .gitignore. Include a .env.example.

## PHASE 1: Backend + memory wrapper
backend/ with FastAPI (CORS for http://localhost:3000), requirements.txt, and:
- memory.py: retain_memory(...), recall_memories(query, tags=None), reflect_on(query), plus
  helpers for the mental model. recall_memories uses include_source_facts=True and returns a
  clean list of dicts: {text, date, author, tags, topic} so the frontend can show them.
  First inspect what a real recall response looks like and adapt the parsing to it. If tags or
  dates are not in the response, parse them from the memory text, which the seed script writes
  in the format "{Author} ({type}, topic: {topic}): {content}".
- llm.py: the retrying Groq helper.
- main.py: GET /health, GET /debug/recall?q=...

## PHASE 2: Bank setup + seed
- setup_bank.py: create_bank for BANK_ID with name "DSA Prep Group", a clear mission about
  remembering peer explanations, doubts, quiz results and the group's mistakes with who and when,
  and enable_observations=True. Safe to run twice.
- seed.py: read backend/seed_sessions.json and retain every session with its timestamp, context
  (the session type), tags, a stable document_id (the session id) and content formatted as
  "{Author} ({type}, topic: {topic}): {content}". Print progress, print errors and continue, safe
  to run twice.
- Run both scripts. Then verify /debug/recall?q=shortcut for dynamic programming returns Rahul's
  "filling a table" explanation. If it does not, debug until it does. This is the checkpoint
  everything depends on.

## PHASE 3: Core API
- POST /ask {question, memory: bool}:
  - memory=false: send only the question to the LLM (generic answer).
  - memory=true: recall relevant memories, then ask the LLM to answer ONLY using them, naming who
    explained it and when. Return {answer, memories, memory_used}.
  - Always return the recalled memories so the UI can show them.
- POST /log {text, author}: use the LLM to extract explanations, doubts and quiz results from the
  pasted chat into structured items (topic, type, content, outcome if any), then retain each with
  the correct tags and the current timestamp. Return what was stored.
- GET /gaps: return {topics: [{topic, fail_count, members: [...]}], insight}. Build fail counts
  from memories tagged type:quiz_attempt and outcome:fail, grouped by topic. For "insight", create
  (once, idempotently) a Hindsight mental model named "Group knowledge gaps" with source_query
  "Which topics did several members fail or ask repeated doubts about, and who?" using the real
  create/get mental model methods in the reference client, and fall back to reflect_on if needed.
- POST /practice {user}: recall that user's failed quiz topics, pick the weakest, and have the LLM
  write ONE short practice question on it, plus the memory that justified the choice
  (for example "You failed this on Oct 17").
- GET /members: list the members (from seed file or a constant).

## PHASE 4: Frontend (Next.js + Tailwind, in frontend/)
Clean, modern, professional look. Pages:
1. Landing (/): one-line pitch "Your group's memory, so nobody solves the same doubt twice",
   a short 3-step explanation, and a "Try the demo" button.
2. Ask (/ask): question box with 4 clickable demo questions (from seed_sessions.json demo_queries),
   a clearly visible Memory ON/OFF switch, a "Compare" mode that shows the generic answer and the
   memory answer SIDE BY SIDE, and a persistent right-hand MEMORY PANEL listing each recalled
   memory (author, date, topic tag, text). Highlight recalled memories visibly when an answer arrives.
3. Gap Map (/gaps): a bar chart (recharts) of topics by failure count, who struggled, and the
   "What the group struggles with" insight text.
4. Log Session (/log): paste a chat, submit, show the extracted items that were stored.
5. Practice (/practice): choose a member (default Sneha), generate one targeted question, show why
   it was chosen from memory.
Shared layout with navigation. Loading states, error states, and a friendly message when recall is
empty. The Memory Panel must be visible on the Ask page at all times.

## PHASE 5: Polish and docs
- A one-command dev setup: root README with exact steps to run backend and frontend, including both
  options for Hindsight (Cloud with API key, or self-hosted at http://localhost:8888).
- README sections: problem, solution, screenshots placeholder, architecture diagram (ASCII), and a
  detailed "How Hindsight memory is used" section covering retain (tags, timestamps, document_id),
  recall (tag-scoped, include_source_facts), reflect, mental model, and the Memory ON/OFF
  comparison. Note that all data is synthetic.
- Add a scripts section: setup_bank.py, then seed.py, then run.
- Final check: from a clean start, run setup_bank, seed, backend and frontend, then test all four
  demo queries and /gaps and /practice, and fix anything broken.

## Done when
- The 4 demo questions give clearly better answers with memory ON than OFF.
- The Memory Panel shows the recalled memories with author and date.
- The gap map shows directed cycle detection as the top gap (Aman, Priya, Sneha).
- Practice for Sneha targets cycle detection and cites her Oct 17 failure.
- The README explains how Hindsight is used.

At the end, give me a short summary of what you built, how to run it, and anything that did not
work or that you assumed.
