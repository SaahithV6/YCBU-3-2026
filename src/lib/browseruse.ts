import { PaperMetadata, PaperSourceName } from './types'

const BROWSER_USE_API_URL = 'https://api.browser-use.com/api/v1'
const BROWSER_USE_API_URL_V3 = 'https://api.browser-use.com/api/v3'
const MAX_PAPERS_PER_SEARCH = 20

const ALL_SOURCES: Array<{ name: PaperSourceName; url: string }> = [
  { name: "Anna's Archive", url: 'https://annas-archive.org/search?q={query}' },
  { name: "arXiv", url: 'https://arxiv.org/search/?searchtype=all&query={query}' },
  { name: "CORE", url: 'https://core.ac.uk/search?q={query}' },
  { name: "OA.mg", url: 'https://oa.mg/search?q={query}' },
  { name: "PubMed Central", url: 'https://www.ncbi.nlm.nih.gov/pmc/search/?query={query}' },
  { name: "Unpaywall", url: 'https://api.unpaywall.org/v2/{doi}?email=app@livingpapers.io' },
  { name: "DOAJ", url: 'https://doaj.org/search/articles?query={query}' },
  { name: "Google Scholar", url: 'https://scholar.google.com/scholar?q={query}' },
  { name: "Semantic Scholar", url: 'https://www.semanticscholar.org/search?q={query}&sort=Relevance' },
  { name: "Sci-Net", url: 'https://sci-net.org/search?q={query}' },
  { name: "bioRxiv", url: 'https://www.biorxiv.org/search/{query}' },
]

// JSON Schema for structured output via Browser Use v3 API
const PAPER_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    papers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          authors: { type: 'array', items: { type: 'string' } },
          abstract: { type: 'string' },
          url: { type: 'string' },
          pdfUrl: { type: 'string' },
          doi: { type: 'string' },
          venue: { type: 'string' },
          year: { type: 'number' },
          sourceName: { type: 'string' },
          githubUrl: { type: 'string' },
        },
        required: ['title', 'authors', 'url', 'sourceName'],
      },
    },
    search_query: { type: 'string' },
  },
  required: ['papers'],
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

function titleSimilarity(a: string, b: string): number {
  const na = normalizeTitle(a)
  const nb = normalizeTitle(b)
  if (na === nb) return 1
  const wordsA = new Set(na.split(' '))
  const wordsB = new Set(nb.split(' '))
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)))
  const union = new Set([...wordsA, ...wordsB])
  return intersection.size / union.size
}

function deduplicatePapers(papers: RawPaper[]): RawPaper[] {
  const unique: RawPaper[] = []
  for (const paper of papers) {
    const isDuplicate = unique.some(existing => {
      if (existing.doi && paper.doi && existing.doi === paper.doi) return true
      return titleSimilarity(existing.title, paper.title) > 0.85
    })
    if (!isDuplicate) unique.push(paper)
  }
  return unique
}

interface RawPaper {
  title: string
  authors: string[]
  abstract?: string
  url: string
  pdfUrl?: string
  doi?: string
  venue?: string
  year?: number
  sourceName: PaperSourceName
  githubUrl?: string
}

function rawPapersToMetadata(papers: RawPaper[]): PaperMetadata[] {
  return deduplicatePapers(papers).map(p => ({
    id: p.doi ? `doi:${p.doi}` : `bu:${Date.now()}-${Math.random()}`,
    title: p.title,
    authors: p.authors,
    abstract: p.abstract || '',
    url: p.url,
    pdfUrl: p.pdfUrl || p.url,
    sourceUrl: p.url,
    sourceName: p.sourceName,
    relevanceScore: 50,
    relevanceReason: '',
    venue: p.venue,
    year: p.year,
    doi: p.doi,
    githubUrl: p.githubUrl,
  }))
}

function buildSearchTask(query: string): string {
  const encodedQuery = encodeURIComponent(query)
  const sourceList = ALL_SOURCES.map((s, i) =>
    `${i + 1}. ${s.name}: ${s.url.replace('{query}', encodedQuery)}`
  ).join('\n')

  return `Search for research papers on: "${query}"

Traverse ALL 11 sources in this exact order:
${sourceList}

For each source, collect up to 5 papers. For each paper:
- Extract: title, authors (array of strings, first 5 max), abstract, URL to paper page, PDF URL if directly available, DOI if present, publication year, venue/journal name
- Check if full text PDF is freely accessible (not behind paywall)
- Extract GitHub repository URL if linked in paper abstract or page
- Record which source you found it from (use exact source name from the list above)

After collecting from all sources, deduplicate by: exact DOI match OR title similarity > 85%.
Return up to ${MAX_PAPERS_PER_SEARCH} unique papers.`
}

