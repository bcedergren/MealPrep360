import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * @swagger
 * /api/auth/token:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get authentication token information
 *     description: Returns information about the current authentication token for use in API testing
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Token information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasAuth:
 *                   type: boolean
 *                   description: Whether the user is authenticated
 *                 userId:
 *                   type: string
 *                   description: User's Clerk ID
 *                 tokenPreview:
 *                   type: string
 *                   description: First 20 characters of the token for verification
 *                 instructions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Instructions on how to get the full token
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 instructions:
 *                   type: array
 *                   items:
 *                     type: string
 */
export async function GET(req: Request) {
	try {
		// Debug information
		const authHeader = req.headers.get('authorization');
		const userAgent = req.headers.get('user-agent');

		console.log('🔍 Auth Token Endpoint Debug:', {
			hasAuthHeader: !!authHeader,
			authHeaderPreview: authHeader
				? `${authHeader.substring(0, 30)}...`
				: 'none',
			userAgent: userAgent?.substring(0, 50) || 'none',
			timestamp: new Date().toISOString(),
		});

		const { userId, getToken } = await auth();

		if (!userId) {
			return NextResponse.json(
				{
					error: 'Not authenticated',
					debug: {
						hasAuthHeader: !!authHeader,
						authHeaderType: authHeader ? authHeader.split(' ')[0] : 'none',
						clerkAuthResult: 'userId is null - token may be invalid or expired',
					},
					instructions: [
						'❌ Authentication failed. Common causes:',
						'',
						'1. Invalid or expired JWT token',
						'2. Token is not a valid Clerk session token',
						'3. Token format issue (ensure no "Bearer " prefix in Swagger UI)',
						'',
						'🔧 To fix this:',
						'1. Log into your main MealPrep360 application',
						'2. Open Browser Dev Tools (F12) → Network tab',
						'3. Refresh page or make any action',
						'4. Find an API request with Authorization header',
						'5. Copy ONLY the JWT token part (after "Bearer ")',
						'6. In Swagger UI: click 🔒 Authorize → paste token → Authorize',
						'',
						'💡 Test with /api/user endpoint first to verify token works',
					],
				},
				{ status: 401 }
			);
		}

		try {
			const token = await getToken();

			return NextResponse.json({
				hasAuth: true,
				userId,
				tokenPreview: token
					? `${token.substring(0, 20)}...`
					: 'No token available',
				instructions: [
					'✅ You are authenticated!',
					'Your token is automatically available for API testing.',
					'If API calls are failing, try these steps:',
					'1. Click "Set Auth Token" button in the documentation header',
					'2. Get your token from browser Developer Tools → Network tab',
					'3. Copy the Authorization header value (JWT token only)',
					'4. Paste it into the token field and save',
				],
			});
		} catch (error) {
			return NextResponse.json({
				hasAuth: true,
				userId,
				tokenPreview: 'Token unavailable',
				error: 'Could not retrieve token',
				instructions: [
					'⚠️ Authentication detected but token retrieval failed',
					'1. Try refreshing the page',
					"2. Check your browser's Developer Tools → Application → Local Storage",
					'3. Look for clerk-related entries',
					'4. Use the "Set Auth Token" button to manually set your token',
				],
			});
		}
	} catch (error) {
		console.error('Error in token endpoint:', error);
		return NextResponse.json(
			{
				error: 'Internal server error',
				instructions: [
					'❌ Unable to check authentication status',
					'1. Ensure you are logged in to the main application',
					'2. Try refreshing this page',
					'3. Check browser console for errors',
					'4. Contact support if the issue persists',
				],
			},
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
