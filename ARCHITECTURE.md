# Living Papers v2 — Architecture

A technical deep-dive into how the system is built and why.

---

## Core Philosophy: Client is a Rendering Shell

Living Papers v2 uses a strict **client-server separation**. All computation, state, and secrets live on the server. The client is a pure rendering shell.

**Why this matters:**
- Web agent crawling hits arbitrary academic domains — impossible from a browser due to CORS
- PDF extraction, Claude API calls, GitHub cloning, and Daytona sandbox provisioning are I/O-bound, long-running, and secret-dependent
- Exposing any of this client-side would leak API keys and block the UI thread

The API surface between client and server is a clean, stable schema: structured `ProcessedPaper` objects with sections, equations, figures, variables, and notebook cells. The frontend never knows how they were produced.

---

## System Diagram

```
User browser
    │
    ├─ GET /                    Landing page (search UI)
    ├─ GET /paper/[id]          Living Page (interactive paper view)
    └─ GET /thread/[id]         Research Thread (multi-paper view)
         │
         ▼
    Next.js API Routes (all server-side)
         │
    ┌────┴────────────────────────────────────────────────┐
    │  /api/search                                        │
    │    ├── Browser Use Cloud v3 (primary, structured)   │
    │    ├── Browser Use Cloud v1 (fallback)              │
    │    └── arXiv REST API (fallback)                    │
    │                                                     │
    │  /api/process                                       │
    │    ├── Demo data check (demo-fallback.json)         │
    │    └── Anthropic Claude API                         │
    │                                                     │
    │  /api/synthesize                                    │
    │    └── Anthropic Claude API (multi-paper synthesis) │
    │                                                     │
    │  /api/prerequisite                                  │
    │    └── Anthropic Claude API                         │
    │                                                     │
    │  /api/notebook                                      │
    │    ├── Daytona workspace (if repoUrl provided)      │
    │    └── Anthropic Claude API (notebook generation)  │
    └─────────────────────────────────────────────────────┘
         │
    Convex (real-time data layer)
    ├── searchJobs
    ├── papers (processed)
    ├── processingJobs
    ├── researchThreads
    └── notebooks
```

---

## Data Flow

### Search Query → Paper List

```
1. User types query in SearchInput
2. POST /api/search { query }
3. Server tries Browser Use v3 API → searchWithBrowserUseV3() (structured output_schema)
4. If v3 fails → falls back to v1 API → searchWithBrowserUse()
5. If BU fails/unavailable → searchArxiv() fallback
6. If query matches "mechanistic interpretability" → demo-fallback.json
7. Returns { papers: PaperMetadata[], source: string }
8. Client renders PaperList with checkboxes
```

### Paper Selection → Living Page

```
1. User selects papers and clicks "Read N papers →"
2. POST /api/process { paper: PaperMetadata } for each selected paper (parallel)
3. Server checks if paper.id is a demo paper → demo-fallback.json
4. Otherwise: processPaperWithClaude(paper) → structured JSON
5. Merges Claude output with PaperMetadata → ProcessedPaper
6. Client stores ProcessedPaper in sessionStorage keyed by paper.id
7. Client navigates to /paper/[id] for the first completed paper
8. Living Page reads from sessionStorage and renders all components
```

### Prerequisite Concept Detection

```
1. User clicks "?" on a paragraph → DontUnderstandButton
2. POST /api/prerequisite { paragraph, paperTitle }
3. findPrerequisiteConcept(paragraph, paperTitle) via Claude
4. Returns the missing foundational concept (not a simplification)
5. Rendered inline below the paragraph
```

### Notebook Generation

```
1. Paper page loads → NotebookEmbed requests cells
2. POST /api/notebook { paper, repoUrl? }
3. If repoUrl: Daytona createWorkspace() → sandboxUrl
4. generateNotebookCells(paper, repoUrl) via Claude
5. Returns { cells: NotebookCell[], sandboxUrl? }
6. NotebookEmbed renders cells; code cells runnable in sandboxUrl iframe
```

---

## Convex Schema

Convex is the real-time data layer. It stores:

| Table | Purpose |
|---|---|
| `searchJobs` | Tracks pending/complete search requests with results |
| `papers` | Fully processed papers with all enriched fields |
| `processingJobs` | Per-paper processing status (pending/processing/complete/error) |
| `researchThreads` | Multi-paper synthesis threads |
| `notebooks` | Generated notebook cells per paper |

The client subscribes to Convex queries to get live updates as papers process. This enables the "paper 1 of 5 ready — start reading now" experience without polling.

---

## API Route Reference

### `POST /api/search`

**Request:** `{ query: string }`

**Response:** `{ papers: PaperMetadata[], source: "browser-use" | "arxiv" | "demo" }`

**Logic:**
1. Normalize query to lowercase
2. If query contains "mechanistic interpretability" → return demo data
3. Try `searchWithBrowserUseV3(query)` (v3 API with structured `output_schema`)
4. If v3 fails → try `searchWithBrowserUse(query)` v1 fallback
5. On failure → `searchArxiv(query)` from `src/lib/arxiv.ts`

---

### `POST /api/synthesize`

**Request:** `{ papers: PaperMetadata[], researchQuestion: string }`

**Response:** `{ synthesis: string }`

**Logic:**
- Calls `synthesizePapers(papers, researchQuestion)` from `src/lib/claude.ts`
- Builds context from up to 10 papers (title, authors, abstract)
- Returns a synthesized answer that highlights key contributions and contradictions

---

### `POST /api/process`

**Request:** `{ paper: PaperMetadata }`

