'use client'

import { useState } from 'react'
import { Section, Variable, ReadingMode, EvidenceChain as EvidenceChainType } from '@/lib/types'
import EquationRenderer from './EquationRenderer'
import FigureViewer from './FigureViewer'
import DontUnderstandButton from './DontUnderstandButton'
import VariableHoverCard from './VariableHoverCard'
import EvidenceChain from './EvidenceChain'
import ProgressiveReveal from './ProgressiveReveal'

interface SectionRendererProps {
  section: Section
  variables: Variable[]
  paperTitle: string
  readingMode: ReadingMode
  onEquationExpand?: () => void
  onVariableHover?: () => void
  evidenceChains?: EvidenceChainType[]
}

function highlightVariables(text: string, variables: Variable[], onHover?: () => void): React.ReactNode[] {
  if (!variables.length) return [text]

  const varMap = new Map(variables.map(v => [v.symbol, v]))
  const sortedSymbols = Array.from(varMap.keys()).sort((a, b) => b.length - a.length)

  const parts: React.ReactNode[] = []
  let remaining = text
  let keyIndex = 0

  while (remaining.length > 0) {
    let earliestIndex = -1
    let matchedSymbol = ''

    for (const symbol of sortedSymbols) {
      const idx = remaining.indexOf(symbol)
      if (idx !== -1 && (earliestIndex === -1 || idx < earliestIndex)) {
        earliestIndex = idx
        matchedSymbol = symbol
      }
    }

    if (earliestIndex === -1) {
      parts.push(remaining)
      break
    }

    if (earliestIndex > 0) {
      parts.push(remaining.substring(0, earliestIndex))
    }

    const variable = varMap.get(matchedSymbol)!
    parts.push(
      <VariableHoverCard key={`var-${keyIndex++}`} symbol={matchedSymbol} variable={variable} onHover={onHover}>
        {matchedSymbol}
      </VariableHoverCard>
    )
    remaining = remaining.substring(earliestIndex + matchedSymbol.length)
  }

  return parts.length > 0 ? parts : [text]
}

export default function SectionRenderer({
  section,
  variables,
  paperTitle,
  readingMode,
  onEquationExpand,
  onVariableHover,
  evidenceChains = [],
}: SectionRendererProps) {
  const [activeParagraph, setActiveParagraph] = useState<number | null>(null)

  return (
    <section id={section.id} className="mb-12">
      <ProgressiveReveal>
        <h2
          className="text-2xl font-display mb-2"
          style={{ color: '#e8e0d0', fontFamily: 'Syne, sans-serif' }}
        >
          {section.title}
        </h2>
      </ProgressiveReveal>

      {section.content.map((block, i) => (
        <ProgressiveReveal key={block.id} delay={200 + i * 80}>
          {block.type === 'paragraph' && (
            <div
              className="relative group mb-4"
              onMouseEnter={() => setActiveParagraph(i)}
              onMouseLeave={() => setActiveParagraph(null)}
            >
              <p
                id={block.id}
                className="text-base leading-relaxed"
                style={{
                  color: '#e8e0d0',
                  fontFamily: 'IBM Plex Serif, serif',
                  lineHeight: '1.85',
                }}
              >
                {highlightVariables(block.raw, variables, onVariableHover)}
              </p>
              <div className={`mt-1 transition-opacity duration-200 ${activeParagraph === i ? 'opacity-100' : 'opacity-0'}`}>
                <DontUnderstandButton paragraph={block.raw} paperTitle={paperTitle} />
              </div>
            </div>
          )}
          {block.type === 'equation' && readingMode !== 'skim' && (
            <div
              id={block.id}
              className="equation-container p-4 rounded my-4 overflow-x-auto"
              style={{ backgroundColor: '#0a0e14', border: '1px solid #1a2235' }}
            >
              <span dangerouslySetInnerHTML={{ __html: `\\[${block.raw}\\]` }} />
            </div>
          )}
          {block.type === 'figure' && (
            <div id={block.id} className="my-4 text-sm italic" style={{ color: '#9ca3af' }}>
              {block.raw}
            </div>
          )}
        </ProgressiveReveal>
      ))}

      {/* Evidence chains */}
      {evidenceChains.length > 0 && readingMode === 'deep-dive' && (
        <ProgressiveReveal delay={400}>
          {evidenceChains.map((chain, i) => (
            <EvidenceChain key={i} chain={chain} />
          ))}
        </ProgressiveReveal>
      )}
    </section>
  )
}
