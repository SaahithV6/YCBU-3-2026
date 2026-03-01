'use client'

import { useState } from 'react'
import { Section, Variable, ReadingMode } from '@/lib/types'
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
  evidenceChains?: Array<{
    claim: string
    experiment: string
    figure?: string
    result: string
    conclusion: string
  }>
}

function highlightVariables(text: string, variables: Variable[], onHover?: () => void): React.ReactNode[] {
  if (!variables.length) return [text]

  const parts: React.ReactNode[] = []
  let remaining = text
  let keyIndex = 0

  for (const variable of variables) {
    const symbol = variable.symbol
    const index = remaining.indexOf(symbol)
    if (index === -1) continue

    if (index > 0) {
      parts.push(remaining.substring(0, index))
    }
    parts.push(
      <VariableHoverCard key={`var-${keyIndex++}`} symbol={symbol} variable={variable} onHover={onHover}>
        {symbol}
      </VariableHoverCard>
    )
    remaining = remaining.substring(index + symbol.length)
  }

  if (remaining) parts.push(remaining)
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

  const paragraphs = section.content.split('\n\n').filter(Boolean)

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

      {section.orientationSentence && (
        <ProgressiveReveal delay={100}>
          <p
            className="text-sm italic mb-4 pb-3"
            style={{ color: '#00d4aa', borderBottom: '1px solid #1a2235' }}
          >
            {section.orientationSentence}
          </p>
        </ProgressiveReveal>
      )}

      {paragraphs.map((paragraph, i) => (
        <ProgressiveReveal key={i} delay={200 + i * 80}>
          <div
            className="relative group mb-4"
            onMouseEnter={() => setActiveParagraph(i)}
            onMouseLeave={() => setActiveParagraph(null)}
          >
            <p
              className="text-base leading-relaxed"
              style={{
                color: '#e8e0d0',
                fontFamily: 'IBM Plex Serif, serif',
                lineHeight: '1.85',
              }}
            >
              {highlightVariables(paragraph, variables, onVariableHover)}
            </p>
            <div className={`mt-1 transition-opacity duration-200 ${activeParagraph === i ? 'opacity-100' : 'opacity-0'}`}>
              <DontUnderstandButton paragraph={paragraph} paperTitle={paperTitle} />
            </div>
          </div>
        </ProgressiveReveal>
      ))}

      {/* Equations */}
      {section.equations && section.equations.length > 0 && readingMode !== 'skim' && (
        <div>
          {section.equations.map((eq) => (
            <ProgressiveReveal key={eq.id} delay={300}>
              <EquationRenderer equation={eq} onExpand={onEquationExpand} />
            </ProgressiveReveal>
          ))}
        </div>
      )}

      {/* Figures */}
      {section.figures && section.figures.length > 0 && (
        <div>
          {section.figures.map((fig) => (
            <ProgressiveReveal key={fig.id} delay={300}>
              <FigureViewer figure={fig} isActive={readingMode === 'deep-dive'} />
            </ProgressiveReveal>
          ))}
        </div>
      )}

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
