'use client'

import { useState } from 'react'
import { NotebookCell as NotebookCellType } from '@/lib/types'

interface NotebookCellProps {
  cell: NotebookCellType
  onRun?: (cellId: string) => void
}

export default function NotebookCell({ cell, onRun }: NotebookCellProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [output, setOutput] = useState('')

  const handleRun = async () => {
    if (cell.type !== 'code') return
    setIsRunning(true)
    try {
      await new Promise(r => setTimeout(r, 800)) // Simulate execution
      setOutput(`# Output\nExecution simulated. In production, this would run in a Daytona sandbox.\n\nCell executed successfully at ${new Date().toISOString()}`)
      onRun?.(cell.id)
    } finally {
      setIsRunning(false)
    }
  }

  if (cell.type === 'markdown') {
    return (
      <div
        className="p-4 rounded-t-none rounded-b-none"
        style={{ borderBottom: '1px solid #1a2235' }}
      >
        <div
          className="text-sm leading-relaxed prose prose-invert max-w-none"
          style={{ color: '#e8e0d0', fontFamily: 'IBM Plex Serif, serif' }}
        >
          {cell.content.split('\n').map((line, i) => {
            if (line.startsWith('# ')) {
              return <h3 key={i} style={{ color: '#e8e0d0', fontFamily: 'Syne', fontSize: '1rem', marginBottom: '0.5rem' }}>{line.slice(2)}</h3>
            }
            return <span key={i}>{line}<br /></span>
          })}
        </div>
      </div>
    )
  }

  if (cell.type === 'code') {
    return (
      <div style={{ borderBottom: '1px solid #1a2235' }}>
        <div className="flex items-center justify-between px-3 py-1.5" style={{ backgroundColor: '#0d1117' }}>
          <span className="text-xs font-mono" style={{ color: '#9ca3af' }}>
            python
          </span>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="text-xs px-2.5 py-1 rounded flex items-center gap-1.5 transition-all"
            style={{
              backgroundColor: isRunning ? '#1a2235' : '#00d4aa1a',
              color: isRunning ? '#9ca3af' : '#00d4aa',
              border: `1px solid ${isRunning ? '#1a2235' : '#00d4aa33'}`,
            }}
          >
            {isRunning ? (
              <>
                <span className="animate-spin text-xs">⟳</span>
                Running...
              </>
            ) : (
              <>▶ Run</>
            )}
          </button>
        </div>
        <pre
          className="p-4 overflow-x-auto text-sm"
          style={{
            backgroundColor: '#0a0e14',
            color: '#e8e0d0',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.8rem',
          }}
        >
          <code>{cell.content}</code>
        </pre>
        {output && (
          <div
            className="px-4 py-3 text-xs font-mono"
            style={{
              backgroundColor: '#080c12',
              color: '#00d4aa',
              borderTop: '1px solid #1a2235',
              whiteSpace: 'pre-wrap',
            }}
          >
            {output}
          </div>
        )}
      </div>
    )
  }

  return null
}
