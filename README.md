# RecallRoom 🧠👥
> **Community Knowledge Memory for Study Groups** — *So nobody solves the same doubt twice.*

RecallRoom is a hackathon prototype that gives a learning group a persistent collective memory. Powered by **Hindsight**, it remembers peer explanations, past doubts, and quiz results across a 4-person Data Structures & Algorithms (DSA) exam-prep group (**Rahul, Priya, Aman, and Sneha**).

In RecallRoom, **memory is the star of the product**, not an invisible background feature. Visitors can directly observe the difference between a generic AI answer and a memory-backed answer, inspect every recalled memory in a persistent panel, and explore a group gap map.

---

## 📸 Overview & Features

1. **Ask & Compare (`/ask`)**: Ask questions with a **Memory ON / OFF** toggle or side-by-side **Compare Mode**. Answers with Memory ON quote real peers with dates and context.
2. **Persistent Memory Panel**: Displays every recalled memory item with author badge, timestamp, topic tag, and content.
3. **Group Gap Map (`/gaps`)**: Visualizes quiz failure frequencies with Recharts and surfaces collective weak spots via a Hindsight Mental Model (`"Group knowledge gaps"`).
4. **Log Session (`/log`)**: Paste chat messages or meeting notes; Groq LLM extracts structured knowledge items (topic, type, outcome), retaining them in Hindsight.
5. **Targeted Practice (`/practice`)**: Select any group member (default **Sneha**) to generate a targeted challenge based directly on past quiz failures.

---

## 🏛️ Architecture

```
                       +-----------------------------------+
                       |         Next.js Frontend          |
                       |       (Tailwind + Recharts)       |
                       |       http://localhost:3000       |
                       +-----------------+-----------------+
                                         |
                                  REST API Calls
                                         v
                       +-----------------------------------+
                       |         FastAPI Backend           |
                       |       http://localhost:8000       |
                       +--------+-----------------+--------+
                                |                 |
                   Memory Ops   |                 | Completions
         (Retain/Recall/Reflect)|                 |
                                v                 v
               +----------------------+     +--------------------+
               |   Hindsight Engine   |     |      Groq LLM      |
               | (Cloud / Self-hosted)|     | openai/gpt-oss-120b|
               |  Bank: `group-dsa`   |     | (Fallback: qwen3)  |
               +----------------------+     +--------------------+
```

---

## 🧠 How Hindsight Memory is Used

RecallRoom strictly adheres to the official `hindsight-client` library in `backend/memory.py`:

### 1. Retain (`client.retain`)
Every session turn from `backend/seed_sessions.json` or live pasted chat is retained with:
- **`bank_id`**: Scoped to `group-dsa`.
- **`timestamp`**: Precise ISO datetime (e.g. `2026-10-03T19:00:00Z`).
- **`context`**: Session type (`explanation`, `doubt`, `quiz_attempt`, `session_summary`).
- **`document_id`**: Stable session ID (e.g. `s01`, `s11`).
- **Structured Tag Scheme**:
  - `topic:<slug>` (e.g. `topic:dp`, `topic:graphs`, `topic:binary-search`)
  - `type:<kind>` (e.g. `type:explanation`, `type:quiz_attempt`)
  - `person:<name>` (e.g. `person:rahul`, `person:priya`, `person:sneha`)
  - `outcome:<pass|fail>` (for quiz attempts)
- **Content Format**: `"{Author} ({type}, topic: {topic}): {content}"` to enable foolproof attribution parsing.

### 2. Recall (`client.recall`)
- Uses `include_source_facts=True` and `max_tokens=4096`.
- Scopes queries by tags (e.g. `tags=["type:quiz_attempt", "outcome:fail"]`).
- Returns clean dictionaries `{text, date, author, tags, topic}` rendered immediately in the persistent right-hand **Memory Panel**.

### 3. Reflect (`client.reflect`)
- Used for disposition-grounded reasoning when synthesizing overarching guidance without hallucinations.

### 4. Mental Models (`client.create_mental_model` / `client.get_mental_model`)
- Idempotently creates and manages a Hindsight mental model titled **"Group knowledge gaps"** with source query:
  `"Which topics did several members fail or ask repeated doubts about, and who?"`
- Pre-computed summaries are checked first for instantaneous insight on `/gaps`, with automatic fallback to `reflect_on`.

