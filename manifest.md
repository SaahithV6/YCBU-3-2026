# Combo Papers — Design Document
### *Accelerating Researchers to the Bleeding Edge*

---

## Vision

Combo Papers is a **web agent-powered research intelligence platform** that autonomously surfaces, parses, and transforms scientific papers into deeply interactive, notebook-embedded learning environments. It exists to eliminate the most counterproductive task in research: struggling to read and extract value from papers you barely have time to find.

**One-sentence pitch:** *Combo Papers uses web agents to find the most relevant research papers and turn them into interactive, runnable, learnable web experiences — so researchers always stay at the bleeding edge.*

---

## What Living Papers (v1) Does Well

- Highlights mathematical variables and renders LaTeX inline
- Gamifies reading with progress, annotations, and linked concepts
- Makes physical processes visually navigable
- Single-paper deep dives with rich interactive overlays

## What v2 Does Differently (and Better)

| Feature | v1 | v2 |
|---|---|---|
| Paper discovery | Manual upload | Web agent-automated search across arXiv, bioRxiv, PubMed, Semantic Scholar, open-access journals |
| Relevance | Most recent / most accessible | Most semantically relevant to researcher's stated focus |
| Scope | Single paper | Multi-paper synthesis across a research thread |
| Code | Described | Embedded, runnable Colab/Jupyter notebooks extracted from linked GitHub repos |
| Format | Exportable PDF/docx | Web-native only — no export needed |
| UX | Desktop reading | Scroll, touch, keyboard-navigated interactive experience |
| Audience | Individual use | Teams, labs, onboarding cohorts |

---

## Core Architecture

### Client-Server Split

Combo Papers is built on a strict **client-server separation**. All computation, state, and secrets live on the server. The client is a pure rendering shell.

**Why this matters:** Web agent crawling, PDF extraction, Claude API calls, GitHub repo cloning, Daytona sandbox provisioning, and citation graph construction are all I/O-bound, long-running, and secret-dependent. None of it belongs in a browser. Exposing it client-side would leak API keys, hit CORS walls on every academic domain, and block the UI thread entirely.

**The client's only job:** receive structured JSON from the server, render it beautifully, handle interactivity. The API surface between client and server is a clean, stable schema — structured paper objects with sections, equations, figures, variables, notebook cells — and the frontend never needs to know how they were produced.

**Stack:**
- **Next.js on Vercel** — API routes own all server logic; the React frontend is the rendering shell. One repo, one deploy.
- **Convex** — real-time data layer. Processing jobs write state to Convex; the client subscribes and updates live without polling. This is what gives the "paper 1 of 5 ready" progressive loading feel.
- **Daytona** — notebook sandboxes run server-side; client embeds output via iframe or streams via websocket.

### 1. Web Agent Layer (Browser Use + Daytona)

The web agent is the heart of v2. Given a research query or topic, it:

1. **Searches** arXiv, bioRxiv, PubMed, Semantic Scholar, and open-access journals
2. **Ranks** papers by semantic relevance (not recency) using embedding similarity to the query
3. **Filters** out paywalled content; only ingests freely accessible full-text PDFs or HTML
4. **Extracts** metadata: title, authors, abstract, figures, equations, citations, referenced GitHub repos
5. **Checks licenses** on any referenced code repositories (MIT, Apache 2.0, CC-BY, etc.)
6. **Queues** a batch of 5–20 most relevant papers for processing

**Sponsor tools used:** Browser Use Cloud (web agent), Daytona (sandboxed code execution environments)

### 2. Paper Processing Pipeline

Each paper goes through:

```
Raw PDF/HTML
    → Text extraction + section segmentation
    → LaTeX/math detection + MathJax rendering
    → Figure captioning + inline placement
    → Variable/term extraction → hover definitions
    → Notation consistency audit (flags redefined variables)
    → Prerequisite concept detection → linked source papers
    → Citation graph construction
    → "Convince me" evidence chain extraction (claim → experiment → figure → result)
    → GitHub repo detection → license check → code extraction
    → Colab notebook generation per code demonstration
    → Structured JSON output → Convex → client
```

**Sponsor tools used:** Anthropic Claude API (parsing, summarization, term extraction), Supermemory (persistent cross-session paper memory)

### 3. Interactive Webpage Structure

Each paper becomes a **Living Page** with these sections:

#### Header Zone
- Paper title, authors, venue, date
- Relevance score + explanation ("Why this paper matters to your query")
- TL;DR — 3-sentence plain-English summary, with each sentence linked to the exact source sentence in the paper it was derived from. The summary is a navigation aid, never a substitute.
- Estimated reading time

#### Reading Mode Toggle
- **Skim** — Abstract + figures + key results only
- **Read** — Full paper with interactive overlays
- **Deep Dive** — Full paper + linked notebooks + related papers

