'use client'

import { useState, useCallback } from 'react'

interface DepthActions {
  hoveredVariable: boolean
  expandedEquation: boolean
  ranNotebookCell: boolean
  clickedCitation: boolean
  clickedPrerequisite: boolean
}

const ACTION_WEIGHTS: Record<keyof DepthActions, number> = {
  hoveredVariable: 0.05,
  expandedEquation: 0.1,
  ranNotebookCell: 0.2,
  clickedCitation: 0.1,
  clickedPrerequisite: 0.15,
}

export function useDepthMeter() {
  const [depth, setDepth] = useState(0)
  const [actions, setActions] = useState<Partial<Record<keyof DepthActions, number>>>({})

  const recordAction = useCallback((action: keyof DepthActions) => {
    setActions(prev => {
      const count = (prev[action] || 0) + 1
      const updated = { ...prev, [action]: count }
      
      // Calculate total depth (capped at 1.0)
      let total = 0
      for (const [key, cnt] of Object.entries(updated)) {
        const weight = ACTION_WEIGHTS[key as keyof DepthActions]
        // Diminishing returns after 3 actions of same type
        total += weight * Math.min(cnt as number, 3)
      }
      setDepth(Math.min(total, 1.0))
      
      return updated
    })
  }, [])

  return { depth, recordAction }
}
