import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/schemas';
import { authenticateMultiClerk } from '@/lib/auth/multiClerkAuth';

/**
 * @swagger
 * /api/test-auth:
 *   get:
 *     tags:
 *       - Testing
 *     summary: Test authentication and database connection
 *     description: Debug endpoint to test authentication flow and database user lookup with multi-Clerk support
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Authentication successful with detailed debug info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 auth:
 *                   type: object
 *                   properties:
 *                     clerkUserId:
 *                       type: string
 *                     sessionId:
 *                       type: string
 *                     instanceDomain:
 *                       type: string
 *                 database:
 *                   type: object
 *                   properties:
 *                     userFound:
 *                       type: boolean
 *                     user:
 *                       type: object
 *                 headers:
 *                   type: object
 *                   properties:
 *                     authorization:
 *                       type: string
 *                     origin:
 *                       type: string
 *       401:
 *         description: Authentication failed with debug info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 debug:
 *                   type: object
 */
export async function GET(req: Request) {
	try {
		// Capture request headers for debugging
		const headers = {
			authorization: req.headers.get('authorization'),
			origin: req.headers.get('origin'),
			'user-agent': req.headers.get('user-agent'),
			'content-type': req.headers.get('content-type'),
		};

		console.log('🔍 Test Auth Debug - Headers:', headers);

		// Try multi-Clerk authentication first
		const multiClerkResult = await authenticateMultiClerk(req as any);

		if (multiClerkResult.success) {
			console.log('✅ Multi-Clerk authentication successful:', {
				userId: multiClerkResult.userId,
				instanceDomain: multiClerkResult.instanceDomain,
			});

			// Try to connect to database and find user
			let dbUser = null;
			let dbError = null;

			try {
				await connectDB();
				dbUser = await User.findOne({
					clerkId: multiClerkResult.userId,
				}).select({
					_id: 1,
					clerkId: 1,
					email: 1,
					name: 1,
					createdAt: 1,
				});

				if (!dbUser) {
					console.log(
						'User not found in database, this is normal for first-time users'
					);
				}
			} catch (error) {
				dbError =
					error instanceof Error ? error.message : 'Unknown database error';
				console.error('Database error:', error);
			}

			return NextResponse.json({
				success: true,
				authMethod: 'multi-clerk',
				auth: {
					clerkUserId: multiClerkResult.userId,
					sessionId: multiClerkResult.sessionId,
					instanceDomain: multiClerkResult.instanceDomain,
				},
				database: {
					userFound: !!dbUser,
					user: dbUser,
					error: dbError,
				},
				headers,
				timestamp: new Date().toISOString(),
			});
		}

		// Fallback to standard Clerk auth (for local development)
		console.log('🔄 Multi-Clerk failed, trying standard Clerk auth...');

		const authResult = await auth();
		console.log('🔑 Standard Clerk Auth Result:', {
			userId: authResult.userId,
			sessionId: authResult.sessionId,
		});

		if (!authResult.userId) {
			return NextResponse.json(
				{
					error: 'Authentication failed',
					debug: {
						message: 'No userId returned from any Clerk authentication method',
						headers,
						multiClerkError: multiClerkResult.error,
						possibleCauses: [
							'Invalid or expired JWT token',
							'Token is not from a configured Clerk instance',
							'Token format issue (ensure Bearer prefix is included)',
							'Clerk middleware not properly configured',
						],
						suggestions: [
							'Ensure you are sending the Authorization header with "Bearer <token>" format',
							'Get a fresh token from your logged-in session',
							'Check that the token is from a supported Clerk instance',
							'Verify the API is configured for your Clerk instance',
						],
					},
				},
				{ status: 401 }
			);
		}

		// Standard Clerk auth succeeded
		let dbUser = null;
		let dbError = null;

		try {
			await connectDB();
			dbUser = await User.findOne({ clerkId: authResult.userId }).select({
				_id: 1,
				clerkId: 1,
				email: 1,
				name: 1,
				createdAt: 1,
			});
		} catch (error) {
			dbError =
				error instanceof Error ? error.message : 'Unknown database error';
			console.error('Database error:', error);
		}

		return NextResponse.json({
			success: true,
			authMethod: 'standard-clerk',
			auth: {
				clerkUserId: authResult.userId,
				sessionId: authResult.sessionId,
				instanceDomain: 'local-development',
			},
			database: {
				userFound: !!dbUser,
				user: dbUser,
				error: dbError,
			},
			headers,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error('Test auth error:', error);
		return NextResponse.json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/test-auth:
 *   post:
 *     tags:
 *       - Testing
 *     summary: Test authentication with request body
 *     description: Test endpoint that echoes back auth info and request body
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               test:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success response with auth info and echo
 *       401:
 *         description: Authentication failed
 */
export async function POST(req: Request) {
	try {
		// Try multi-Clerk authentication first
		const multiClerkResult = await authenticateMultiClerk(req as any);

		if (multiClerkResult.success) {
			const body = await req.json().catch(() => ({}));

			return NextResponse.json({
				success: true,
				authMethod: 'multi-clerk',
				userId: multiClerkResult.userId,
				instanceDomain: multiClerkResult.instanceDomain,
				echo: body,
				timestamp: new Date().toISOString(),
			});
		}

		// Fallback to standard Clerk auth
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json(
				{
					error: 'Unauthorized',
					multiClerkError: multiClerkResult.error,
					headers: {
						authorization: req.headers.get('authorization'),
					},
				},
				{ status: 401 }
			);
		}

		const body = await req.json().catch(() => ({}));

		return NextResponse.json({
			success: true,
			authMethod: 'standard-clerk',
			userId,
			echo: body,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error('Test auth POST error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
