import { NextRequest } from 'next/server';
import { clerkClient } from '@clerk/clerk-sdk-node';

// Configuration for multiple Clerk instances
interface ClerkInstanceConfig {
	domain: string;
	secretKey: string;
	publishableKey: string;
	instanceId?: string;
}

// Define supported Clerk instances
const CLERK_INSTANCES: ClerkInstanceConfig[] = [
	// Primary instance using your existing environment variables
	{
		domain: 'eminent-earwig-25.clerk.accounts.dev',
		secretKey: process.env.CLERK_SECRET_KEY || '',
		publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
		instanceId: 'ins_2wfI8HhvIkiViE6NrrQGFwZ9hdI',
	},
	// Additional instances can be added here if needed
	{
		domain: process.env.CLERK_DOMAIN_ADDITIONAL || '',
		secretKey: process.env.CLERK_SECRET_KEY_ADDITIONAL || '',
		publishableKey: process.env.CLERK_PUBLISHABLE_KEY_ADDITIONAL || '',
	},
].filter((instance) => instance.secretKey);

console.log('🔧 Multi-Clerk Configuration:', {
	instanceCount: CLERK_INSTANCES.length,
	instances: CLERK_INSTANCES.map((i) => ({
		domain: i.domain,
		hasSecretKey: !!i.secretKey,
		secretKeyPrefix: i.secretKey
			? i.secretKey.substring(0, 20) + '...'
			: 'MISSING',
	})),
});

/**
 * Attempts to verify a JWT token against multiple Clerk instances
 */
// Helper function to decode JWT without verification (for debugging)
function decodeJWTPayload(token: string) {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;

		const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
		return payload;
	} catch (error) {
		return null;
	}
}

// Define a local type for the result of verifyMultiClerkToken
export interface MultiClerkTokenResult {
	userId: string;
	sessionId: string;
	instanceDomain: string;
	payload: any; // Use 'any' for payload since JwtPayload is not directly available
}

export async function verifyMultiClerkToken(
	token: string
): Promise<MultiClerkTokenResult> {
	const errors: string[] = [];

	console.log(
		`🔍 Token to verify (first 50 chars): ${token.substring(0, 50)}...`
	);
	console.log(`🔍 Configured instances: ${CLERK_INSTANCES.length}`);

	// Decode the token to see what instance it's from
	const decodedPayload = decodeJWTPayload(token);
	console.log(`🔍 Decoded token payload (for debugging):`, {
		iss: decodedPayload?.iss,
		aud: decodedPayload?.aud,
		sub: decodedPayload?.sub,
		exp: decodedPayload?.exp,
		iat: decodedPayload?.iat,
	});

	for (const instance of CLERK_INSTANCES) {
		try {
			console.log(
				`🔑 Attempting to verify token with Clerk instance: ${instance.domain}`
			);
			console.log(
				`🔧 Using secret key: ${instance.secretKey ? 'SET' : 'MISSING'}`
			);

			// Use the global clerkClient to verify the token
			// This will only work for the primary instance configured in environment variables
			try {
				const verifiedToken = await clerkClient.verifyToken(token);

				console.log(
					`✅ Token verified successfully with instance: ${instance.domain}`
				);
				return {
					userId: verifiedToken.sub as string,
					sessionId: verifiedToken.sid as string,
					instanceDomain: instance.domain,
					payload: verifiedToken,
				};
			} catch (verifyError) {
				console.log(
					`❌ Token verification failed for instance: ${instance.domain}`
				);
				throw verifyError;
			}
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unknown error';
			const errorStack =
				error instanceof Error ? error.stack : 'No stack trace';
			const errorName = error instanceof Error ? error.name : 'Unknown';
			const errorCode = (error as any)?.code || 'No code';

			errors.push(`${instance.domain}: ${errorMsg}`);
			console.log(
				`❌ Token verification failed for ${instance.domain}: ${errorMsg}`
			);
			console.log(`🔍 Full error details:`, {
				errorMsg,
				errorName,
				errorCode,
				errorStack: errorStack?.substring(0, 500) + '...',
			});

			// Log the full error object for debugging
			console.log(`🔍 Raw error object:`, error);
		}
	}

	// If we get here, no instance could verify the token
	console.error('🚫 Token verification failed for all Clerk instances');
	console.error('Errors:', errors);

	throw new Error(
		`Token verification failed for all configured Clerk instances: ${errors.join(
			'; '
		)}`
	);
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(req: NextRequest): string | null {
	const authHeader = req.headers.get('authorization');

	if (!authHeader) {
		return null;
	}

	const parts = authHeader.split(' ');
	if (parts.length !== 2 || parts[0] !== 'Bearer') {
		return null;
	}

	return parts[1];
}

/**
 * Extract session token from Clerk session cookies
 */
export function extractSessionToken(req: NextRequest): string | null {
	// Common Clerk session cookie names
	const sessionCookieNames = [
		'__session',
		'__clerk_session',
		'_clerk_session',
		'clerk-session'
	];

	// Try to find any Clerk session cookie
	for (const cookieName of sessionCookieNames) {
		const cookieValue = req.cookies.get(cookieName)?.value;
		if (cookieValue) {
			console.log(`Found session token in cookie: ${cookieName}`);
			return cookieValue;
		}
	}

	// Also check for direct session token in custom cookie
	const sessionToken = req.cookies.get('session_token')?.value;
	if (sessionToken) {
		console.log('Found session token in session_token cookie');
		return sessionToken;
	}

	return null;
}

export interface MultiClerkAuthResult {
	success: boolean;
	userId?: string;
	sessionId?: string;
	instanceDomain?: string;
	payload?: any;
	error?: string;
	status?: number;
}

/**
 * Multi-Clerk authentication function for API routes
 * Supports both Bearer tokens and session cookies
 */
export async function authenticateMultiClerk(
	req: NextRequest
): Promise<MultiClerkAuthResult> {
	try {
		// Try Bearer token first
		let token = extractBearerToken(req);
		let tokenSource = 'Bearer header';

		// If no Bearer token, try session cookies
		if (!token) {
			token = extractSessionToken(req);
			tokenSource = 'session cookie';
		}

		if (!token) {
			return {
				success: false,
				error: 'No authentication token provided (checked Authorization header and session cookies)',
				status: 401,
			};
		}

		console.log(`Using token from: ${tokenSource}`);
		const authResult = await verifyMultiClerkToken(token);

		return {
			success: true,
			userId: authResult.userId as string,
			sessionId: authResult.sessionId,
			instanceDomain: authResult.instanceDomain,
			payload: authResult.payload,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Authentication failed',
			status: 401,
		};
	}
}

/**
 * Middleware wrapper for multi-Clerk authentication
 */
export function withMultiClerkAuth(
	handler: (req: NextRequest & { auth: any }) => Promise<Response>
) {
	return async (req: NextRequest) => {
		const authResult = await authenticateMultiClerk(req);

		if (!authResult.success) {
			return new Response(
				JSON.stringify({
					error: authResult.error,
					debug: {
						configuredInstances: CLERK_INSTANCES.map((i) => i.domain),
						hasToken: !!extractBearerToken(req),
					},
				}),
				{
					status: authResult.status,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}

		// Add auth info to request
		(req as any).auth = authResult;

		return handler(req as NextRequest & { auth: any });
	};
}
