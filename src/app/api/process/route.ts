import { NextRequest, NextResponse } from 'next/server'
import { processPaperWithClaude } from '@/lib/claude'
import { PaperMetadata } from '@/lib/types'
import demoData from '@/data/demo-fallback.json'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    const { paper } = await request.json() as { paper: PaperMetadata }

    if (!paper || !paper.id) {
      return NextResponse.json({ error: 'Paper data is required' }, { status: 400 })
    }

    // Check if this paper is in our demo data
    const demoPaper = demoData.papers.find(p => p.id === paper.id)
    if (demoPaper) {
      return NextResponse.json({ paper: demoPaper, source: 'demo' })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      // Return a minimal processed version without Claude
      return NextResponse.json({
        paper: {
          ...paper,
          tldr: [
            { sentence: `This paper investigates ${paper.title.toLowerCase()}.`, sourceSentence: paper.abstract.substring(0, 100) },
            { sentence: 'The authors present methods and findings in the paper.', sourceSentence: paper.abstract.substring(100, 200) || paper.abstract },
            { sentence: 'Results are presented and discussed in detail.', sourceSentence: paper.abstract.substring(200) || paper.abstract },
          ],
          readingTime: Math.ceil(paper.abstract.split(' ').length / 200) + 10,
          sections: [
            {
              id: 'abstract',
              title: 'Abstract',
              content: paper.abstract,
              orientationSentence: 'The abstract provides an overview of the paper\'s contributions.',
              equations: [],
              figures: [],
            }
          ],
          variables: [],
          citations: [],
          evidenceChains: [],
        },
        source: 'fallback'
      })
    }

    // Process with Claude
    const processed = await processPaperWithClaude(paper)

    return NextResponse.json({
      paper: { ...paper, ...processed },
      source: 'claude'
    })
  } catch (error) {
    console.error('Processing error:', error)
    return NextResponse.json(
      { error: 'Processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
