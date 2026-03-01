import { NextRequest, NextResponse } from 'next/server'
import { findPrerequisiteConcept } from '@/lib/claude'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const { paragraph, paperTitle } = await request.json()

    if (!paragraph || typeof paragraph !== 'string') {
      return NextResponse.json({ error: 'Paragraph text is required' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      // Demo fallback
      return NextResponse.json({
        concept: 'Sparse Coding',
        explanation: 'Sparse coding refers to neural representations where only a small fraction of neurons are active at any time. This is relevant here because the phenomenon described relies on this sparsity assumption to work.',
        sourceReference: 'Olshausen & Field, 1997',
        paperTitle: 'Sparse Coding with an Overcomplete Basis Set',
        paperUrl: 'https://arxiv.org/abs/cs/9709105',
        source: 'fallback'
      })
    }

    const result = await findPrerequisiteConcept(paragraph, paperTitle || 'Unknown Paper')

    return NextResponse.json({ ...result, source: 'claude' })
  } catch (error) {
    console.error('Prerequisite error:', error)
    return NextResponse.json(
      { error: 'Failed to find prerequisite', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
