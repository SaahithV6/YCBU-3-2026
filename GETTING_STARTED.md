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

## Step-by-Step Setuprreded

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

Open `.env.local` in your editor. The app has a **demo mode** that works without any API keys — if you just want to try it, leave everything blank and skip to [Step 5](#5-run-the-development-server).

To unlock real functionality, follow Step 4 below. Each key is grouped by priority so you know what to set up first.

### 4. Get API Keys

Every key below is optional for demo mode. The table shows what breaks if you skip each one:

| Variable | What it powers | If missing |
|---|---|---|
| `ANTHROPIC_API_KEY` | Paper processing (Claude) | Falls back to demo data from `src/data/demo-fallback.json` |
| `BROWSER_USE_API_KEY` | Multi-source web search | Falls back to arXiv-only search |
| `DAYTONA_API_KEY` + `DAYTONA_API_URL` | Notebook sandboxes | Sandbox feature returns a 503 error |
| `NEXT_PUBLIC_CONVEX_URL` | Real-time processing status | App works, but no live status updates |
| `CONVEX_DEPLOY_KEY` | Production deploys to Convex | Only needed for Vercel deployment |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` | User authentication | Auth disabled; core reading still works |
| `MONGODB_URI` | Persistent data storage | Persistence features disabled |
| `SUPERMEMORY_API_KEY` | Cross-session paper memory | Memory/recall features disabled |
| `LAMINAR_API_KEY` | Observability / tracing | No tracing; everything else works |

---

#### 🔴 Core Keys (needed for full functionality)

##### Anthropic — `ANTHROPIC_API_KEY`

Powers all paper processing via Claude.

1. Go to **[console.anthropic.com](https://console.anthropic.com)** → sign up or log in
2. Click **API Keys** in the left sidebar → **Create Key**
3. Copy the key (starts with `sk-ant-...`)
4. Paste into `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

> **Cost:** Pay-as-you-go. New accounts get $5 free credit. Processing one paper costs roughly $0.02–$0.10 depending on length.

##### Browser Use Cloud — `BROWSER_USE_API_KEY`

Powers the multi-source web agent that searches across 11 academic sources (arXiv, PubMed, CORE, etc.).

1. Go to **[cloud.browser-use.com](https://cloud.browser-use.com)** → sign up
2. Go to **Dashboard → API Keys** → create a new key
3. Copy the key and paste into `.env.local`:
   ```
   BROWSER_USE_API_KEY=your-key-here
   ```

> **Cost:** Pay-as-you-go. Check [browser-use.com/pricing](https://browser-use.com/pricing) for current rates. Each search uses one agent run.
> **If skipped:** Search still works — it falls back to arXiv directly, but you only get results from one source instead of eleven.

##### Daytona — `DAYTONA_API_KEY` + `DAYTONA_API_URL`

Powers the interactive notebook sandboxes (run code cells from papers).

1. Go to **[app.daytona.io](https://app.daytona.io)** → sign up
2. Click your profile icon → **API Keys** → **Generate New Key**
3. Copy the key and paste into `.env.local`:
   ```
   DAYTONA_API_KEY=your-key-here
   DAYTONA_API_URL=https://app.daytona.io/api
   ```
   If you're self-hosting Daytona, replace the URL with your own.

> **Cost:** Free tier available. See [daytona.io/pricing](https://www.daytona.io/pricing) for limits.

---

#### 🟡 Infrastructure Keys (real-time features & auth)

##### Convex — `NEXT_PUBLIC_CONVEX_URL`

Powers real-time processing status updates in the UI.

1. Install the Convex CLI (if you haven't):
   ```bash
   npm install -g convex
   ```
2. From the project root, run:
   ```bash
   npx convex dev
   ```
3. It will open your browser to log in / create an account at **[convex.dev](https://www.convex.dev)** (free tier available)
4. Once authenticated, it prints a URL like `https://your-app-name.convex.cloud`
5. Copy that URL into `.env.local`:
   ```
   NEXT_PUBLIC_CONVEX_URL=https://your-app-name.convex.cloud
   ```

> **Cost:** Free for small projects. See [convex.dev/pricing](https://convex.dev/pricing).
> **Note:** Keep `npx convex dev` running in a separate terminal while developing — it syncs your schema in real time.

##### Convex Deploy Key — `CONVEX_DEPLOY_KEY`

Only needed for **production deploys** (Vercel). Skip this for local development.

1. Go to **[dashboard.convex.dev](https://dashboard.convex.dev)** → select your project
2. Go to **Settings → Deploy Keys → Generate Deploy Key**
3. Copy the key into `.env.local`:
   ```
   CONVEX_DEPLOY_KEY=your-deploy-key-here
   ```

##### Clerk — `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY`

Powers user authentication (sign-in, sign-up, session management).

1. Go to **[dashboard.clerk.com](https://dashboard.clerk.com)** → sign up (free)
2. Click **Create Application** → give it a name → choose sign-in methods (email, Google, etc.)
3. After creation, Clerk shows you **API Keys** on the quickstart page. You need two keys:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`)
4. Paste both into `.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-key-here
   CLERK_SECRET_KEY=sk_test_your-key-here
   ```

> **Cost:** Free for up to 10,000 monthly active users. You do **not** need to pay. See [clerk.com/pricing](https://clerk.com/pricing).
> **If skipped:** Authentication features are disabled, but all core reading features still work.

---

#### 🟢 Optional Keys (persistence, memory, observability)

##### MongoDB Atlas — `MONGODB_URI`

Used for persistent data storage.

1. Go to **[cloud.mongodb.com](https://cloud.mongodb.com)** → sign up (free)
2. Click **Build a Database** → choose the **Free / M0** tier → pick a cloud region → **Create**
3. Create a database user (username + password) when prompted
4. On the cluster page, click **Connect → Drivers**
5. Copy the connection string and replace `<password>` with your actual password:
   ```
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/living-papers
   ```

> **Cost:** M0 free tier (512 MB) is more than enough for development.

##### Supermemory — `SUPERMEMORY_API_KEY`

Powers cross-session paper memory (remembers papers you've read before).

1. Go to **[supermemory.ai](https://supermemory.ai)** → sign up
2. Go to **Dashboard → API Keys** → generate a key
3. Paste into `.env.local`:
   ```
   SUPERMEMORY_API_KEY=your-key-here
   ```

> **Cost:** Check [supermemory.ai](https://supermemory.ai) for current pricing. Free tier may be available.

##### Laminar — `LAMINAR_API_KEY`

Used for observability and tracing of API calls. Useful for debugging, not required for functionality.

1. Go to **[lmnr.ai](https://www.lmnr.ai)** → sign up
2. Go to **Settings → API Keys** → generate a key
3. Paste into `.env.local`:
   ```
   LAMINAR_API_KEY=your-key-here
   ```

> **Cost:** Free tier available. See [lmnr.ai/pricing](https://lmnr.ai/pricing).

---

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You're done! 🎉

---

## Using Demo Mode

Demo mode works **without any API keys**. It pre-loads a processed paper on Mechanistic Interpretability so you can explore all interactive features immediately.

1. Start the dev server (`npm run dev`)
2. Click **"Try demo: Mechanistic Interpretability"** on the landing page
3. Explore the full Living Page with equations, citation graph, rabbit hole navigation, and depth meter

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Paper processing returns demo data | `ANTHROPIC_API_KEY` not set | Expected in demo mode. Add the key to get real processing. |
| Search only returns arXiv results | `BROWSER_USE_API_KEY` not set | Expected — arXiv is the fallback. Add the key for multi-source search. |
| No live processing status | Convex not configured | Run `npx convex dev` in a separate terminal. |
| Port 3000 already in use | Another process is using port 3000 | Run `npm run dev -- -p 3001` |
| TypeScript errors after pull | Dependencies out of date | Run `npm install && npm run build` |
| MathJax equations not rendering | CDN not loaded | Check your internet connection. MathJax loads lazily from `cdn.jsdelivr.net` on scroll.

---

## Deploying to Vercel

### What You Need

- A **Vercel Pro plan** ($20/mo) — required because the API routes need extended timeouts:
  - `/api/search` → 60 seconds (Browser Use agent traversal)
  - `/api/process` → 120 seconds (PDF extraction + Claude)
  - Vercel's free Hobby plan caps functions at 10 seconds, which is not enough
- All API keys from Step 4 above
- A Convex **production** deployment (different from your local dev one)

### Step 1 — Create a Convex Production Deployment

Your local `npx convex dev` creates a **development** deployment. Production needs its own:

```bash
npx convex deploy
```

This prints a production URL like `https://your-app-name.convex.cloud`. **Save this URL** — you'll need it in Step 3.

> ⚠️ `npx convex dev` and `npx convex deploy` point to **different** deployments. Make sure Vercel uses the production one.

### Step 2 — Import the Project on Vercel

1. Go to **[vercel.com/new](https://vercel.com/new)**
2. Import the `YCBU-3-2026` repository from GitHub
3. Vercel auto-detects Next.js — **don't change any build settings**:
   - Framework Preset: **Next.js**
   - Build Command: `next build`
   - Output Directory: `.next`
   - Node.js Version: 18.x or 20.x

**Don't click Deploy yet** — add environment variables first.

### Step 3 — Add Environment Variables

In the same import screen (or later in **Project Settings → Environment Variables**), add every key:

```
ANTHROPIC_API_KEY=sk-ant-...
BROWSER_USE_API_KEY=...
DAYTONA_API_KEY=...
DAYTONA_API_URL=https://app.daytona.io/api
NEXT_PUBLIC_CONVEX_URL=https://your-app-name.convex.cloud  ← USE THE PRODUCTION URL FROM STEP 1
CONVEX_DEPLOY_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
MONGODB_URI=mongodb+srv://...
SUPERMEMORY_API_KEY=...
LAMINAR_API_KEY=...
```

> ⚠️ **Critical:** `NEXT_PUBLIC_CONVEX_URL` must be your **production** Convex URL from Step 1, not the `localhost` or dev URL.

### Step 4 — Deploy

Click **Deploy** and wait ~1–2 minutes for the build.

### Step 5 — Configure Clerk Redirects

After your first deploy, Clerk needs to know your production domain:

1. Go to **[dashboard.clerk.com](https://dashboard.clerk.com)** → your application
2. Go to **Paths** (or **Redirect URLs**)
3. Add your Vercel domain: `https://your-app.vercel.app`
4. If using a custom domain, add that too

> Without this step, sign-in will redirect to `localhost` instead of your live site.

### Step 6 — Verify

1. **Visit your deployed URL** — the landing page should load
2. **Search "mechanistic interpretability"** — should return demo results
3. **Check Vercel Function Logs** (Dashboard → Deployments → Functions) — look for missing env var errors
4. **Try a non-demo search** (if Browser Use key is set) — confirm multi-source results come back

### Custom Domain (Optional)

1. Go to **Vercel Dashboard → Project Settings → Domains**
2. Add your domain and follow the DNS instructions Vercel gives you
3. Go back to Clerk and add the custom domain to allowed redirect URLs

### Deployment Troubleshooting

| Problem | Fix |
|---|---|
| Functions timing out | You need Vercel Pro — Hobby plan's 10s limit is too short |
| `NEXT_PUBLIC_CONVEX_URL not configured` | Run `npx convex deploy` and set the production URL in Vercel env vars |
| Clerk redirects to `localhost` | Add your Vercel domain in Clerk Dashboard → Redirect URLs |
| Convex schema mismatch | Run `npx convex deploy` again to push the latest schema |
| Build fails with missing deps | Run `npm install` locally and make sure `package-lock.json` is committed |

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
