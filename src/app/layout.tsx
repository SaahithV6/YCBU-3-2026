import type { Metadata } from 'next'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import ConvexClientProvider from '@/components/ConvexProvider'

export const metadata: Metadata = {
  title: 'Combo Papers',
  description: 'Web agent-powered research intelligence platform',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const content = (
    <html lang="en">
      <body>
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  )

  if (!clerkKey) return content

  return (
    <ClerkProvider>
      {content}
    </ClerkProvider>
  )
}