#### Math & Variable System (from v1, enhanced)
- Every variable highlighted on first use with hover card: definition, units, role in the paper
- Equations rendered with MathJax; tap/click any symbol to expand its meaning
- "Equation story" mode: step through a derivation with plain-English narration at each step — pulled from the paper's own appendix or supplementary math where it exists
- **Notation consistency checker:** flags automatically where a variable is redefined or reused with a different meaning across sections. e.g. "⚠ notation note: n here refers to sequence length; in §2 it referred to dictionary size."

#### Figure Viewer
- Full-screen figure mode with caption
- Figures linked to the paragraph that references them
- Side-by-side comparison across papers on the same topic

#### Embedded Code Notebooks
- Detects GitHub links in paper
- Clones repo into isolated Daytona sandbox (per paper, per user session)
- Generates a Colab-style notebook that:
  - Runs the paper's key experiment or demo
  - Has markdown cells explaining what each code block does relative to the paper
  - Includes "Try it yourself" cells for parameter exploration
- Notebook embedded inline at the section of the paper it relates to
- If no GitHub link exists: Claude generates a minimal illustrative implementation of the core algorithm

#### Citation Web
- Interactive graph of citations: which papers does this cite, which papers cite this
- Click any node to load that paper as a new Living Page in the rabbit hole stack
- Filter by "foundational" vs "recent applications"

#### Glossary Sidebar
- Auto-extracted domain terms with definitions
- **Concept weight indicator:** a small frequency bar showing how many times each term appears in the paper and where — helping readers immediately calibrate which terms are load-bearing vs incidental
- Persistent across all papers in a session
- Click a term to see every paper in your session that uses it, with the exact sentence of each usage shown in context

---

## UX & Engagement Design

### The Core Principle: Stickiness Without Abstraction

Short-form content is addictive because the reward is always just ahead of you. In Combo Papers the reward should be the feeling of *genuinely understanding something you didn't understand before* — and the design must make that feeling **felt**, not just cognitively registered. Critically, none of this is achieved by simplifying or summarizing away granularity. The granularity is already in the paper. The job of the UI is to make the paper's own structure, evidence, notation, and derivations **visible and navigable** in ways the PDF format cannot.

---

### Addictive Scroll Mechanics

**Progressive revelation as the scroll mechanic**
Sections are not shown all at once. As you scroll into a new section it reveals in layers: first the plain-English orientation sentence appears, then the actual text fades in, then the math materializes, then figures appear contextualizing the argument. Each scroll feels like *unlocking* something. You are always being pulled forward because the next layer of depth is always just below.

**The "one more" transition**
When you reach the end of a section, instead of dead space a contextually chosen follow-on paper preview bleeds in from below — the way Netflix autoplays the next episode. You are already scrolling; the next paper just appears. The choice is based on which concepts you actually engaged with in the current paper, not just topic similarity.

**Equation "slow burn" reveal**
Equations appear slightly blurred on first scroll-into-view. As you dwell on them they slowly come into focus over 2–3 seconds. This forces genuine attention rather than skip-past behavior. The reveal feels like *earning* the understanding. Clicking immediately sharpens the equation and opens story mode.

**Ambient spaced re-exposure strip**
A slim persistent strip at the very bottom of the viewport quietly surfaces terms you encountered earlier in the paper but didn't engage with — not a quiz, just a ghost reminder: "earlier: polysemanticity · sparse coding · L1 penalty." By the time you finish a paper you have seen the key terms 3–4 times in different contexts with no explicit review step required.

**Depth meter**
A quiet progress ring in the corner fills as you engage with the paper's interactive elements: hovering variables, expanding equations, running notebook cells, clicking citations. No badges, no scores — just a visual signal of how much of the paper's texture you have actually touched. Partial completion on five papers feels worse than finishing one, which drives deeper engagement per paper before moving on.

---

### Rabbit Hole Navigation

**The rabbit hole link as the core navigation primitive**
Every term, author, cited paper, and concept is a portal. Tap any highlighted term mid-sentence and a side panel slides in with a micro-summary and one button: *Go deeper*. That spawns a new Living Page in a navigation stack. You can go five papers deep following a single concept thread. The stack is visible as a spatial breadcrumb trail showing exactly how far down the rabbit hole you are — which itself creates a pull to go further. At any depth you can collapse back to any earlier level.

**Spatial concept map that grows as you read**
In the corner, a miniature knowledge graph expands in real time as you encounter new terms and papers. It is ambient — you do not interact with it while reading — but watching it grow is satisfying. You want to fill it out. Click any node to jump back to where you first encountered it. At the end of a Research Thread the map is a visual artifact of genuine understanding built.

