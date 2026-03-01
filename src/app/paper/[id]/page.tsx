'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProcessedPaper, ReadingMode, Citation, RabbitHoleItem } from '@/lib/types'
import HeaderZone from '@/components/LivingPage/HeaderZone'
import SectionRenderer from '@/components/LivingPage/SectionRenderer'
import DepthMeter from '@/components/LivingPage/DepthMeter'
import CitationGraph from '@/components/CitationGraph/CitationGraph'
import NotebookEmbed from '@/components/Notebook/NotebookEmbed'
import RabbitHoleStack from '@/components/RabbitHole/RabbitHoleStack'
import RabbitHolePanel from '@/components/RabbitHole/RabbitHolePanel'
import GlossarySidebar from '@/components/Glossary/GlossarySidebar'
import KeyboardShortcuts from '@/components/Navigation/KeyboardShortcuts'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useDepthMeter } from '@/hooks/useDepthMeter'
import { useRabbitHole } from '@/hooks/useRabbitHole'
import demoData from '@/data/demo-fallback.json'

export default function PaperPage() {
  const params = useParams()
  const router = useRouter()
  const [paper, setPaper] = useState<ProcessedPaper | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [readingMode, setReadingMode] = useState<ReadingMode>('read')
  const [showCitationGraph, setShowCitationGraph] = useState(false)
  const [showNotebook, setShowNotebook] = useState(false)
  const [showGlossary, setShowGlossary] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showRabbitHolePanel, setShowRabbitHolePanel] = useState(false)
  const [citationFilter, setCitationFilter] = useState<'all' | 'foundational' | 'recent'>('all')
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const sectionRefs = useRef<HTMLElement[]>([])

  const { depth, recordAction } = useDepthMeter()
  const { stack, current: rabbitHoleCurrent, currentIndex: rabbitHoleIndex, push: pushRabbitHole, goBack: rabbitHoleBack, goForward: rabbitHoleForward } = useRabbitHole()

  // Load paper data
  useEffect(() => {
    const id = params.id as string
    if (!id) return

    const decodedId = decodeURIComponent(id)
    
    // Check demo data first
    const demoPaper = demoData.papers.find(p => p.id === decodedId || p.id.replace('arxiv:', '') === decodedId)
    if (demoPaper) {
      setPaper(demoPaper as unknown as ProcessedPaper)
      setIsLoading(false)
      return
    }

    // Load from sessionStorage (papers processed during search)
    try {
      const stored = sessionStorage.getItem(`paper:${decodedId}`)
      if (stored) {
        setPaper(JSON.parse(stored))
        setIsLoading(false)
        return
      }
    } catch (e) {
      // ignore
    }

    // Safety timeout: stop loading after 30 s rather than spinning forever
    let mounted = true
    const timeoutId = setTimeout(() => {
      if (mounted) setIsLoading(false)
    }, 30000)

    // No server-side cache to query without original metadata — stop loading now
    setIsLoading(false)

    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [params.id])

  const sections = paper?.sections || []

  // Track current section via IntersectionObserver
  useEffect(() => {
    if (!sections.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = sections.findIndex(s => s.id === entry.target.id)
            if (idx !== -1) setCurrentSectionIndex(idx)
          }
        }
      },
      // rootMargin: detect section when it occupies the middle 5% of the viewport
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    )
    sections.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [sections])

  const scrollToSection = (index: number) => {
    const clipped = Math.max(0, Math.min(index, sections.length - 1))
    setCurrentSectionIndex(clipped)
    const el = document.getElementById(sections[clipped]?.id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useKeyboardShortcuts({
    onNextSection: () => scrollToSection(currentSectionIndex + 1),
    onPrevSection: () => scrollToSection(currentSectionIndex - 1),
    onToggleNotebook: () => setShowNotebook(v => !v),
    onToggleCitationGraph: () => setShowCitationGraph(v => !v),
    onSwitchReadingMode: () => {
      const modes: ReadingMode[] = ['skim', 'read', 'deep-dive']
      const next = modes[(modes.indexOf(readingMode) + 1) % modes.length]
      setReadingMode(next)
    },
    onRabbitHoleBack: rabbitHoleBack,
    onRabbitHoleForward: rabbitHoleForward,
    onShowHelp: () => setShowHelp(v => !v),
  })

  const handleCitationClick = (citation: Citation) => {
    const item: RabbitHoleItem = {
      id: citation.id,
      title: citation.title,
      type: 'paper',
      paperId: citation.id,
    }
    pushRabbitHole(item)
    setShowRabbitHolePanel(true)
    recordAction('clickedCitation')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0e14' }}>
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⟳</div>
          <p style={{ color: '#9ca3af' }}>Loading paper...</p>
        </div>
      </div>
    )
  }

  if (!paper) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0e14' }}>
        <div className="text-center">
          <p className="text-xl mb-4" style={{ color: '#e8e0d0' }}>Paper not found</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded"
            style={{ backgroundColor: '#00d4aa', color: '#0a0e14' }}
          >
            Back to search
          </button>
        </div>
      </div>
    )
  }

  // Filter sections based on reading mode
  const visibleSections = readingMode === 'skim'
    ? sections.slice(0, 1)  // Abstract only in skim
    : sections

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0e14' }}>
      {/* MathJax */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.MathJax = {
              tex: { inlineMath: [['$', '$'], ['\\\\(', '\\\\)']], displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']] },
              svg: { fontCache: 'global' }
            };
          `,
        }}
      />
      <script
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
        async
      />

      {/* Rabbit Hole Stack */}
      <RabbitHoleStack
        stack={stack}
        currentIndex={rabbitHoleIndex}
        onNavigate={(i) => {}}
      />

      {/* Rabbit Hole Panel */}
      {showRabbitHolePanel && rabbitHoleCurrent && (
        <RabbitHolePanel
          item={rabbitHoleCurrent}
          onGoDeeper={(item) => {
            setShowRabbitHolePanel(false)
            if (item.paperId) {
              router.push(`/paper/${encodeURIComponent(item.paperId)}`)
            }
          }}
          onClose={() => setShowRabbitHolePanel(false)}
        />
      )}

      {/* Glossary Sidebar */}
      <GlossarySidebar
        variables={paper.variables || []}
        isOpen={showGlossary}
        onClose={() => setShowGlossary(false)}
        onVariableClick={() => recordAction('hoveredVariable')}
      />

      {/* Notebook */}
      {showNotebook && (
        <NotebookEmbed
          paper={paper}
          isOpen={showNotebook}
          onClose={() => setShowNotebook(false)}
          onCellRun={() => recordAction('ranNotebookCell')}
        />
      )}

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcuts isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Citation Graph Overlay */}
      {showCitationGraph && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ backgroundColor: 'rgba(10, 14, 20, 0.97)' }}
        >
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1a2235' }}>
            <div className="flex items-center gap-4">
              <h2 className="font-display" style={{ color: '#e8e0d0', fontFamily: 'Syne, sans-serif' }}>
                Citation Graph
              </h2>
              <div className="flex gap-1">
                {(['all', 'foundational', 'recent'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setCitationFilter(f)}
                    className="text-xs px-2.5 py-1 rounded transition-all capitalize"
                    style={{
                      backgroundColor: citationFilter === f ? '#00d4aa' : '#1a2235',
                      color: citationFilter === f ? '#0a0e14' : '#9ca3af',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setShowCitationGraph(false)}
              className="px-3 py-1.5 rounded text-sm"
              style={{ backgroundColor: '#1a2235', color: '#9ca3af' }}
            >
              Close (C)
            </button>
          </div>
          <div className="flex-1">
            <CitationGraph
              citations={paper.citations || []}
              paperTitle={paper.title}
              onCitationClick={handleCitationClick}
              filter={citationFilter}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Back button */}
        <button
          onClick={() => router.push('/')}
          className="mb-6 flex items-center gap-2 text-sm transition-all"
          style={{ color: '#9ca3af' }}
        >
          ← Back to search
        </button>

        <HeaderZone
          paper={paper}
          readingMode={readingMode}
          onReadingModeChange={setReadingMode}
        />

        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          <button
            onClick={() => setShowCitationGraph(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-all"
            style={{ backgroundColor: '#111827', color: '#9ca3af', border: '1px solid #1a2235' }}
            title="Citation graph (C)"
          >
            ⬡ Citations
          </button>
          <button
            onClick={() => setShowNotebook(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-all"
            style={{ backgroundColor: '#111827', color: '#9ca3af', border: '1px solid #1a2235' }}
            title="Notebook (N)"
          >
            ⌥ Notebook
          </button>
          <button
            onClick={() => setShowGlossary(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-all"
            style={{ backgroundColor: '#111827', color: '#9ca3af', border: '1px solid #1a2235' }}
          >
            Ω Glossary
          </button>
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-all"
            style={{ backgroundColor: '#111827', color: '#9ca3af', border: '1px solid #1a2235' }}
            title="Keyboard shortcuts (?)"
          >
            ? Shortcuts
          </button>
        </div>

        {/* Sections */}
        {visibleSections.map((section, i) => (
          <SectionRenderer
            key={section.id}
            section={section}
            variables={paper.variables || []}
            equations={paper.equations || []}
            paperTitle={paper.title}
            readingMode={readingMode}
            onEquationExpand={() => recordAction('expandedEquation')}
            onVariableHover={() => recordAction('hoveredVariable')}
            evidenceChains={i === visibleSections.length - 1 ? paper.evidenceChains : []}
          />
        ))}

        {/* Section navigation */}
        {sections.length > 1 && (
          <div className="sticky bottom-6 flex justify-center gap-2 mt-8">
            <button
              onClick={() => scrollToSection(currentSectionIndex - 1)}
              disabled={currentSectionIndex === 0}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ backgroundColor: '#111827', color: '#9ca3af', border: '1px solid #1a2235' }}
            >
              ↑ Prev (K)
            </button>
            <span className="px-3 py-2 text-xs font-mono" style={{ color: '#9ca3af' }}>
              {currentSectionIndex + 1} / {sections.length}
            </span>
            <button
              onClick={() => scrollToSection(currentSectionIndex + 1)}
              disabled={currentSectionIndex === sections.length - 1}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ backgroundColor: '#111827', color: '#9ca3af', border: '1px solid #1a2235' }}
            >
              ↓ Next (J)
            </button>
          </div>
        )}
      </main>

      {/* Depth Meter */}
      <DepthMeter depth={depth} />
    </div>
  )
}
