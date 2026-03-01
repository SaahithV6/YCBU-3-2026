import { NextRequest, NextResponse } from 'next/server'
import { searchArxiv } from '@/lib/arxiv'
import { searchWithBrowserUse } from '@/lib/browseruse'
import demoData from '@/data/demo-fallback.json'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Check if this is a demo query
    const isDemo = query.toLowerCase().includes('mechanistic interpretability') ||
      query.toLowerCase().includes('demo')

    if (isDemo) {
      return NextResponse.json({
        papers: demoData.papers,
        source: 'demo',
      })
    }

    // Try Browser Use first, fall back to arXiv
    let papers
    let source = 'arxiv'

    if (process.env.BROWSER_USE_API_KEY) {
      try {
        papers = await searchWithBrowserUse(query)
        source = 'browser-use'
      } catch (e) {
        console.warn('Browser Use failed, falling back to arXiv:', e)
        papers = await searchArxiv(query, 15)
      }
    } else {
      papers = await searchArxiv(query, 15)
    }

    return NextResponse.json({ papers, source })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
