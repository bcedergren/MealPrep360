import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export default clerkMiddleware(async (auth, req) => {
	try {
		// Log all requests for debugging
		console.log('🔧 Middleware Debug:', {
			path: req.nextUrl.pathname,
			method: req.method,
			origin: req.headers.get('origin'),
		});

		// For non-API routes, allow through without auth
		if (!req.nextUrl.pathname.startsWith('/api/')) {
			console.log('Non-API route, allowing through');
			return NextResponse.next();
		}

		// Log middleware debug info for API routes
		if (req.nextUrl.pathname.startsWith('/api/')) {
			const authResult = await auth();
			console.log('🔧 API Middleware Debug:', {
				path: req.nextUrl.pathname,
				userId: authResult.userId,
				hasToken: !!req.headers.get('authorization'),
				tokenPreview:
					req.headers.get('authorization')?.substring(0, 30) + '...',
				origin: req.headers.get('origin'),
			});
		}

		// Add CORS headers for preflight requests
		if (req.method === 'OPTIONS') {
			return new NextResponse(null, { status: 200 });
		}

		return NextResponse.next();
	} catch (error) {
		console.error('Middleware error:', error);
		return NextResponse.next();
	}
});

export const config = {
	matcher: [
		'/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
		'/(api|trpc)(.*)',
	],
};
