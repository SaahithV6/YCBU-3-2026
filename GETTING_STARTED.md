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

#### Daytona API URL
1. Set `DAYTONA_API_URL=https://app.daytona.io/api` in `.env.local`
2. If you are self-hosting Daytona, use your own URL instead

#### Convex (real-time data layer)
1. Install the Convex CLI: `npm install -g convex`
2. Run `npx convex dev` in the project root — it will prompt you to log in and create a deployment
3. Copy the `NEXT_PUBLIC_CONVEX_URL` it prints into your `.env.local`

#### Convex Deploy Key (needed for production deploys)
1. Go to your [Convex dashboard](https://dashboard.convex.dev)
2. Navigate to your project → **Settings → Deploy Keys**
3. Generate a key and set `CONVEX_DEPLOY_KEY=...` in `.env.local`

#### Clerk (authentication — optional for local dev)
1. Go to [clerk.com](https://clerk.com) and create an application
2. Copy the publishable and secret keys into `.env.local`
3. If you skip this, authentication features are disabled but core reading still works

#### MongoDB Atlas (data persistence)
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and create a free cluster
2. Click **Connect → Drivers** to get the connection string
3. Set `MONGODB_URI=mongodb+srv://...` in `.env.local`

#### Supermemory (memory layer)
1. Go to the Supermemory dashboard and create an account
2. Generate an API key and set `SUPERMEMORY_API_KEY=...` in `.env.local`

#### Laminar (observability)
1. Go to the Laminar observability dashboard and create an account
2. Generate an API key and set `LAMINAR_API_KEY=...` in `.env.local`

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

### Prerequisites
- A Vercel account at [vercel.com](https://vercel.com)
- **Vercel Pro plan** — required because the API routes use extended serverless function timeouts:
  - `/api/search` uses `maxDuration = 60` (Browser Use needs time to traverse multiple sources)
  - `/api/process` uses `maxDuration = 120` (PDF extraction + Claude processing)
  - The Vercel Hobby plan limits serverless functions to 10 seconds, which is not enough

### Import and Configure

1. Push your code to GitHub (if not already)
2. Go to [vercel.com/new](https://vercel.com/new) and import the `YCBU-3-2026` repository
3. Vercel auto-detects Next.js — the defaults are correct:
   - **Framework Preset:** Next.js
   - **Build Command:** `next build`
   - **Output Directory:** `.next`
   - **Node.js Version:** 18.x or 20.x

### Environment Variables

Add **all** environment variables in **Vercel Dashboard → Project Settings → Environment Variables**.

Copy every key from your `.env.local` into Vercel. Critical notes:

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Must be your **production** Convex URL (see below), not the dev URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Same key works for dev and prod |
| `CLERK_SECRET_KEY` | Same key works for dev and prod |
| `ANTHROPIC_API_KEY` | Same key for all environments |
| `BROWSER_USE_API_KEY` | Same key for all environments |
| `DAYTONA_API_KEY` | Same key for all environments |
| `DAYTONA_API_URL` | `https://app.daytona.io/api` |
| `MONGODB_URI` | Your production MongoDB Atlas connection string |
| `SUPERMEMORY_API_KEY` | Same key for all environments |
| `LAMINAR_API_KEY` | Same key for all environments |
| `CONVEX_DEPLOY_KEY` | From Convex dashboard — needed for production schema pushes |

### Convex Production Deployment

Local development uses `npx convex dev` which creates a **development** deployment. For production:

1. Run `npx convex deploy` — this pushes your schema and functions to a **production** Convex deployment
2. Copy the production URL it outputs (looks like `https://your-app-name.convex.cloud`)
3. Set this as `NEXT_PUBLIC_CONVEX_URL` in your Vercel environment variables
4. Set `CONVEX_DEPLOY_KEY` in Vercel env vars — this allows CI/CD to push schema changes automatically

**Important:** `npx convex dev` and `npx convex deploy` target different deployments. Make sure Vercel points to the production one.

### Clerk Domain Configuration

After your first Vercel deploy:

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) → your application
2. Navigate to **Paths** or **Redirect URLs**
3. Add your Vercel production domain (e.g., `https://your-app.vercel.app`) to the allowed redirect URLs
4. If using a custom domain, add that too
5. If using Clerk webhooks, update the webhook endpoint URL to your production domain

### Deploy

1. Click **Deploy** in Vercel (or push to your main branch if auto-deploy is enabled)
2. Wait for the build to complete (~1-2 minutes)

### Post-Deploy Verification

After deployment, verify everything works:

1. **Visit your deployed URL** — the landing page should load with the search input
2. **Try the demo query** — search for "mechanistic interpretability" to test the demo fallback data
3. **Check Vercel Function Logs** — go to Vercel Dashboard → Deployments → Functions tab. Look for any errors about missing environment variables
4. **Check Convex Dashboard** — verify your production deployment is receiving data
5. **Test a real search** (if Browser Use key is set) — try a non-demo query and confirm results come back

### Custom Domain (Optional)

1. Go to Vercel Dashboard → Project Settings → Domains
2. Add your custom domain and follow the DNS configuration instructions
3. Update Clerk redirect URLs to include the custom domain

### Troubleshooting Deployment Issues

| Issue | Fix |
|---|---|
| Functions timing out on Hobby plan | Upgrade to Vercel Pro — the search and process routes need >10s |
| "NEXT_PUBLIC_CONVEX_URL not configured" | Make sure you ran `npx convex deploy` and set the production URL |
| Clerk sign-in redirects to localhost | Add your Vercel domain to Clerk's allowed redirect URLs |
| Convex schema mismatch | Run `npx convex deploy` again to push latest schema to production |
| Build fails with missing dependencies | Run `npm install` locally first, ensure `package-lock.json` is committed |

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
