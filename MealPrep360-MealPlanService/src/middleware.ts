import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This should be stored in environment variables
const API_TOKEN = process.env.API_TOKEN;

export function middleware(request: NextRequest) {
	// Allow public access to health endpoint
	if (request.nextUrl.pathname.startsWith('/api/health')) {
		return NextResponse.next();
	}

	// Add other middleware logic here for protected routes
	return NextResponse.next();
}

export const config = {
	matcher: [
		// Skip all internal paths (_next)
		'/((?!_next|api/health).*)',
	],
};
