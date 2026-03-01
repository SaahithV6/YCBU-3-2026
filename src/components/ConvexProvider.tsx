'use client'

import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { ReactNode, useState, useEffect } from 'react'

const PLACEHOLDER_URL = 'https://placeholder.convex.cloud'

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [convex, setConvex] = useState<ConvexReactClient | null>(null)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!url || url === PLACEHOLDER_URL) return
    setConvex(new ConvexReactClient(url))
  }, [])

  if (!convex) return <>{children}</>
  return <ConvexProvider client={convex}>{children}</ConvexProvider>
}
