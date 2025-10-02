import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/schemas';

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all users (Admin only)
 *     description: Retrieves all users in the system with admin authentication
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request) {
	const authCheck = await adminAuth('canManageUsers');
	if (authCheck) return authCheck;

	try {
		await connectDB();
		const users = await User.find()
			.select('-__v -pushSubscription -twoFactorAuth')
			.sort({ createdAt: -1 });

		return NextResponse.json({ users });
	} catch (error) {
		console.error('Failed to fetch users:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch users' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create new user (Admin only)
 *     description: Creates a new user with admin authentication
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clerkId
 *               - email
 *               - name
 *             properties:
 *               clerkId:
 *                 type: string
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 default: USER
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
	const authCheck = await adminAuth('canManageUsers');
	if (authCheck) return authCheck;

	try {
		await connectDB();
		const body = await request.json();

		// Validate required fields
		if (!body.clerkId || !body.email || !body.name) {
			return NextResponse.json(
				{ error: 'Missing required fields: clerkId, email, name' },
				{ status: 400 }
			);
		}

		const user = await User.create({
			clerkId: body.clerkId,
			email: body.email,
			name: body.name,
			role: body.role || 'USER',
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		return NextResponse.json(user, { status: 201 });
	} catch (error) {
		console.error('Failed to create user:', error);
		if (
			error instanceof Error &&
			'code' in error &&
			(error as any).code === 11000
		) {
			return NextResponse.json(
				{ error: 'User with this email or clerkId already exists' },
				{ status: 400 }
			);
		}
		return NextResponse.json(
			{ error: 'Failed to create user' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