async function pollForResult(
  taskId: string,
  apiKey: string,
  baseUrl: string,
  maxAttempts = 45,
  intervalMs = 4000
): Promise<{ output?: { papers: RawPaper[] }; result?: string } | null> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, intervalMs))

    const statusResponse = await fetch(`${baseUrl}/task/${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })

    if (!statusResponse.ok) continue

    const status = await statusResponse.json()

    if (status.status === 'completed') {
      return status
    }

    if (status.status === 'failed') {
      throw new Error('Browser Use task failed: ' + (status.error || 'unknown error'))
    }
  }

  throw new Error(`Browser Use task timed out after ${Math.round((maxAttempts * intervalMs) / 60000)} minutes`)
}

/**
 * Approach 1 (v3): Autonomous Agent using the new experimental v3 API.
 * Uses output_schema for structured JSON output — no text parsing needed.
 */
export async function searchWithBrowserUseV3(query: string): Promise<PaperMetadata[]> {
  const apiKey = process.env.BROWSER_USE_API_KEY
  if (!apiKey) return []

  const task = buildSearchTask(query)

  const createResponse = await fetch(`${BROWSER_USE_API_URL_V3}/run-task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ task, output_schema: PAPER_OUTPUT_SCHEMA, timeout: 180 }),
  })

  if (!createResponse.ok) {
    throw new Error(`Browser Use v3 API error: ${createResponse.status}`)
  }

  const { task_id } = await createResponse.json()
  const status = await pollForResult(task_id, apiKey, BROWSER_USE_API_URL_V3)

  if (!status) return []

  // v3 returns structured output directly via output_schema
  if (status.output?.papers) {
    return rawPapersToMetadata(status.output.papers)
  }

  // Graceful fallback: parse text result if output field is absent
  if (status.result) {
    const jsonMatch = status.result.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const papers = JSON.parse(jsonMatch[0]) as RawPaper[]
      return rawPapersToMetadata(papers)
    }
  }

  return []
}

/**
 * Approach 2 (Browser API): Create a browser session for manual control.
 * Returns a CDP URL that can be used with Playwright for custom scraping logic.
 *
 * Example usage with playwright-core:
 *   const { cdpUrl, sessionId } = await createBrowserSession()
 *   const browser = await chromium.connectOverCDP(cdpUrl)
 *   // ... perform custom scraping ...
 *   await stopBrowserSession(sessionId)
 */
export async function createBrowserSession(proxyCountryCode = 'us'): Promise<{ cdpUrl: string; sessionId: string }> {
  const apiKey = process.env.BROWSER_USE_API_KEY
  if (!apiKey) throw new Error('BROWSER_USE_API_KEY is not configured')

  const response = await fetch(`${BROWSER_USE_API_URL_V3}/browsers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ proxy_country_code: proxyCountryCode }),
  })

  if (!response.ok) {
    throw new Error(`Failed to create browser session: ${response.status}`)
  }

  const session = await response.json()
  return { cdpUrl: session.cdp_url, sessionId: session.id }
}

export async function stopBrowserSession(sessionId: string): Promise<void> {
  const apiKey = process.env.BROWSER_USE_API_KEY
  if (!apiKey) return

  await fetch(`${BROWSER_USE_API_URL_V3}/browsers/${sessionId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${apiKey}` },
  })
}

/**
 * Primary search function: tries v3 API first, falls back to v1 text-parsing approach.
 */
export async function searchWithBrowserUse(query: string): Promise<PaperMetadata[]> {
  const apiKey = process.env.BROWSER_USE_API_KEY
  if (!apiKey) {
    return []
  }

  // Try v3 API (structured output) first
  try {
    const results = await searchWithBrowserUseV3(query)
    if (results.length > 0) return results
  } catch (v3Error) {
    console.warn('Browser Use v3 failed, falling back to v1:', v3Error instanceof Error ? v3Error.message : String(v3Error))
  }

  // Fall back to v1 API (text parsing)
  const task = buildSearchTask(query) + `

Return ONLY a JSON array with up to ${MAX_PAPERS_PER_SEARCH} unique papers:
[{
  "title": "...",
  "authors": ["First Author", "Second Author"],
  "abstract": "...",
  "url": "https://...",
  "pdfUrl": "https://...pdf",
  "doi": "10.xxxx/xxxxx",
  "venue": "NeurIPS 2023",
  "year": 2023,
  "sourceName": "Anna's Archive",
  "githubUrl": "https://github.com/..."
}]

Return ONLY valid JSON array. No other text.`

  try {
    const createResponse = await fetch(`${BROWSER_USE_API_URL}/run-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ task, timeout: 180 }),
    })

    if (!createResponse.ok) {
      console.warn(`Browser Use v1 API error: ${createResponse.status}`)
      return []
    }

    const { task_id } = await createResponse.json()
    const status = await pollForResult(task_id, apiKey, BROWSER_USE_API_URL)

    if (!status?.result) return []

    const jsonMatch = status.result.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('Failed to parse Browser Use results as JSON')

    const papers = JSON.parse(jsonMatch[0]) as RawPaper[]
    return rawPapersToMetadata(papers)
  } catch (error) {
    console.error('Browser Use error:', error)
    return []
  }
}
