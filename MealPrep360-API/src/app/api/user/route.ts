import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/schemas';
import { ensureUser } from '@/lib/auth/ensureUser';

/**
 * @swagger
 * /api/user:
 *   get:
 *     tags:
 *       - User
 *     summary: Get current user information
 *     description: Retrieves basic information about the authenticated user
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: User's unique identifier
 *                 name:
 *                   type: string
 *                   description: User's full name
 *                 email:
 *                   type: string
 *                   format: email
 *                   description: User's email address
 *                 image:
 *                   type: string
 *                   description: User's profile image URL
 *       401:
 *         description: Unauthorized - No valid authentication token
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Unauthorized"
 *       404:
 *         description: User not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Internal Server Error"
 */
export async function GET(req: Request) {
	try {
		const authHeader = req.headers.get('authorization');
		console.log('🔍 User Endpoint Debug:', {
			hasAuthHeader: !!authHeader,
			authHeaderPreview: authHeader
				? `${authHeader.substring(0, 30)}...`
				: 'none',
		});

		const { userId: clerkId } = await auth();

		if (!clerkId) {
			console.log('❌ User endpoint: Authentication failed - userId is null');
			return NextResponse.json(
				{
					error: 'Unauthorized',
					debug: {
						hasAuthHeader: !!authHeader,
						authHeaderType: authHeader ? authHeader.split(' ')[0] : 'none',
						clerkAuthResult: 'userId is null',
					},
					message:
						'JWT token is invalid, expired, or not a valid Clerk session token',
				},
				{ status: 401 }
			);
		}

		// Use ensureUser to get or create the user in the database
		const user = await ensureUser();

		if (!user) {
			console.error('Failed to get or create user in database');
			return new NextResponse('User not found', { status: 404 });
		}

		// Convert MongoDB _id to id for consistency
		const userResponse = {
			id: user._id,
			name: user.name,
			email: user.email,
			image: user.image,
		};

		return NextResponse.json(userResponse);
	} catch (error) {
		console.error('Error fetching user:', error);
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}

export const dynamic = 'force-dynamic';
