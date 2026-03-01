# Living Papers v2

> *Living Papers v2 uses web agents to find the most relevant research papers and turn them into interactive, runnable, learnable web experiences — so researchers always stay at the bleeding edge.*

Built for the **Browser Use × YC Hackathon, March 2026**.

---

## What Is This?

Living Papers v2 is a **web agent-powered research intelligence platform** that autonomously surfaces, parses, and transforms scientific papers into deeply interactive learning environments.

It eliminates the most counterproductive task in research: struggling to read and extract value from papers you barely have time to find.

---

## Demo

Try it instantly — no API keys required:

1. Open the app and click **"Try demo: Mechanistic Interpretability"**
2. The demo loads a fully processed paper with all interactive features enabled.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 15 (App Router) | React server components + API routes |
| Styling | Tailwind CSS | Utility-first styles |
| Real-time | Convex | Live processing state, paper storage |
| Auth | Clerk | User sessions |
| Web Agent | Browser Use Cloud | Autonomous research paper search |
| AI | Anthropic Claude | Paper parsing, summarization, notebook generation |
| Sandboxes | Daytona | Isolated code execution environments |
| Math | MathJax 3 | LaTeX equation rendering |
| Graphs | D3.js | Citation graph visualization |

---

## Features

- **Web Agent Search** — Autonomous search across arXiv, bioRxiv, PubMed, Semantic Scholar using Browser Use Cloud
- **Relevance Ranking** — Papers ranked by semantic relevance to your query, not just recency
- **Interactive Math** — Every equation blur-to-focus reveals, click to expand derivation steps with narration
- **Variable Hover Cards** — Every variable highlighted; hover for definition, units, and role in paper
- **Notation Consistency Checker** — Flags where a variable is redefined across sections
- **Figure Viewer** — Full-screen figures linked to referencing paragraphs
- **Reading Mode Toggle** — Skim / Read / Deep Dive modes
- **Progressive Reveal** — Sections unlock in layers as you scroll: orientation → text → math → figures
- **"I Don't Understand This"** — Click `?` on any paragraph to surface the missing prerequisite concept
- **Evidence Chains** — Collapsible claim → experiment → figure → result → conclusion chains
- **Citation Graph** — D3 force-directed graph of citations; click any node to rabbit-hole into it
- **Rabbit Hole Navigation** — Spatial layered card trail; `[`/`]` to navigate back/forward
- **Live Notebooks** — Daytona sandboxes with runnable code from paper repositories
- **Depth Meter** — Private SVG ring tracking your engagement depth (no badges, no scores)
- **Spaced Re-Exposure Strip** — Ambient bottom strip surfacing terms you haven't revisited
- **"Did You Follow That?" Checkpoints** — Free-text prompts between sections
- **Research Threads** — Multi-paper synthesis with timeline view
- **Glossary Sidebar** — Auto-extracted domain terms with frequency bars
- **Keyboard Shortcuts** — Full keyboard navigation (see table below)
- **Mobile / Touch** — Responsive layout, swipe between papers, pinch-to-zoom figures

---

## Architecture Overview

Living Papers v2 uses a strict **client-server separation**: all computation, state, and secrets live on the server. The client is a pure rendering shell.

```
Browser Use Cloud ──► /api/search  ──► arXiv fallback
                                              │
                                     PaperMetadata[]
                                              │
Claude API ──────────► /api/process ──► ProcessedPaper
                                              │
Daytona ─────────────► /api/notebook ──► NotebookCell[]
                                              │
Convex ◄──────────────────────────────────────┘
   │
   └─► React frontend (pure rendering shell)
```

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full technical deep-dive.

---

## Getting Started

See [`GETTING_STARTED.md`](./GETTING_STARTED.md) for full setup instructions.

**Quick start (demo mode — no API keys needed):**

