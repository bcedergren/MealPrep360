import { NextResponse } from 'next/server'
import type { NextRequest, NextFetchEvent } from 'next/server'

// Fallback when Clerk keys are not set or invalid (prevents 500s locally)
const publishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  process.env.CLERK_PUBLISHABLE_KEY

const isValidClerkKey = (key?: string | null) => {
  if (!key) return false
  if (key.includes('your_clerk_publishable_key_here')) return false
  // Clerk publishable keys typically start with pk_test_ or pk_live_
  return /^pk_(test|live)_/.test(key)
}

export default async function middleware(req: NextRequest, ev: NextFetchEvent) {
  // If no valid Clerk key, bypass auth middleware entirely
  if (!isValidClerkKey(publishableKey)) {
    return NextResponse.next()
  }

  // Dynamically import Clerk only when we have a valid key to avoid early validation errors
  const { clerkMiddleware } = await import('@clerk/nextjs/server')

  const handler = clerkMiddleware(async (auth, request) => {
    const { pathname } = request.nextUrl

    // Protect dashboard routes and API routes that require authentication
    if (
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/my-recipes') ||
      pathname.startsWith('/my-mealplans') ||
      pathname.startsWith('/preferences') ||
      pathname.startsWith('/settings') ||
      pathname.startsWith('/api/recipes/recommended') ||
      pathname.startsWith('/api/shopping-lists') ||
      pathname.startsWith('/api/user/sync')
    ) {
      await auth.protect()
    }

    return NextResponse.next()
  })

  return handler(req, ev)
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
