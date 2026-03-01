'use client'

import { useState, useEffect } from 'react'
import { ProcessedPaper } from '@/lib/types'
import NotebookCell from './NotebookCell'

interface NotebookEmbedProps {
  paper: ProcessedPaper
  isOpen: boolean
  onClose: () => void
  onCellRun?: () => void
}

interface NotebookData {
  cells: Array<{
    id: string
    type: 'markdown' | 'code' | 'output'
    content: string
    output?: string
    language?: string
  }>
  sandboxUrl?: string
  status: string
}

export default function NotebookEmbed({ paper, isOpen, onClose, onCellRun }: NotebookEmbedProps) {
  const [notebook, setNotebook] = useState<NotebookData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || notebook) return

    const createNotebook = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/notebook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paper, action: 'create' }),
        })
        if (response.ok) {
          const data = await response.json()
          setNotebook(data)
        }
      } catch (e) {
        console.error('Notebook error:', e)
      } finally {
        setIsLoading(false)
      }
    }

    createNotebook()
  }, [isOpen, paper, notebook])

  if (!isOpen) return null

  return (
    <div
      className="fixed right-0 top-0 h-full z-50 flex flex-col animate-slide-in-right"
      style={{
        width: '480px',
        backgroundColor: '#111827',
        borderLeft: '1px solid #1a2235',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid #1a2235' }}
      >
        <div>
          <p className="text-xs font-display uppercase tracking-wider" style={{ color: '#00d4aa' }}>Notebook</p>
          <p className="text-xs mt-0.5" style={{ color: '#9ca3af', maxWidth: '300px' }} title={paper.title}>
            {paper.title.substring(0, 50)}{paper.title.length > 50 ? '...' : ''}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded"
          style={{ color: '#9ca3af', backgroundColor: '#1a2235' }}
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin text-2xl mb-2">⟳</div>
              <p className="text-xs" style={{ color: '#9ca3af' }}>Generating notebook...</p>
            </div>
          </div>
        )}

        {!isLoading && notebook && (
          <div>
            {notebook.cells.map((cell) => (
              <NotebookCell
                key={cell.id}
                cell={cell}
                onRun={() => onCellRun?.()}
              />
            ))}
          </div>
        )}

        {!isLoading && !notebook && (
          <div className="flex items-center justify-center h-32">
            <p className="text-xs" style={{ color: '#9ca3af' }}>Failed to load notebook</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {notebook?.sandboxUrl && (
        <div
          className="px-4 py-2 text-xs"
          style={{ borderTop: '1px solid #1a2235', color: '#9ca3af' }}
        >
          <a href={notebook.sandboxUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#00d4aa' }}>
            Open in Daytona ↗
          </a>
        </div>
      )}
    </div>
  )
}
