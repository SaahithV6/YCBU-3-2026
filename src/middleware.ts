import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/api/search(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

const isProtectedRoute = createRouteMatcher([
  '/thread/(.*)',
  '/api/process(.*)',
  '/api/prerequisite(.*)',
  '/api/notebook(.*)',
])

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

export const middleware = clerkKey
  ? clerkMiddleware((auth, req) => {
      if (isProtectedRoute(req)) {
        auth().protect()
      }
    })
  : (_req: import('next/server').NextRequest) => NextResponse.next()

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
