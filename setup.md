# Living Papers v2 — Setup Guide

## Required API Keys

| Service | Env Var | Where to Get |
|---------|---------|--------------|
| Anthropic Claude | `ANTHROPIC_API_KEY` | https://console.anthropic.com |
| Browser Use | `BROWSER_USE_API_KEY` | https://browser-use.com |
| Convex (public URL) | `NEXT_PUBLIC_CONVEX_URL` | Run `npx convex dev` and copy the URL |
| Convex (deploy key) | `CONVEX_DEPLOY_KEY` | Convex dashboard → Settings → Deploy Keys |
| Daytona | `DAYTONA_API_KEY` | https://app.daytona.io |
| Daytona API URL | `DAYTONA_API_URL` | Set to `https://app.daytona.io/api` |
| Supermemory | `SUPERMEMORY_API_KEY` | Supermemory dashboard |
| MongoDB | `MONGODB_URI` | MongoDB Atlas → Connect → Connection String |
| Clerk (public) | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | https://dashboard.clerk.com |
| Clerk (secret) | `CLERK_SECRET_KEY` | https://dashboard.clerk.com |
| Laminar | `LAMINAR_API_KEY` | Laminar dashboard |

## Step-by-Step Setup

### 1. Clone & Install

```bash
git clone https://github.com/SaahithV6/YCBU-3-2026
cd YCBU-3-2026
npm install
```

### 2. Set Up Convex

```bash
npx convex dev
# Follow prompts to create/link a Convex project
# Copy the NEXT_PUBLIC_CONVEX_URL from the output
```

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
# Edit .env.local and fill in all API keys
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Paper Sources

The system searches all 11 academic paper sources:
1. Anna's Archive — Open-access library mirror
2. arXiv — Preprint server for STEM fields
3. CORE — Aggregator of open-access research
4. OA.mg — Open Access gateway
5. PubMed Central — Biomedical literature
6. Unpaywall — DOI-based open-access resolver
7. DOAJ — Directory of Open Access Journals
8. Google Scholar — Broad academic search
9. Semantic Scholar — AI-powered research graph
10. Sci-Net — Scientific network
11. bioRxiv — Biology preprint server
