import { NextResponse } from 'next/server'
import type { NextRequest, NextFetchEvent } from 'next/server'

const publicPaths = [
  '/',
  '/signup',
  '/api/admin/setup',
  '/api/webhooks/clerk',
  '/api/webhooks/stripe',
  '/api/admin/recipes/generate',
  '/sign-in',
  '/sign-up',
]

const isPublic = (path: string) => {
  return (
    publicPaths.some((x) => path.startsWith(x)) ||
    path.match(/\.(ico|png|jpg|jpeg|svg|gif|css|js)$/) !== null
  )
}

// Fallback when Clerk keys are not set or invalid (prevents 500s locally)
const publishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  process.env.CLERK_PUBLISHABLE_KEY

const isValidClerkKey = (key?: string | null) => {
  if (!key) return false
  if (key.includes('your_clerk_publishable_key_here')) return false
  return /^pk_(test|live)_/.test(key)
}

export default async function middleware(
  request: NextRequest,
  ev: NextFetchEvent
) {
  const path = request.nextUrl.pathname

  // Always allow public/static paths
  if (isPublic(path)) {
    return NextResponse.next()
  }

  // If no valid Clerk key, bypass auth middleware entirely
  if (!isValidClerkKey(publishableKey)) {
    return NextResponse.next()
  }

  // Dynamically import Clerk only when we have a valid key to avoid early validation errors
  const clerkModule: any = await import('@clerk/nextjs/server')
  const { clerkMiddleware } = clerkModule

  const handler = clerkMiddleware(async (auth: any, req: NextRequest) => {
    const { pathname } = req.nextUrl

    // Public paths already handled above, but keep a guard here
    if (isPublic(pathname)) {
      return NextResponse.next()
    }

    const { userId } = auth()

    // If user is signed in and tries to access public routes, redirect to dashboard
    if (
      userId &&
      (pathname === '/' ||
        pathname === '/signup' ||
        pathname === '/sign-in' ||
        pathname === '/sign-up')
    ) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // If user is not signed in and tries to access protected routes, redirect to root
    if (!userId) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
  })

  return handler(request, ev)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
}