**Social presence layer**
Show how many other researchers are reading this paper right now — a small number, no names, no feeds. "3 others reading." No likes, no notifications. Just the ambient awareness that this paper is alive and being read by someone else working on similar problems. Quietly motivating.

---

### Concept Retention Without Abstraction

**Author voice preservation — summaries as pointers, not replacements**
Every TL;DR sentence and section summary is visually linked to the *exact sentence from the paper* it was derived from. Click any summary sentence and the paper scrolls to and highlights its source. This prevents the abstraction trap entirely — summaries serve as navigation aids, the reader always has one click to ground truth.

**Concept threading across papers**
When a term appears that also appeared in a previous paper in your session, it carries a subtle "seen before" underline. Click it and you get a split view: how *this* paper uses the term vs. how the previous paper used it. Same word, different context, different nuance. That comparison is where real understanding lives — not in a definition, but in the *delta* between usages across authors and time.

**The "what changed" layer for sequential papers**
When reading papers in a research thread chronologically, a diff-style overlay shows what changed between papers at the level of specific equations, definitions, and claims. Not just "this paper builds on X" — but: this variable appeared in paper 2 with this meaning, paper 4 replaced it with this one, and here is the sentence where the authors explain why. You see the evolution of an idea in real time, at full resolution.

**The "I don't understand this" button**
An unobtrusive button on every paragraph. Press it and the system does not simplify — it identifies the most likely *prerequisite concept* you are missing and surfaces it inline. If you don't understand sparse autoencoders, it does not explain it in simplified terms: it finds the Olshausen & Field 1997 paper that introduced the concept and shows you the original definition in the original authors' words. You go deeper, not shallower.

**Margin annotations from the paper itself**
Supplementary material, appendices, and footnotes are surfaced as collapsed margin notes exactly where they are relevant in the main text. The granularity is already in the paper — most readers never encounter it because it is buried in a separate PDF section. Bringing it to the point of relevance requires no abstraction at all.

**Re-derivation mode for equations**
For any equation, a "show me how we got here" expansion walks through intermediate derivation steps — pulled from the paper's own appendix or supplementary math where it exists. This is the paper's own derivation made visible, not a rewrite. You are revealing hidden granularity, not replacing it.

**The "convince me" evidence chain**
For every major claim or result, a collapsible evidence chain shows: claim → experiment → figure → statistical result → conclusion. The chain is extracted directly from the paper's own structure. Readers can immediately see whether a claim is well-supported or merely asserted, without any editorial judgment added.

**Timed "did you follow that?" checkpoints**
A single sentence prompt appears between major sections: *"In your own words, what is polysemanticity?"* with a free-text box. Not required. No score, no judgment. But being asked makes you immediately aware of whether you understood it or not, creating intrinsic motivation to re-read if you didn't. The act of attempted generation is the retention mechanism.

**Notation consistency checker**
Automatically flags anywhere a variable is redefined or reused with a different meaning across sections. These silent notation shifts are one of the most common reasons papers feel impenetrable — surfacing them removes a major source of invisible friction.

**Optional ambient audio layer**
A very subtle generative ambient audio layer tied to reading context — sparse and quiet during plain text, slightly denser and more textured during methods and equations sections, almost imperceptible. Creates a distinct cognitive environment that separates "reading a Living Page" from "reading a webpage." Particularly effective for headphone users. Off by default.

---

### Navigation Philosophy

- **Scroll-first**: primary reading mode is smooth vertical scroll with sticky section headers
- **Keyboard shortcuts**:
  - `J/K` — next/previous section
  - `E` — expand/collapse current equation
  - `N` — open/close notebook panel
  - `C` — toggle citation graph
  - `R` — switch reading mode (Skim/Read/Deep Dive)
  - `F` — fullscreen figure
  - `D` — open "I don't understand this" for current paragraph
  - `[` / `]` — navigate rabbit hole stack backward/forward
  - `?` — keyboard shortcut help overlay
- **Touch/mobile**:
  - Swipe left/right to navigate between papers in your session
  - Pinch to zoom figures
  - Long-press a term for its definition card
  - Bottom sheet for citation graph and glossary

### Visual Design Direction

**Aesthetic: Scientific editorial meets terminal intelligence**
- Dark background (`#0a0e14`) with warm off-white text (`#e8e0d0`)
- Accent: electric teal (`#00d4aa`) for interactive elements, equations, highlights
- Secondary accent: amber (`#f5a623`) for code and variable highlights
- Typography: `IBM Plex Serif` for body text (readable, scholarly), `JetBrains Mono` for math/code, `Syne` for display headers
- Subtle grid texture background suggesting graph paper / laboratory notebooks
- Smooth section transitions with `scroll-behavior: smooth`
- Equations subtly glow on hover; blur-to-focus reveal on scroll-into-view
- Figures have a thin amber frame when active
- Rabbit hole stack rendered as a spatial layered card trail in the left margin

