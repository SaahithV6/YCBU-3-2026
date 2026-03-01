'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SearchInput from '@/components/Search/SearchInput'
import PaperList from '@/components/Search/PaperList'
import { PaperMetadata, ProcessedPaper } from '@/lib/types'
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/nextjs'

type SearchStatus = 'idle' | 'searching' | 'results' | 'processing'

interface ProcessingState {
  [paperId: string]: string
}

export default function HomePage() {
  const router = useRouter()
  const [status, setStatus] = useState<SearchStatus>('idle')
  const [papers, setPapers] = useState<PaperMetadata[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [processingStatus, setProcessingStatus] = useState<ProcessingState>({})
  const [error, setError] = useState<string | null>(null)
  const [searchSource, setSearchSource] = useState<string>('')

  const handleSearch = async (query: string) => {
    setStatus('searching')
    setError(null)
    setPapers([])
    setSelectedIds([])
    setProcessingStatus({})

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) throw new Error('Search failed')

      const data = await response.json()
      setPapers(data.papers || [])
      setSearchSource(data.source || 'arxiv')
      setStatus('results')

      // Auto-select top 5
      setSelectedIds(data.papers.slice(0, 5).map((p: PaperMetadata) => p.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
      setStatus('idle')
    }
  }

  const handlePaperToggle = (paper: PaperMetadata) => {
    if (!paper.id) return
    setSelectedIds(prev =>
      prev.includes(paper.id!)
        ? prev.filter(id => id !== paper.id)
        : [...prev, paper.id!]
    )
  }

  const handleOpenDemo = () => {
    // Open first demo paper directly
    router.push(`/paper/${encodeURIComponent('arxiv:2209.11895')}`)
  }

  const handleProcessSelected = async () => {
    if (selectedIds.length === 0) return
    setStatus('processing')

    const selected = papers.filter(p => p.id && selectedIds.includes(p.id))

    // Process papers in parallel, update status as each completes
    const processPromises = selected.map(async (paper) => {
      setProcessingStatus(prev => ({ ...prev, [paper.id!]: 'processing...' }))

      try {
        const response = await fetch('/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paper }),
        })

        if (!response.ok) throw new Error('Processing failed')

        const data = await response.json()
        const processedPaper: ProcessedPaper = { ...data.paper, id: paper.id }

        // Store in sessionStorage for the paper page to pick up
        try {
          sessionStorage.setItem(`paper:${paper.id}`, JSON.stringify(processedPaper))
        } catch (e) {
          // Storage might be full, continue anyway
        }

        setProcessingStatus(prev => ({ ...prev, [paper.id!]: 'complete' }))
        return processedPaper
      } catch (e) {
        setProcessingStatus(prev => ({ ...prev, [paper.id!]: 'error' }))
        return null
      }
    })

    // Navigate to first paper as soon as it's ready
    const results = await Promise.allSettled(processPromises)
    const firstReady = selected[0]
    if (firstReady) {
      router.push(`/paper/${encodeURIComponent(firstReady.id!)}`)
    }
  }

  const allComplete = selectedIds.length > 0 &&
    selectedIds.every(id => processingStatus[id] === 'complete')

  const anyComplete = selectedIds.some(id => processingStatus[id] === 'complete')

  const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0e14', backgroundImage: "url('/grid-texture.svg')" }}>
      {/* Auth section */}
      {clerkEnabled && (
        <div className="absolute top-4 right-6 z-10 flex items-center gap-2">
          <SignedOut>
            <SignInButton mode="modal">
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: '#00d4aa', color: '#0a0e14' }}
              >
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton appearance={{ variables: { colorPrimary: '#00d4aa' } }} />
          </SignedIn>
        </div>
      )}

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 text-xs"
            style={{ backgroundColor: '#111827', border: '1px solid #00d4aa22', color: '#00d4aa' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" style={{ backgroundColor: '#00d4aa' }} />
            Research Intelligence Platform
          </div>

          <h1
            className="text-5xl md:text-6xl font-bold mb-4 leading-tight"
            style={{ color: '#e8e0d0', fontFamily: 'Syne, sans-serif' }}
          >
            Combo Papers
          </h1>

          <p
            className="text-lg mb-8 max-w-xl mx-auto leading-relaxed"
            style={{ color: '#9ca3af', fontFamily: 'IBM Plex Serif, serif' }}
          >
            Web agent-powered research intelligence. Autonomously surfaces, parses, and transforms scientific papers into deeply interactive learning experiences.
          </p>

          {/* Demo button */}
          <button
            onClick={handleOpenDemo}
            className="mb-4 px-5 py-2.5 rounded-lg text-sm transition-all"
            style={{
              backgroundColor: '#111827',
              color: '#f5a623',
              border: '1px solid #f5a62333',
            }}
          >
            → Try demo: Mechanistic Interpretability
          </button>

          {/* Saved Papers link */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/saved')}
              className="px-4 py-2 rounded-lg text-sm transition-all"
              style={{
                backgroundColor: '#111827',
                color: '#00d4aa',
                border: '1px solid #00d4aa33',
              }}
            >
              📚 Saved Papers
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-12">
          <SearchInput onSearch={handleSearch} isLoading={status === 'searching'} />
        </div>

        {/* Status message */}
        {status === 'searching' && (
          <div className="text-center py-8">
            <div className="text-2xl mb-3 animate-spin inline-block">⟳</div>
            <p style={{ color: '#9ca3af' }}>Searching research databases...</p>
            <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Scanning arXiv, Semantic Scholar, PubMed</p>
            <div className="inline-flex items-center gap-1.5 mt-3 text-xs" style={{ color: '#00d4aa' }}>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" style={{ backgroundColor: '#00d4aa' }} />
              Browser agent active
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-4">
            <p style={{ color: '#f5a623' }}>{error}</p>
          </div>
        )}

        {/* Results */}
        {(status === 'results' || status === 'processing') && papers.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display" style={{ color: '#e8e0d0', fontFamily: 'Syne, sans-serif' }}>
                  {papers.length} papers found
                </h2>
                <p className="text-xs" style={{ color: '#9ca3af' }}>
                  via {searchSource} · {selectedIds.length} selected
                </p>
              </div>

              <button
                onClick={handleProcessSelected}
                disabled={selectedIds.length === 0 || status === 'processing'}
                className="px-5 py-2.5 rounded-lg text-sm font-display transition-all"
                style={{
                  backgroundColor: selectedIds.length === 0 ? '#1a2235' : '#00d4aa',
                  color: selectedIds.length === 0 ? '#9ca3af' : '#0a0e14',
                }}
              >
                {status === 'processing'
                  ? `Processing ${Object.values(processingStatus).filter(s => s === 'complete').length}/${selectedIds.length}...`
                  : `Read ${selectedIds.length} paper${selectedIds.length !== 1 ? 's' : ''} →`
                }
              </button>
            </div>

            {status === 'processing' && (
              <div className="inline-flex items-center gap-1.5 mb-4 text-xs" style={{ color: '#00d4aa' }}>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" style={{ backgroundColor: '#00d4aa' }} />
                Browser agent active
              </div>
            )}

            <PaperList
              papers={papers}
              onSelectPaper={handlePaperToggle}
              selectedIds={selectedIds}
              processingStatus={processingStatus}
            />

            {/* "First paper ready" hint */}
            {status === 'processing' && anyComplete && (
              <div className="mt-4 p-3 rounded-lg text-center animate-fade-in" style={{ backgroundColor: '#111827', border: '1px solid #00d4aa22' }}>
                <p className="text-sm" style={{ color: '#00d4aa' }}>
                  First paper ready — you can start reading now
                </p>
                <button
                  onClick={() => {
                    const firstComplete = selectedIds.find(id => processingStatus[id] === 'complete')
                    if (firstComplete) router.push(`/paper/${encodeURIComponent(firstComplete)}`)
                  }}
                  className="mt-2 text-xs px-3 py-1.5 rounded"
                  style={{ backgroundColor: '#00d4aa', color: '#0a0e14' }}
                >
                  Start reading →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Feature highlights */}
        {status === 'idle' && (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '⚡', title: 'Web Agent Search', desc: 'Autonomous search across arXiv, bioRxiv, PubMed, Semantic Scholar' },
              { icon: '∑', title: 'Interactive Math', desc: 'Every equation blur-to-focus, click to expand derivation steps' },
              { icon: '◈', title: 'Rabbit Hole Navigation', desc: 'Follow any term or citation into a spatial navigation stack' },
              { icon: '⟳', title: 'Live Notebooks', desc: 'In-browser Python execution with Pyodide — no setup needed. Daytona sandboxes for full environments.' },
              { icon: '?', title: 'Prerequisites on Demand', desc: '"I don\'t understand this" — surfaces the missing concept inline' },
              { icon: '◎', title: 'Depth Meter', desc: 'Quiet engagement ring: no badges, just a signal of how deep you went' },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="p-4 rounded-xl"
                style={{ backgroundColor: '#111827', border: '1px solid #1a2235' }}
              >
                <div className="text-2xl mb-2 font-mono" style={{ color: '#00d4aa' }}>{icon}</div>
                <h3 className="font-display text-sm font-medium mb-1" style={{ color: '#e8e0d0', fontFamily: 'Syne, sans-serif' }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#9ca3af', fontFamily: 'IBM Plex Serif, serif' }}>{desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
