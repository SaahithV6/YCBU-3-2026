import type { Metadata } from 'next'
import './globals.css'
import ConvexClientProvider from '@/components/ConvexProvider'

export const metadata: Metadata = {
  title: 'Living Papers v2',
  description: 'Web agent-powered research intelligence platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
