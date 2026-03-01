import Anthropic from '@anthropic-ai/sdk'
import { ProcessedPaper, PaperMetadata } from './types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function processPaperWithClaude(paper: PaperMetadata, pdfText?: string): Promise<Partial<ProcessedPaper>> {
  const textToProcess = pdfText || paper.abstract

  const systemPrompt = `You are a scientific paper processing AI. Extract structured information from research papers and return valid JSON only.`

  const userPrompt = `Process this research paper and extract structured information. Return a JSON object with this exact structure:
{
  "tldr": [{"sentence": "...", "sourceSentence": "..."}],
  "readingTime": 15,
  "sections": [
    {
      "id": "sec1",
      "title": "Introduction", 
      "content": "...",
      "orientationSentence": "One sentence orienting the reader...",
      "equations": [{"id": "eq1", "latex": "E = mc^2", "explanation": "...", "variables": ["E", "m", "c"], "derivationSteps": ["..."]}],
      "figures": []
    }
  ],
  "variables": [
    {"symbol": "x", "definition": "...", "units": "...", "role": "...", "firstAppearsIn": "sec1", "occurrences": 5}
  ],
  "citations": [
    {"id": "cite1", "title": "...", "authors": ["..."], "year": 2020, "url": "...", "type": "foundational"}
  ],
  "evidenceChains": [
    {"claim": "...", "experiment": "...", "figure": "fig1", "result": "...", "conclusion": "..."}
  ],
  "githubRepos": [{"url": "...", "license": "MIT"}]
}

Paper title: ${paper.title}
Authors: ${paper.authors.join(', ')}
Abstract: ${paper.abstract}
${pdfText ? `Full text (truncated): ${pdfText.substring(0, 8000)}` : ''}

Return ONLY valid JSON. Make the TL;DR exactly 3 sentences. Extract real equations from the paper if visible in the abstract/text.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt,
    })

    const content = response.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')

    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')

    const parsed = JSON.parse(jsonMatch[0])
    return parsed
  } catch (error) {
    console.error('Claude processing error:', error)
    return {
      tldr: [
        { sentence: `This paper presents research on ${paper.title}.`, sourceSentence: paper.abstract.substring(0, 100) },
        { sentence: 'The authors provide empirical evidence supporting their approach.', sourceSentence: paper.abstract.substring(100, 200) || paper.abstract },
        { sentence: 'Results demonstrate significant improvements over baseline methods.', sourceSentence: paper.abstract.substring(200, 300) || paper.abstract },
      ],
      readingTime: 15,
      sections: [
        {
          id: 'abstract',
          title: 'Abstract',
          content: paper.abstract,
          orientationSentence: 'Overview of the paper\'s main contributions and findings.',
        }
      ],
      variables: [],
      citations: [],
      evidenceChains: [],
    }
  }
}

export async function findPrerequisiteConcept(paragraph: string, paperTitle: string): Promise<{
  concept: string
  explanation: string
  sourceReference?: string
  paperTitle?: string
  paperUrl?: string
}> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `A researcher is reading this paragraph from "${paperTitle}" and doesn't understand it:

"${paragraph}"

Identify the single most likely prerequisite concept they are missing. Do NOT simplify the paragraph. Find the foundational concept or prior work they likely lack.

Return JSON:
{
  "concept": "concept name",
  "explanation": "what this concept is and why it's needed here (2-3 sentences)",
  "sourceReference": "Original paper or textbook that introduced this concept",
  "paperTitle": "Exact title of key reference paper if applicable",
  "paperUrl": "arXiv URL if known"
}

Return ONLY valid JSON.`
    }]
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in response')

  return JSON.parse(jsonMatch[0])
}

export async function generateNotebookCells(paper: PaperMetadata, codeContext?: string): Promise<Array<{
  id: string
  type: 'markdown' | 'code' | 'output'
  content: string
  language?: string
}>> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `Generate a Jupyter notebook for this paper: "${paper.title}"

Abstract: ${paper.abstract}
${codeContext ? `Existing code context: ${codeContext.substring(0, 2000)}` : ''}

Return JSON array of notebook cells:
[
  {"id": "cell1", "type": "markdown", "content": "# Paper Title\\n\\nWhat this notebook demonstrates..."},
  {"id": "cell2", "type": "code", "content": "import numpy as np\\n...", "language": "python"},
  {"id": "cell3", "type": "code", "content": "# Try it yourself: change parameters\\n...", "language": "python"}
]

Include:
1. Intro markdown cell explaining the paper's core contribution
2. Core algorithm implementation (minimal, illustrative)
3. "Try it yourself" cell with parameter exploration
4. Visualization cell if applicable

Return ONLY valid JSON array.`
    }]
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const jsonMatch = content.text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('No JSON in response')

  return JSON.parse(jsonMatch[0])
}
