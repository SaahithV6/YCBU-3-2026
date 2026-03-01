'use client'

import { useState, useCallback } from 'react'
import { RabbitHoleItem } from '@/lib/types'

export function useRabbitHole() {
  const [stack, setStack] = useState<RabbitHoleItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)

  const push = useCallback((item: RabbitHoleItem) => {
    setStack(prev => {
      const newStack = [...prev.slice(0, currentIndex + 1), item]
      setCurrentIndex(newStack.length - 1)
      return newStack
    })
  }, [currentIndex])

  const goBack = useCallback(() => {
    setCurrentIndex(prev => Math.max(prev - 1, -1))
  }, [])

  const goForward = useCallback(() => {
    setCurrentIndex(prev => Math.min(prev + 1, stack.length - 1))
  }, [stack.length])

  const current = currentIndex >= 0 ? stack[currentIndex] : null

  return { stack, current, currentIndex, push, goBack, goForward }
}