### 5. Memory ON vs Memory OFF
- **Memory OFF**: Standard LLM completion without historical context. Yields generic textbook answers.
- **Memory ON**: Recalls pertinent group sessions and strictly instructs the LLM: *Answer ONLY using the recalled memories, explicitly naming who explained it and when. If nothing was found, state "I don't have anything on that yet."*

> **Note on Data**: All member names, chats, and quiz attempts in `seed_sessions.json` are synthetic.

---

## 🚀 Quickstart & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Environment Configuration
Create or edit `backend/.env`:

```env
# Option A: Hindsight Cloud
HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io
HINDSIGHT_API_KEY=your_hindsight_api_key_here

# Option B: Self-Hosted Hindsight (Docker)
# HINDSIGHT_BASE_URL=http://localhost:8888
# HINDSIGHT_API_KEY=

# LLM Configuration (Groq)
GROQ_API_KEY=your_groq_api_key_here
BANK_ID=group-dsa
LLM_MODEL=openai/gpt-oss-120b
```

### 2. Install Dependencies
```bash
# Backend
pip install -r backend/requirements.txt

# Frontend
cd frontend
npm install
cd ..
```

### 3. Initialize & Seed Memory Bank
Run both idempotent scripts:
```bash
# Step 1: Create memory bank with observations enabled
python setup_bank.py

# Step 2: Seed 28 synthetic study sessions into Hindsight
python seed.py
```

### 4. Start the Application
Run both backend and frontend servers:

```bash
# Terminal 1: Backend
uvicorn backend.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

Open **`http://localhost:3000`** in your browser.

---

## 🧪 Verified Demo Scenarios

Try the 4 preset questions on `/ask` to see the memory difference:

| Question | Generic AI (Memory OFF) | RecallRoom (Memory ON) |
|---|---|---|
| *"What was that shortcut explanation for dynamic programming we talked about last month?"* | Generic memoization vs tabulation definition | Quotes **Rahul on Oct 3**: *"Think of DP as filling a table so you never solve the same subproblem twice... Ask two things: state (notebook row/column) and dependencies."* |
| *"Why did we fail the graph quiz?"* | General tips on graph theory | Explains how **Aman (Oct 15)**, **Priya (Oct 16)**, and **Sneha (Oct 17)** all failed directed cycle detection by misapplying undirected parent checks or visited sets. |
| *"Why does Dijkstra not work with negative edges?"* | Math proof on Dijkstra | Quotes **Priya on Oct 24**: *"Dijkstra is greedy and makes a promise: once a node is popped from the heap, its distance is final... For negative edges use Bellman-Ford."* |
| *"What should I practice before the midterm?"* | Generic DSA curriculum | Cites the group's shaky areas: directed cycle detection and 0/1 knapsack loop direction, referencing **Priya's Nov 3** recap. |

---

## 📂 Project Structure

```
recallroom/
├── AGENTS.md                  # System rules and boundaries
├── README.md                  # Project documentation
├── setup_bank.py              # Root runner for bank setup
├── seed.py                    # Root runner for session seeding
├── backend/
│   ├── .env                   # Secrets (gitignored)
│   ├── .env.example           # Example config
│   ├── requirements.txt       # Python dependencies
│   ├── main.py                # FastAPI routes (ask, log, gaps, practice, health)
│   ├── memory.py              # Hindsight client wrapper (retain, recall, reflect)
│   ├── llm.py                 # Resilient Groq caller with retry & fallback
│   ├── setup_bank.py          # Bank creation script
│   ├── seed.py                # Seeding script
│   ├── seed_sessions.json     # 28 synthetic DSA study sessions
│   └── test_phase1.py         # Unit tests
├── frontend/
│   ├── package.json           # Next.js dependencies
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── ask/page.tsx       # Ask & Compare with live Memory Panel
│   │   ├── gaps/page.tsx      # Gap Map with Recharts & Mental Model
│   │   ├── log/page.tsx       # Chat log ingestion
│   │   └── practice/page.tsx  # Targeted practice for Sneha
│   └── components/
│       ├── Navbar.tsx         # Navigation header
│       └── MemoryPanel.tsx    # Persistent memory list panel
└── reference/
    ├── hindsight_client.py    # Official reference client
    └── docs/                  # API reference documentation
```

