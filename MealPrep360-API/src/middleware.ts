import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
	authenticateMultiClerk,
	extractBearerToken,
	extractSessionToken,
} from '@/lib/auth/multiClerkAuth';

// List of allowed origins for CORS
const allowedOrigins = [
	'http://localhost:3000',
	'http://localhost:3001',
	'https://mealprep360.com',
	'https://www.mealprep360.com',
	'https://app.mealprep360.com',
	// Add your frontend URLs here
];

export default clerkMiddleware(async (auth, req) => {
	try {
		const origin = req.headers.get('origin');
		const isAllowedOrigin =
			origin &&
			(allowedOrigins.includes(origin) ||
				origin.includes('mealprep360.com') ||
				origin.includes('localhost'));

		// Variables used across middleware scope
		let userId: string | null = null;
		let authMethod = 'none';

		// Log all requests for debugging
		console.log('🔧 Middleware Debug:', {
			path: req.nextUrl.pathname,
			method: req.method,
			origin,
			isAllowedOrigin,
		});

		// Handle CORS preflight requests
		if (req.method === 'OPTIONS') {
			const response = new NextResponse(null, { status: 200 });

			if (isAllowedOrigin) {
				response.headers.set('Access-Control-Allow-Origin', origin);
				response.headers.set('Access-Control-Allow-Credentials', 'true');
				response.headers.set(
					'Access-Control-Allow-Methods',
					'GET, POST, PUT, DELETE, OPTIONS, PATCH'
				);
				response.headers.set(
					'Access-Control-Allow-Headers',
					'Content-Type, Authorization, X-Requested-With'
				);
				response.headers.set('Access-Control-Max-Age', '86400');
			}

			return response;
		}

		// For non-API routes, allow through without auth
		if (!req.nextUrl.pathname.startsWith('/api/')) {
			console.log('Non-API route, allowing through');
			return NextResponse.next();
		}

		// Log middleware debug info for API routes
		if (req.nextUrl.pathname.startsWith('/api/')) {
			// Public endpoints that don't require authentication
			const publicEndpoints = [
				'/api/health',
				'/api/ping',
				'/api/docs',
				'/api/webhooks',
			];

			const isPublicEndpoint = publicEndpoints.some((endpoint) =>
				req.nextUrl.pathname.startsWith(endpoint)
			);

			// For protected endpoints, try authentication
			if (!isPublicEndpoint) {
				// First try multi-Clerk authentication (supports both Bearer tokens and session cookies)
				const bearerToken = extractBearerToken(req);
				const sessionToken = extractSessionToken(req);

				if (bearerToken || sessionToken) {
					try {
						const multiClerkResult = await authenticateMultiClerk(req);
						if (multiClerkResult.success) {
							userId = multiClerkResult.userId || null;
							authMethod = 'multi-clerk';
							console.log('✅ Multi-Clerk authentication successful:', {
								userId,
								instanceDomain: multiClerkResult.instanceDomain,
								tokenSource: bearerToken ? 'Bearer header' : 'session cookie',
							});
						}
					} catch (error) {
						console.log('Multi-Clerk auth failed, trying standard Clerk...');
					}
				}

				// If multi-Clerk failed, try standard Clerk authentication
				if (!userId) {
					try {
						const authResult = await auth();
						if (authResult.userId) {
							userId = authResult.userId;
							authMethod = 'standard-clerk';
							console.log('✅ Standard Clerk authentication successful:', {
								userId,
							});
						}
					} catch (error) {
						console.log('Standard Clerk auth also failed');
					}
				}
			}

			console.log('🔧 API Middleware Debug:', {
				path: req.nextUrl.pathname,
				userId,
				authMethod,
				hasAuthHeader: !!req.headers.get('authorization'),
				hasSessionCookie: !!extractSessionToken(req),
				tokenPreview:
					req.headers.get('authorization')?.substring(0, 30) + '...',
				origin,
				isPublicEndpoint,
			});

			// For authenticated endpoints, check if user is logged in
			if (!isPublicEndpoint && !userId) {
				console.log('❌ Middleware: No userId for protected endpoint');
				// Note: We're not blocking the request here to let individual routes handle auth
				// This allows for more granular error handling and debugging
			}
		}

		// Build request headers for downstream handlers
		const requestHeaders = new Headers(req.headers);
		if (userId) {
			requestHeaders.set('x-user-id', userId);
			requestHeaders.set('x-auth-method', authMethod);
		}

		// Continue with the request and add CORS headers to response
		const response = NextResponse.next({
			request: { headers: requestHeaders },
		});

		if (isAllowedOrigin) {
			response.headers.set('Access-Control-Allow-Origin', origin);
			response.headers.set('Access-Control-Allow-Credentials', 'true');
			response.headers.set(
				'Access-Control-Allow-Methods',
				'GET, POST, PUT, DELETE, OPTIONS, PATCH'
			);
			response.headers.set(
				'Access-Control-Allow-Headers',
				'Content-Type, Authorization, X-Requested-With'
			);
		}

		return response;
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
