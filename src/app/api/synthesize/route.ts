import { NextRequest, NextResponse } from 'next/server'
import { synthesizePapers } from '@/lib/claude'
import { PaperMetadata } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { papers, researchQuestion } = await request.json()

    if (!researchQuestion || typeof researchQuestion !== 'string') {
      return NextResponse.json({ error: 'researchQuestion is required' }, { status: 400 })
    }

    if (!Array.isArray(papers)) {
      return NextResponse.json({ error: 'papers must be an array' }, { status: 400 })
    }

    const synthesis = await synthesizePapers(papers as PaperMetadata[], researchQuestion)

    return NextResponse.json({ synthesis })
  } catch (error) {
    console.error('Synthesis error:', error)
    return NextResponse.json(
      { error: 'Synthesis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
