import type { Metadata } from 'next'
import './globals.css'
import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

const ConvexClientProvider = dynamic(() => import('@/components/ConvexProvider'), {
  ssr: false,
})

export const metadata: Metadata = {
  title: 'Living Papers v2',
  description: 'Web agent-powered research intelligence platform',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  )
}