**Response:** `{ paper: ProcessedPaper }`

**Logic:**
1. Check if `paper.id` matches a demo paper ID → return demo `ProcessedPaper`
2. Call `processPaperWithClaude(paper)` — returns partial processed data
3. Merge with original `PaperMetadata` to produce complete `ProcessedPaper`

---

### `POST /api/prerequisite`

**Request:** `{ paragraph: string, paperTitle: string }`

**Response:** `{ concept: string, definition: string, whyNeeded: string, learnMoreUrl?: string }`

**Logic:**
- Calls `findPrerequisiteConcept(paragraph, paperTitle)` from `src/lib/claude.ts`
- Returns the foundational concept missing from the reader's knowledge, not a simplification

---

### `POST /api/notebook`

**Request:** `{ paper: PaperMetadata, repoUrl?: string }`

**Response:** `{ cells: NotebookCell[], sandboxUrl?: string }`

**Logic:**
1. If `repoUrl`: call `createWorkspace(repoUrl)` from `src/lib/daytona.ts` → get `sandboxUrl`
2. Call `generateNotebookCells(paper, repoUrl)` from `src/lib/claude.ts`
3. Return cells + optional sandbox URL

---

## Component Architecture

```
app/page.tsx (Landing)
├── SearchInput           — query input with loading state
└── PaperList             — selectable list with processing indicators

app/paper/[id]/page.tsx (Living Page)
├── HeaderZone            — title, authors, TL;DR, reading time, relevance
├── ReadingModeToggle     — Skim / Read / Deep Dive (sticky)
├── RabbitHoleStack       — left-margin card trail
├── GlossarySidebar       — right-side term glossary
├── KeyboardShortcuts     — overlay help panel
├── DepthMeter            — bottom-right engagement ring
├── SpacedReExposureStrip — bottom ambient recall strip
├── CitationGraph         — D3 graph overlay (toggle C)
└── SectionRenderer (×N)  — per-section renderer
    ├── ProgressiveReveal  — scroll-triggered layer reveal
    ├── EquationRenderer   — MathJax blur-to-focus
    ├── VariableHoverCard  — inline variable highlighting
    ├── FigureViewer       — figure with fullscreen
    ├── DontUnderstandButton — prerequisite concept trigger
    ├── EvidenceChain      — claim→experiment→result chain
    ├── NotationWarning    — redefined variable badge
    └── FollowThatCheckpoint — "Did you follow that?" prompt

app/thread/[id]/page.tsx (Research Thread)
├── Thread overview
├── Timeline view
└── Paper list with navigation

RabbitHolePanel            — slides in on citation/term click
NotebookEmbed              — notebook cells + sandbox iframe
```

---

## State Management

Living Papers v2 uses three layers of state:

| Layer | What it stores | Why |
|---|---|---|
| `sessionStorage` | `ProcessedPaper` objects keyed by `paper:${id}` | Fast client-side access; survives page navigation within session |
| Convex | Search results, processing jobs, threads | Real-time sync, persistent across devices |
| React `useState` | UI state (reading mode, active section, expanded equations) | Ephemeral UI interactions |

**No Redux/Zustand.** React state + sessionStorage is sufficient because the heavy data lives in Convex and flows down through props.

---

## Integration Points

### Browser Use Cloud (`src/lib/browseruse.ts`)
- Called by `/api/search`
- **v3 API (primary):** `searchWithBrowserUseV3(query)` — uses `output_schema` for structured JSON output
- **v1 API (fallback):** `searchWithBrowserUse(query)` — text-parsing fallback when v3 is unavailable
- **Browser API:** `createBrowserSession()` / `stopBrowserSession()` — provisions a remote browser with CDP URL for custom Playwright-based scraping
- Returns `PaperMetadata[]` covering 11 open-access sources

### Anthropic Claude (`src/lib/claude.ts`)
- `parsePaper(title, authors, pdfText, sourceUrl)` — full paper enrichment
- `findPrerequisiteConcept(paragraph, paperTitle)` — prerequisite detection
- `generateNotebookCells(title, sections, githubUrl?)` — notebook generation
- `synthesizePapers(papers, researchQuestion)` — multi-paper synthesis pipeline
- All calls are server-side only (API key never exposed to client)

### Daytona (`src/lib/daytona.ts`)
- `createWorkspace(repoUrl)` — provisions an isolated sandbox
- Returns a `sandboxUrl` for iframe embedding in `NotebookEmbed`

### MathJax 3 (`src/lib/mathjax.ts`)
- Loaded lazily from CDN when first needed (client-side only)
- `typesetMath(element?)` — typesets all math in an element
- `renderLatex(latex)` — renders a LaTeX string to SVG HTML
- Used by `EquationRenderer` which manages blur-to-focus reveal via `IntersectionObserver`

---

## Design System

All components use this exact palette:

| Token | Value | Usage |
|---|---|---|
| Background | `#0a0e14` | Page background |
| Card | `#111827` | Component cards |
| Border | `#1a2235` | Subtle borders |
| Text | `#e8e0d0` | Body text |
| Teal | `#00d4aa` | Interactive elements, equations, highlights |
| Amber | `#f5a623` | Code, variables, warnings |
| Body font | `IBM Plex Serif, serif` | All body text |
| Code font | `JetBrains Mono, monospace` | Code, math, symbols |
| Header font | `Syne, sans-serif` | Titles and UI labels |

---

## Security

- All API keys are server-side only (Next.js API routes, never `NEXT_PUBLIC_`)
- Demo mode works without any credentials
- No secrets are embedded in the client bundle
- Daytona sandboxes are isolated per-session