### Onboarding Flow
1. User enters a research query: *"attention mechanisms in protein structure prediction"*
2. Web agent searches and returns ranked paper list (10 seconds)
3. User selects papers (or accepts top 5)
4. Papers process in parallel; progress shown with per-paper status via Convex live updates
5. First paper ready in ~30 seconds; user can start reading immediately
6. Background: remaining papers process, notebooks spin up in Daytona
7. Concept map begins forming from first paper; expands as subsequent papers arrive

---

## Multi-Paper Features

### Research Thread
A **Research Thread** is a named collection of Living Pages around a topic. Features:
- Auto-generated overview page synthesizing themes across all papers
- Timeline view showing how ideas evolved across publications, with diff-layer showing exactly what changed between papers at equation and claim level
- Contradiction detector: highlights where papers disagree on results or methods
- "Missing link" suggestions: papers the agent thinks are relevant but weren't in the initial results
- Full cross-paper concept threading: every shared term linked across all papers in the thread

### Team / Lab Mode
- Share a Research Thread via URL
- Collaborators see each other's highlights and annotations in real time (Convex for live sync)
- "Reading assignments": assign specific papers to team members; track completion via depth meters
- Slack/Discord integration: post summaries of newly added papers

**Sponsor tools used:** Convex (real-time sync), AgentMail (email digests of new relevant papers)

---

## Technical Stack

| Layer | Technology |
|---|---|
| Web agents | Browser Use Cloud |
| Frontend | Next.js (React), deployed on Vercel |
| Real-time sync | Convex |
| Code sandboxes | Daytona |
| AI parsing/summarization | Claude claude-sonnet-4-20250514 via Anthropic API |
| Paper memory/search | Supermemory |
| Math rendering | MathJax 3 |
| Notebook embedding | Colab embed API + Daytona runtime |
| Observability | Laminar |
| Database | MongoDB Atlas |
| Auth | Clerk |

---

## Hackathon Build Plan

### What to Demo (4 minutes)
1. Enter query: *"mechanistic interpretability in large language models"*
2. Watch web agent search live (Browser Use)
3. First paper loads as a Living Page — scroll through progressive reveal, show equation slow-burn focus, variable hover cards
4. Click "I don't understand this" on a paragraph — watch prerequisite paper surface inline
5. Open embedded notebook — run a cell live
6. Click a citation → loads as new Living Page, rabbit hole stack appears in margin
7. Show concept map expanding as second paper loads

### MVP Scope (20 hours)
- [ ] Web agent: arXiv search + PDF fetch (Browser Use)
- [ ] Claude pipeline: extract sections, math, variables, figures, evidence chains
- [ ] Next.js API routes + Convex live updates
- [ ] Living Page renderer: React, MathJax, variable hover cards, progressive reveal scroll
- [ ] Equation blur-to-focus reveal
- [ ] "I don't understand this" → prerequisite concept lookup
- [ ] Embedded notebook: 1 Daytona sandbox, Colab-style UI
- [ ] Citation graph: D3 force graph
- [ ] Rabbit hole navigation stack
- [ ] Keyboard shortcuts + scroll navigation
- [ ] 1 demo topic pre-loaded as fallback

### Post-Hackathon Roadmap
- Full multi-paper Research Thread synthesis with diff layer
- Cross-paper concept threading and "what changed" overlay
- Ambient concept map
- Team/lab mode with Convex real-time
- Mobile-optimized touch UX
- AgentMail weekly digest
- Contradiction detector
- Ambient spaced re-exposure strip
- "Did you follow that?" checkpoints
- Ambient audio layer
- Notation consistency checker
- Integration with institutional access credentials for paywalled content

---

## Why This Wins

**Impact (40%):** Every research lab, every PhD student, every biotech company doing literature review is the target user. The productivity unlock is enormous — cutting paper-to-understanding time from hours to minutes at scale. The retention mechanics mean that time spent is actually converted into durable understanding, not just reading that evaporates.

**Creativity (20%):** Combining web agents + embedded runnable notebooks + rabbit hole navigation + progressive reveal + granularity-preserving retention mechanics in a single reading experience is genuinely novel. Nothing like this exists.

**Technical Difficulty (20%):** Live web agent search + sandboxed code extraction + real-time notebook embedding + multi-paper synthesis + client-server architecture with Convex live sync is a legitimately hard distributed system built in 20 hours.

**Demo (20%):** The demo tells a clear story: *researcher enters query, agent finds papers, paper becomes interactive and runnable and genuinely learnable in under a minute.*

---

*Combo Papers — Built at Browser Use × YC Hackathon, March 2026*