```bash
git clone https://github.com/SaahithV6/YCBU-3-2026.git
cd YCBU-3-2026
npm install
cp .env.local.example .env.local
# Leave all keys blank — demo mode works without them
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click the demo button.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | For processing | Claude API key for paper parsing |
| `BROWSER_USE_API_KEY` | For search | Browser Use Cloud key for web agent search |
| `DAYTONA_API_KEY` | For notebooks | Daytona key for sandbox provisioning |
| `NEXT_PUBLIC_CONVEX_URL` | For real-time | Your Convex deployment URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | For auth | Clerk publishable key |
| `CLERK_SECRET_KEY` | For auth | Clerk secret key |
| `MONGODB_URI` | Optional | MongoDB for persistent storage |
| `SUPERMEMORY_API_KEY` | Optional | Cross-session paper memory |
| `LAMINAR_API_KEY` | Optional | Observability |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page — search + paper list
│   ├── paper/[id]/page.tsx   # Living Page — full interactive paper view
│   ├── thread/[id]/page.tsx  # Research Thread — multi-paper view
│   └── api/
│       ├── search/           # POST: web agent search + arXiv fallback
│       ├── process/          # POST: Claude paper processing
│       ├── prerequisite/     # POST: prerequisite concept detection
│       └── notebook/         # POST: notebook generation + Daytona sandbox
├── components/
│   ├── Search/               # SearchInput, PaperList
│   ├── LivingPage/           # All Living Page UI components
│   ├── CitationGraph/        # D3 citation graph
│   ├── RabbitHole/           # Rabbit hole navigation stack + panel
│   ├── Notebook/             # Notebook cell rendering + embed
│   ├── Glossary/             # Glossary sidebar
│   └── Navigation/           # Keyboard shortcuts overlay
├── hooks/                    # useDepthMeter, useEquationReveal, etc.
├── lib/
│   ├── types.ts              # Shared TypeScript interfaces
│   ├── claude.ts             # Anthropic Claude API wrapper
│   ├── browseruse.ts         # Browser Use Cloud wrapper
│   ├── arxiv.ts              # arXiv API fallback
│   ├── daytona.ts            # Daytona workspace API wrapper
│   └── mathjax.ts            # MathJax 3 helpers
└── data/
    └── demo-fallback.json    # Demo data (no API keys needed)

convex/                       # Real-time data layer
```

---

## API Routes

| Route | Method | Body | Response |
|---|---|---|---|
| `/api/search` | POST | `{ query: string }` | `{ papers: PaperMetadata[], source: string }` |
| `/api/process` | POST | `{ paper: PaperMetadata }` | `{ paper: ProcessedPaper }` |
| `/api/prerequisite` | POST | `{ paragraph: string, paperTitle: string }` | `{ concept: string, ... }` |
| `/api/notebook` | POST | `{ paper: PaperMetadata, repoUrl?: string }` | `{ cells: NotebookCell[], sandboxUrl?: string }` |

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `J` / `K` | Next / previous section |
| `E` | Expand / collapse current equation |
| `N` | Open / close notebook panel |
| `C` | Toggle citation graph |
| `R` | Cycle reading mode (Skim → Read → Deep Dive) |
| `F` | Fullscreen current figure |
| `D` | "I don't understand this" for current paragraph |
| `[` / `]` | Navigate rabbit hole stack back / forward |
| `?` | Show keyboard shortcut help overlay |

---

## Contributing

1. Fork the repo and create a feature branch
2. `npm install` and `cp .env.local.example .env.local`
3. Run `npm run dev` and verify the demo works
4. Make your changes with TypeScript and Tailwind
5. Run `npm run lint` and `npm run build` before opening a PR
6. Open a PR targeting `main`

---

## Hackathon Context

Living Papers v2 was built for the **Browser Use × YC Hackathon (March 2026)**. It uses:
- **Browser Use Cloud** as the primary web agent for autonomous research paper discovery
- **Daytona** for isolated, reproducible code sandbox environments

---

## License

MIT
