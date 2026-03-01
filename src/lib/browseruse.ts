import { PaperMetadata } from './types'

const BROWSER_USE_API_URL = 'https://api.browser-use.com/v1'

export async function searchWithBrowserUse(query: string): Promise<PaperMetadata[]> {
  const apiKey = process.env.BROWSER_USE_API_KEY
  if (!apiKey) {
    throw new Error('BROWSER_USE_API_KEY not configured')
  }

  const task = `Search for research papers on: "${query}"
  
  Search these sources in order:
  1. https://arxiv.org/search/?searchtype=all&query=${encodeURIComponent(query)}
  2. https://www.semanticscholar.org/search?q=${encodeURIComponent(query)}
  3. https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(query)}
  
  For each paper found (collect up to 15):
  - Extract: title, authors (first 3), abstract, URL, PDF URL if available, publication year, venue/journal
  - Check if full text is freely accessible (not behind paywall)
  - Score relevance to query from 0 to 1
  - Note any GitHub repositories linked in the paper
  
  Return results as JSON array matching this format:
  [{"id": "...", "title": "...", "authors": [...], "abstract": "...", "url": "...", "pdfUrl": "...", "venue": "...", "year": 2024, "relevanceScore": 0.95, "relevanceExplanation": "..."}]`

  try {
    // Create task
    const createResponse = await fetch(`${BROWSER_USE_API_URL}/run-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ task, timeout: 120 }),
    })

    if (!createResponse.ok) {
      throw new Error(`Browser Use API error: ${createResponse.status}`)
    }

    const { task_id } = await createResponse.json()

    // Poll for results
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 4000))
      
      const statusResponse = await fetch(`${BROWSER_USE_API_URL}/task/${task_id}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })
      
      if (!statusResponse.ok) continue
      
      const status = await statusResponse.json()
      
      if (status.status === 'completed' && status.result) {
        const jsonMatch = status.result.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const papers = JSON.parse(jsonMatch[0]) as PaperMetadata[]
          return papers.map(p => ({ ...p, id: p.id || `bu:${Date.now()}-${Math.random()}` }))
        }
      }
      
      if (status.status === 'failed') {
        throw new Error('Browser Use task failed')
      }
    }
    
    throw new Error('Browser Use task timed out')
  } catch (error) {
    console.error('Browser Use error:', error)
    throw error
  }
}
