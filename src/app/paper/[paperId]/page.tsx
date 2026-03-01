'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from 'convex/react'
import { useEffect } from 'react'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'

export default function PaperPage() {
  const params = useParams()
  const router = useRouter()
  const paperId = params.paperId as string

  const paper = useQuery(api.papers.get, paperId ? { id: paperId as Id<'papers'> } : 'skip')
  const incrementReaders = useMutation(api.papers.incrementReaders)

  useEffect(() => {
    if (!paperId) return
    incrementReaders({ id: paperId as Id<'papers'>, delta: 1 })
      .catch(() => {})
    return () => {
      incrementReaders({ id: paperId as Id<'papers'>, delta: -1 })
        .catch(() => {})
    }
  }, [paperId, incrementReaders])

  if (paper === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⟳</div>
          <p style={{ color: 'var(--text-muted)' }}>Loading paper...</p>
        </div>
      </div>
    )
  }

  if (!paper) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="text-center">
          <p className="text-xl mb-4" style={{ color: 'var(--text)' }}>Paper not found</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded"
            style={{ backgroundColor: 'var(--teal)', color: 'var(--bg)' }}
          >
            Back to search
          </button>
        </div>
      </div>
    )
  }

  const sections = (paper.sections as Array<{ id: string; title: string; level?: number; content: Array<{ id: string; type: string; raw: string }>; isAppendix?: boolean; marginNotes?: unknown[] }>) || []
  const tldr = (paper.tldr as Array<{ sentence: string; sourceSentenceId: string }> | undefined) ?? []

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.MathJax = { tex: { inlineMath: [['$','$'],['\\\\(','\\\\)']], displayMath: [['$$','$$'],['\\\\[','\\\\]']] }, svg: { fontCache: 'global' } };`,
        }}
      />
      <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js" async />

      <main className="max-w-3xl mx-auto px-6 py-12">
        <button
          onClick={() => router.push('/')}
          className="mb-6 flex items-center gap-2 text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          ← Back to search
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg3)', color: 'var(--text-muted)' }}>
              via {paper.sourceName}
            </span>
            {paper.readersOnline ? (
              <span className="text-xs" style={{ color: 'var(--teal)' }}>
                {paper.readersOnline} reading now
              </span>
            ) : null}
          </div>
          <h1 className="text-3xl font-medium mb-3" style={{ color: 'var(--text)', fontFamily: 'var(--font-serif)' }}>
            {paper.title}
          </h1>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            {paper.authors.slice(0, 5).join(', ')}
            {paper.venue ? ` · ${paper.venue}` : ''}
            {paper.year ? ` · ${paper.year}` : ''}
          </p>

          {/* TL;DR */}
          {tldr.length > 0 && (
            <div
              className="p-4 rounded-lg mb-6"
              style={{ backgroundColor: 'var(--teal-dim)', border: '1px solid rgba(0,212,170,0.2)' }}
            >
              <p className="text-xs font-mono mb-2" style={{ color: 'var(--teal)' }}>TL;DR</p>
              {tldr.map((t, i) => (
                <p key={i} className="text-sm mb-1 last:mb-0" style={{ color: 'var(--text)' }}>
                  <a
                    href={`#${t.sourceSentenceId}`}
                    className="hover:underline"
                    style={{ color: 'inherit' }}
                  >
                    {t.sentence}
                  </a>
                </p>
              ))}
            </div>
          )}

          {/* Relevance reason */}
          {paper.relevanceReason && (
            <p className="text-xs italic mb-4" style={{ color: 'var(--text-muted)' }}>
              Relevance: {paper.relevanceReason}
            </p>
          )}
        </div>

        {/* Status indicator */}
        {paper.status !== 'ready' && (
          <div
            className="p-4 rounded-lg mb-6 flex items-center gap-3"
            style={{ backgroundColor: 'var(--bg2)', border: '1px solid var(--border)' }}
          >
            <div className="animate-spin">⟳</div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {paper.status === 'extracting' && 'Extracting PDF text...'}
              {paper.status === 'parsing' && 'Parsing paper structure...'}
              {paper.status === 'queued' && 'Queued for processing...'}
              {paper.status === 'error' && 'Processing encountered an error'}
            </p>
          </div>
        )}

        {/* Sections */}
        {sections.map(section => (
          <div key={section.id} className="mb-10">
            <h2
              className={`mb-4 font-medium`}
              style={{
                color: 'var(--text)',
                fontFamily: 'var(--font-display)',
                fontSize: section.level === 1 ? '1.5rem' : section.level === 2 ? '1.25rem' : '1.1rem',
              }}
            >
              {section.title}
            </h2>
            {section.content.map(block => (
              <div key={block.id} id={block.id} className="mb-4">
                {block.type === 'paragraph' && (
                  <p className="leading-relaxed" style={{ color: 'var(--text)', lineHeight: '1.8' }}>
                    {block.raw}
                  </p>
                )}
                {block.type === 'equation' && (
                  <div
                    className="equation-container p-4 rounded my-4 overflow-x-auto"
                    style={{ backgroundColor: 'var(--bg3)', border: '1px solid var(--border)' }}
                  >
                    <span dangerouslySetInnerHTML={{ __html: `\\[${block.raw}\\]` }} />
                  </div>
                )}
                {block.type === 'figure' && (
                  <div className="my-4 text-sm italic" style={{ color: 'var(--text-muted)' }}>
                    {block.raw}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {/* PDF link */}
        <div className="mt-12 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
          <a
            href={paper.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm"
            style={{ backgroundColor: 'var(--bg2)', color: 'var(--teal)', border: '1px solid var(--border)' }}
          >
            ↗ View PDF
          </a>
          {paper.githubUrl && (
            <a
              href={paper.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm ml-3"
              style={{ backgroundColor: 'var(--bg2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              ⌥ Code
            </a>
          )}
        </div>
      </main>
    </div>
  )
}
