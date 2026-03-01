import { NextRequest, NextResponse } from 'next/server'
import { extractPdf } from '@/lib/extractPdf'
import { parsePaperFromText } from '@/lib/parsePaper'
import { generateNotebook } from '@/lib/generateNotebook'
import { extractVariables } from '@/lib/extractVariables'
import { storeInSupermemory } from '@/lib/supermemory'
import { Section } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const paperData = body.paper || body
    const { title, authors, pdfUrl, sourceUrl, sourceName } = paperData
    const paperId = paperData.paperId || paperData.id

    if (!pdfUrl || !title) {
      return NextResponse.json({ error: 'pdfUrl and title are required' }, { status: 400 })
    }

    // Stage 1: Extract PDF text
    let pdfText = ''
    try {
      pdfText = await extractPdf(pdfUrl)
    } catch (err) {
      console.warn('PDF extraction failed, proceeding with empty text:', err)
    }

    // Stage 2: Parse with Claude
    const parsed = await parsePaperFromText(title, authors || [], pdfText, sourceUrl || pdfUrl)

    // Stage 3: Extract variables with dedicated pass
    let variables = parsed.variables || []
    let notationWarnings = parsed.notationWarnings || []
    if (parsed.sections && parsed.sections.length > 0) {
      try {
        const extracted = await extractVariables(parsed.sections as Section[])
        if (extracted.variables.length > 0) variables = extracted.variables
        if (extracted.notationWarnings.length > 0) notationWarnings = extracted.notationWarnings
      } catch (err) {
        console.warn('Variable extraction failed:', err)
      }
    }

    // Stage 4: Generate notebook
    let notebookCells = parsed.notebookCells || []
    if (parsed.sections && parsed.sections.length > 0) {
      try {
        const cells = await generateNotebook(title, parsed.sections as Section[], parsed.githubUrl)
        if (cells.length > 0) notebookCells = cells
      } catch (err) {
        console.warn('Notebook generation failed:', err)
      }
    }

    // Store in Supermemory for future prerequisite lookups
    if (pdfText) {
      storeInSupermemory(
        `${title}\n\n${pdfText.substring(0, 2000)}`,
        { title, sourceUrl: sourceUrl || pdfUrl, paperId }
      ).catch(err => console.warn('Supermemory store failed:', err))
    }

    return NextResponse.json({
      paperId,
      status: 'ready',
      paper: {
        id: paperId,
        status: 'ready',
        title,
        authors: authors || [],
        pdfUrl,
        sourceUrl: sourceUrl || pdfUrl,
        sourceName: sourceName || 'arXiv',
        ...parsed,
        variables,
        notationWarnings,
        notebookCells,
      },
    })
  } catch (error) {
    console.error('Processing error:', error)
    return NextResponse.json(
      { error: 'Processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
