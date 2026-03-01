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
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/nextjs'
import type { ArticleAnalysis } from '@/app/api/analyze-articles/route'
import type { DiscoveredArticle } from '@/app/api/browser-use/route'

interface SupermemoryResult {
  content: string
  metadata: { title: string; sourceUrl: string; paperId?: string }
  score: number
}

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
  const [relatedMemories, setRelatedMemories] = useState<SupermemoryResult[]>([])
  const [discoverLoading, setDiscoverLoading] = useState(false)
  const [discoveredArticles, setDiscoveredArticles] = useState<DiscoveredArticle[]>([])
  const [articleAnalysis, setArticleAnalysis] = useState<ArticleAnalysis | null>(null)
  const sectionRefs = useRef<HTMLElement[]>([])

  const { depth, recordAction } = useDepthMeter()
  const { stack, current: rabbitHoleCurrent, currentIndex: rabbitHoleIndex, push: pushRabbitHole, goBack: rabbitHoleBack, goForward: rabbitHoleForward } = useRabbitHole()

  // Load paper data — try MongoDB first, then sessionStorage, then demo
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

    // Try MongoDB via API
    let mounted = true
    fetch(`/api/papers/${encodeURIComponent(decodedId)}`)
      .then(async (res) => {
        if (res.ok && mounted) {
          const data = await res.json() as ProcessedPaper
          setPaper(data)
        }
      })
      .catch(() => {/* MongoDB unavailable — silently ignore */})
      .finally(() => { if (mounted) setIsLoading(false) })

    const timeoutId = setTimeout(() => {
      if (mounted) setIsLoading(false)
    }, 30000)

    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [params.id])

  // Query Supermemory for cross-session recall (non-blocking)
  useEffect(() => {
    if (!paper?.title) return
    fetch('/api/prerequisite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paragraph: paper.title, paperTitle: paper.title, mode: 'recall' }),
    }).catch(() => {/* skip */})

    // Directly query supermemory for related papers
    ;(async () => {
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: `related:${paper.title}`, recallOnly: true }),
        })
        if (res.ok) {
          const data = await res.json() as { memories?: SupermemoryResult[] }
          if (data.memories && data.memories.length > 0) {
            setRelatedMemories(data.memories)
          }
        }
      } catch {
        // Supermemory unavailable — silently skip
      }
    })()
  }, [paper?.title])

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

  const handleDiscoverRelated = async () => {
    if (!paper?.title || discoverLoading) return
    setDiscoverLoading(true)
    setDiscoveredArticles([])
    setArticleAnalysis(null)
    try {
      // Step 1: Discover articles
      const discoverRes = await fetch('/api/browser-use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: paper.title, maxResults: 15 }),
      })
      if (!discoverRes.ok) throw new Error('Discovery failed')
      const { articles } = await discoverRes.json() as { articles: DiscoveredArticle[] }
      setDiscoveredArticles(articles)

      // Step 2: Analyze with Claude
      if (articles.length > 0) {
        const analyzeRes = await fetch('/api/analyze-articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articles, topic: paper.title }),
        })
        if (analyzeRes.ok) {
          const { analysis } = await analyzeRes.json() as { analysis: ArticleAnalysis }
          setArticleAnalysis(analysis)
        }
      }
    } catch (e) {
      console.warn('Discover related failed:', e)
    } finally {
      setDiscoverLoading(false)
    }
  }

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⟳</div>
          <p className="text-text-muted">Loading paper...</p>
        </div>
      </div>
    )
  }

  if (!paper) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl mb-4 text-text">Paper not found</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded bg-teal text-background"
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
    <div className="min-h-screen bg-background">
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
        <div className="fixed inset-0 z-50 flex flex-col bg-background/95">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-2">
            <div className="flex items-center gap-4">
              <h2 className="font-display text-text" style={{ fontFamily: 'Syne, sans-serif' }}>
                Citation Graph
              </h2>
              <div className="flex gap-1">
                {(['all', 'foundational', 'recent'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setCitationFilter(f)}
                    className={`text-xs px-2.5 py-1 rounded transition-all capitalize ${citationFilter === f ? 'bg-teal text-background' : 'bg-surface-2 text-text-muted'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setShowCitationGraph(false)}
              className="px-3 py-1.5 rounded text-sm bg-surface-2 text-text-muted"
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
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-sm transition-all text-text-muted"
          >
            ← Back to search
          </button>
          {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && (
            <div className="flex items-center gap-2">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal text-background">
                    Sign in
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton appearance={{ variables: { colorPrimary: '#00d4aa' } }} />
              </SignedIn>
            </div>
          )}
        </div>

        {/* Previously read indicator */}
        {relatedMemories.length > 0 && (
          <div className="mb-4 px-3 py-2 rounded border border-teal/30 bg-teal/5 text-xs text-teal">
            📚 You&apos;ve explored {relatedMemories.length} related paper{relatedMemories.length > 1 ? 's' : ''} before
          </div>
        )}

        <HeaderZone
          paper={paper}
          readingMode={readingMode}
          onReadingModeChange={setReadingMode}
        />

        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          <button
            onClick={() => setShowCitationGraph(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-all bg-surface text-text-muted border border-surface-2"
            title="Citation graph (C)"
          >
            ⬡ Citations
          </button>
          <button
            onClick={() => setShowNotebook(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-all bg-surface text-text-muted border border-surface-2"
            title="Notebook (N)"
          >
            ⌥ Notebook
          </button>
          <button
            onClick={() => setShowGlossary(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-all bg-surface text-text-muted border border-surface-2"
          >
            Ω Glossary
          </button>
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-all bg-surface text-text-muted border border-surface-2"
            title="Keyboard shortcuts (?)"
          >
            ? Shortcuts
          </button>
          <button
            onClick={handleDiscoverRelated}
            disabled={discoverLoading}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-all bg-surface border border-surface-2 disabled:opacity-50 ${discoverLoading ? 'text-text-muted' : 'text-amber'}`}
          >
            {discoverLoading ? <><span className="animate-spin">⟳</span> Discovering...</> : '🔍 Discover Related'}
          </button>
        </div>

        {/* Sections */}
        {visibleSections.map((section, i) => (
          <SectionRenderer
            key={section.id}
            section={section}
            variables={paper.variables || []}
            equations={paper.equations || []}
            figures={paper.figures || []}
            paperTitle={paper.title}
            readingMode={readingMode}
            onEquationExpand={() => recordAction('expandedEquation')}
            onVariableHover={() => recordAction('hoveredVariable')}
            evidenceChains={i === visibleSections.length - 1 ? paper.evidenceChains : []}
          />
        ))}

        {/* Discover Related Papers results */}
        {(discoveredArticles.length > 0 || articleAnalysis) && (
          <section className="mt-12 pt-8 border-t border-surface-2">
            <h2 className="text-xl font-display text-text mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
              🔍 Related Papers
            </h2>

            {articleAnalysis && (
              <div className="mb-6 p-4 rounded-lg bg-surface border border-surface-2">
                <p className="text-sm text-text-muted mb-3 font-serif leading-relaxed">{articleAnalysis.summary}</p>
                {articleAnalysis.synthesis && (
                  <p className="text-sm text-text font-serif leading-relaxed">{articleAnalysis.synthesis}</p>
                )}
              </div>
            )}

            {articleAnalysis?.mostRelevant && articleAnalysis.mostRelevant.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-display uppercase tracking-wider text-teal mb-3">Most Relevant</h3>
                <div className="space-y-3">
                  {articleAnalysis.mostRelevant.map((a, i) => (
                    <div key={i} className="p-3 rounded bg-surface border border-surface-2">
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-teal hover:underline"
                      >
                        {a.title}
                      </a>
                      <p className="text-xs text-text-muted mt-1">{a.reason}</p>
                      {a.keyFindings.length > 0 && (
                        <ul className="mt-2 space-y-0.5">
                          {a.keyFindings.map((f, j) => (
                            <li key={j} className="text-xs text-text-muted">• {f}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {articleAnalysis?.researchBrief && (
              <div className="mb-6 p-4 rounded-lg bg-surface border border-amber/20">
                <h3 className="text-sm font-display uppercase tracking-wider text-amber mb-2">Research Brief</h3>
                <p className="text-sm text-text font-serif leading-relaxed whitespace-pre-line">
                  {articleAnalysis.researchBrief}
                </p>
              </div>
            )}

            {discoveredArticles.length > 0 && (
              <div>
                <h3 className="text-sm font-display uppercase tracking-wider text-text-muted mb-3">
                  All Discovered ({discoveredArticles.length})
                </h3>
                <div className="space-y-2">
                  {discoveredArticles.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded hover:bg-surface transition-colors">
                      <span className="text-xs text-text-muted font-mono mt-0.5 w-6 shrink-0">{i + 1}</span>
                      <div className="min-w-0">
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-text hover:text-teal transition-colors"
                        >
                          {a.title}
                        </a>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-text-muted">{a.source}</span>
                          {a.year && <span className="text-xs text-text-muted">{a.year}</span>}
                          {a.citation_count != null && (
                            <span className="text-xs text-text-muted">{a.citation_count.toLocaleString()} citations</span>
                          )}
                          {a.pdf_url && (
                            <a
                              href={a.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-teal hover:underline"
                            >
                              PDF ↗
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Section navigation */}
        {sections.length > 1 && (
          <div className="sticky bottom-6 flex justify-center gap-2 mt-8">
            <button
              onClick={() => scrollToSection(currentSectionIndex - 1)}
              disabled={currentSectionIndex === 0}
              className="px-4 py-2 rounded-lg text-sm bg-surface text-text-muted border border-surface-2 disabled:opacity-40"
            >
              ↑ Prev (K)
            </button>
            <span className="px-3 py-2 text-xs font-mono text-text-muted">
              {currentSectionIndex + 1} / {sections.length}
            </span>
            <button
              onClick={() => scrollToSection(currentSectionIndex + 1)}
              disabled={currentSectionIndex === sections.length - 1}
              className="px-4 py-2 rounded-lg text-sm bg-surface text-text-muted border border-surface-2 disabled:opacity-40"
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
