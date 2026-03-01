'use client'

import { useState } from 'react'

interface NotationWarningProps {
  symbol: string
  /** Previous definition of the symbol */
  previousDefinition: string
  /** New conflicting definition */
  newDefinition: string
  /** Section where the redefinition occurs */
  section: string
}

/**
 * Displays a warning badge when a variable symbol is redefined
 * with a different meaning across sections.
 */
export default function NotationWarning({
  symbol,
  previousDefinition,
  newDefinition,
  section,
}: NotationWarningProps) {
  const [open, setOpen] = useState(false)

  return (
    <span className="relative inline-flex items-center">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono transition-colors"
        style={{
          backgroundColor: '#f5a62322',
          color: '#f5a623',
          border: '1px solid #f5a62344',
        }}
        aria-label={`Notation warning for ${symbol}`}
      >
        <span>⚠</span>
        <span>{symbol}</span>
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 mb-2 z-50 w-72 rounded-xl p-3 shadow-xl"
          style={{
            backgroundColor: '#111827',
            border: '1px solid #f5a62333',
          }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <span style={{ color: '#f5a623' }}>⚠</span>
            <span
              className="text-xs font-semibold"
              style={{ color: '#f5a623', fontFamily: 'Syne, sans-serif' }}
            >
              Notation conflict
            </span>
          </div>

          <p className="text-xs mb-2" style={{ color: '#9ca3af', fontFamily: 'IBM Plex Serif, serif' }}>
            <span className="font-mono" style={{ color: '#f5a623' }}>{symbol}</span> is redefined in{' '}
            <em>{section}</em>.
          </p>

          <div className="space-y-1.5">
            <div
              className="text-xs p-2 rounded"
              style={{ backgroundColor: '#0a0e14', border: '1px solid #1a2235' }}
            >
              <span className="block text-[10px] uppercase tracking-wide mb-0.5" style={{ color: '#6b7280' }}>
                Earlier
              </span>
              <span style={{ color: '#e8e0d0', fontFamily: 'IBM Plex Serif, serif' }}>{previousDefinition}</span>
            </div>
            <div
              className="text-xs p-2 rounded"
              style={{ backgroundColor: '#0a0e14', border: '1px solid #f5a62333' }}
            >
              <span className="block text-[10px] uppercase tracking-wide mb-0.5" style={{ color: '#6b7280' }}>
                Here
              </span>
              <span style={{ color: '#e8e0d0', fontFamily: 'IBM Plex Serif, serif' }}>{newDefinition}</span>
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="mt-2 text-[10px] w-full text-center"
            style={{ color: '#6b7280' }}
          >
            Dismiss
          </button>
        </div>
      )}
    </span>
  )
}
