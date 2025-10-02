import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	console.log('🔐 Test Auth API - GET request started');
	console.log('🔐 Request URL:', request.url);
	console.log(
		'🔐 Request headers:',
		Object.fromEntries(request.headers.entries())
	);

	try {
		// Test Clerk authentication
		const { userId, getToken, sessionClaims } = await auth();
		const token = await getToken();

		console.log('🔐 Auth details:', {
			hasUserId: !!userId,
			hasToken: !!token,
			hasSessionClaims: !!sessionClaims,
			userId: userId || 'null',
			tokenLength: token?.length || 0,
			tokenPreview: token ? `${token.substring(0, 30)}...` : 'no token',
			sessionClaimsKeys: sessionClaims
				? Object.keys(sessionClaims)
				: 'no claims',
		});

		// Check for Clerk session cookie
		const clerkSessionCookie = request.cookies.get('__session');
		console.log('🔐 Clerk session cookie:', {
			hasCookie: !!clerkSessionCookie,
			cookieValue: clerkSessionCookie?.value
				? `${clerkSessionCookie.value.substring(0, 50)}...`
				: 'no value',
		});

		return NextResponse.json({
			status: 'auth-test-completed',
			timestamp: new Date().toISOString(),
			auth: {
				hasUserId: !!userId,
				hasToken: !!token,
				hasSessionClaims: !!sessionClaims,
				userId: userId || 'null',
				tokenLength: token?.length || 0,
				tokenPreview: token ? `${token.substring(0, 30)}...` : 'no token',
				sessionClaimsKeys: sessionClaims
					? Object.keys(sessionClaims)
					: 'no claims',
			},
			cookies: {
				hasClerkSession: !!clerkSessionCookie,
				cookiePreview: clerkSessionCookie?.value
					? `${clerkSessionCookie.value.substring(0, 50)}...`
					: 'no value',
			},
			headers: {
				userAgent: request.headers.get('user-agent'),
				referer: request.headers.get('referer'),
				origin: request.headers.get('origin'),
			},
		});
	} catch (error) {
		console.error('🔐 Auth test error:', error);
		return NextResponse.json(
			{
				status: 'auth-test-error',
				error: error instanceof Error ? error.message : 'Unknown error',
				errorName: error instanceof Error ? error.name : 'Unknown',
				timestamp: new Date().toISOString(),
			},
			{ status: 500 }
		);
	}
}
