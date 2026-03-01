'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'
import type { Paper } from '@/lib/types'

type PaperDoc = Paper & { _id: string; _creationTime: number }

export default function ThreadPage() {
  const params = useParams()
  const router = useRouter()
  const threadId = params.threadId as string

  const thread = useQuery(api.threads.get, threadId ? { id: threadId as Id<'threads'> } : 'skip') as any
  const papers = useQuery(api.papers.listByThread, threadId ? { threadId: threadId as Id<'threads'> } : 'skip') as PaperDoc[] | undefined

  if (thread === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⟳</div>
          <p style={{ color: 'var(--text-muted)' }}>Loading thread...</p>
        </div>
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="text-center">
          <p className="text-xl mb-4" style={{ color: 'var(--text)' }}>Thread not found</p>
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={() => router.push('/')}
          className="mb-6 text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          ← Back
        </button>

        <div className="mb-8">
          <h1
            className="text-3xl mb-2"
            style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}
          >
            {thread.title}
          </h1>
          <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
            Query: {thread.query}
          </p>
          <span
            className="inline-block text-xs px-2 py-0.5 rounded"
            style={{
              backgroundColor: thread.status === 'ready' ? 'rgba(0,212,170,0.15)' : 'rgba(245,166,35,0.15)',
              color: thread.status === 'ready' ? 'var(--teal)' : 'var(--amber)',
            }}
          >
            {thread.status}
          </span>
        </div>

        <div className="grid gap-4">
          {(papers || []).map(paper => (
            <div
              key={paper._id}
              className="p-4 rounded-xl cursor-pointer transition-all"
              style={{ backgroundColor: 'var(--bg2)', border: '1px solid var(--border)' }}
              onClick={() => router.push(`/paper/${paper._id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium mb-1 truncate" style={{ color: 'var(--text)' }}>
                    {paper.title}
                  </h3>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                    {paper.authors.slice(0, 3).join(', ')}
                    {paper.year ? ` · ${paper.year}` : ''}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    via {paper.sourceName}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className="text-xs px-2 py-0.5 rounded font-mono"
                    style={{ backgroundColor: 'var(--bg3)', color: 'var(--teal)' }}
                  >
                    {paper.relevanceScore}%
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: paper.status === 'ready' ? 'rgba(0,212,170,0.1)' : 'rgba(245,166,35,0.1)',
                      color: paper.status === 'ready' ? 'var(--teal)' : 'var(--amber)',
                    }}
                  >
                    {paper.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(!papers || papers.length === 0) && (
          <div className="p-6 rounded-xl text-center" style={{ backgroundColor: 'var(--bg2)', border: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {thread.status === 'searching' ? 'Searching for papers...' : 'No papers found in this thread.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
