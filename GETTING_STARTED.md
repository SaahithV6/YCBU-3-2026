# Getting Started with Living Papers v2

This guide gets you from zero to a running app in under 10 minutes.

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 18 or later | [nodejs.org](https://nodejs.org) |
| npm | 9 or later | Comes with Node |
| Git | Any recent | [git-scm.com](https://git-scm.com) |

---

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/SaahithV6/YCBU-3-2026.git
cd YCBU-3-2026
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` in your editor. The app has a **demo mode** that works without any API keys — if you just want to try it, leave everything blank and skip to step 5.

To use real functionality, fill in the keys as described below.

### 4. Get API Keys (Optional — skip for demo mode)

#### Anthropic API Key (paper processing)
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account and generate an API key
3. Set `ANTHROPIC_API_KEY=sk-ant-...` in `.env.local`

#### Browser Use Cloud API Key (web agent search)
1. Go to [cloud.browser-use.com](https://cloud.browser-use.com)
2. Sign up and create an API key
3. Set `BROWSER_USE_API_KEY=...` in `.env.local`

#### Daytona API Key (notebook sandboxes)
1. Go to [app.daytona.io](https://app.daytona.io)
2. Create an account and generate an API key
3. Set `DAYTONA_API_KEY=...` in `.env.local`

#### Convex (real-time data layer)
1. Install the Convex CLI: `npm install -g convex`
2. Run `npx convex dev` in the project root — it will prompt you to log in and create a deployment
3. Copy the `NEXT_PUBLIC_CONVEX_URL` it prints into your `.env.local`

#### Clerk (authentication — optional for local dev)
1. Go to [clerk.com](https://clerk.com) and create an application
2. Copy the publishable and secret keys into `.env.local`
3. If you skip this, authentication features are disabled but core reading still works

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Using Demo Mode

Demo mode works **without any API keys**. It pre-loads a processed paper on Mechanistic Interpretability so you can explore all interactive features immediately.

1. Start the dev server (`npm run dev`)
2. Click **"Try demo: Mechanistic Interpretability"** on the landing page
3. Explore the full Living Page with equations, citation graph, rabbit hole navigation, and depth meter

---

## Troubleshooting

### `ANTHROPIC_API_KEY` not set — paper processing returns demo data
This is expected. The `/api/process` route falls back to `src/data/demo-fallback.json` when the Anthropic key is missing or the paper ID matches a known demo paper.

### `BROWSER_USE_API_KEY` not set — search falls back to arXiv
The `/api/search` route tries Browser Use Cloud first, then falls back to the arXiv API. You can search without any keys; results will come from arXiv directly.

### Convex not configured — real-time features disabled
The app works without Convex but won't show live processing status. Run `npx convex dev` to enable it.

### Port 3000 already in use
```bash
npm run dev -- -p 3001
```

### TypeScript errors after pulling changes
```bash
npm install
npm run build
```

### MathJax equations not rendering
MathJax loads from a CDN (`cdn.jsdelivr.net`). Check your internet connection. The script is injected lazily — equations render on scroll into view.

---

## Deployment (Vercel)

1. Push your branch to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Add all environment variables from `.env.local` in the Vercel project settings
4. Deploy — Vercel auto-detects Next.js and configures the build

**Important:** Set `NEXT_PUBLIC_CONVEX_URL` to your production Convex deployment URL (run `npx convex deploy` to get it).

---

## Project Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## What Happens on First Search

1. You type a query (e.g., "attention mechanisms transformer")
2. The frontend calls `/api/search`
3. The server tries Browser Use Cloud; falls back to arXiv if unavailable
4. Up to 20 papers are returned with relevance scores
5. You select papers (top 5 auto-selected) and click "Read N papers"
6. The frontend calls `/api/process` for each paper in parallel
7. Each `ProcessedPaper` is stored in `sessionStorage` keyed by paper ID
8. You're navigated to `/paper/[id]` for the first completed paper
9. The Living Page loads from `sessionStorage` and renders all interactive features
