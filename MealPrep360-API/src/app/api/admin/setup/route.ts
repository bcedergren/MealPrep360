import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { AdminUser } from '@/lib/mongodb/schemas';
import connectDB from '@/lib/mongodb/connection';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/admin/setup:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get admin setup status
 *     description: Checks if the current user has admin privileges set up
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Admin setup status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 adminUser:
 *                   $ref: '#/components/schemas/AdminUser'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
export async function GET() {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		// Check if admin user already exists
		const existingAdmin = await AdminUser.findOne({ clerkId: userId });
		if (existingAdmin) {
			return NextResponse.json({
				message: 'Admin user already exists',
				adminUser: existingAdmin,
				isSetup: true,
			});
		}

		return NextResponse.json({
			message: 'Admin user not found',
			isSetup: false,
		});
	} catch (error) {
		console.error('Error checking admin setup:', error);
		return NextResponse.json(
			{ error: 'Failed to check admin setup' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/admin/setup:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Set up admin user
 *     description: Creates an admin user account for the current authenticated user
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissions:
 *                 type: object
 *                 properties:
 *                   canManageUsers:
 *                     type: boolean
 *                   canModerateContent:
 *                     type: boolean
 *                   canViewAnalytics:
 *                     type: boolean
 *                   canManageSystem:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Admin user created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 adminUser:
 *                   $ref: '#/components/schemas/AdminUser'
 *       400:
 *         description: Admin user already exists
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get user info from Clerk
		const user = await currentUser();
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		await connectDB();

		// Check if admin user already exists
		const existingAdmin = await AdminUser.findOne({ clerkId: userId });
		if (existingAdmin) {
			return NextResponse.json({
				message: 'Admin user already exists',
				adminUser: existingAdmin,
			});
		}

		// Parse request body for custom permissions
		let customPermissions = {};
		try {
			const body = await request.json();
			if (body.permissions) {
				customPermissions = body.permissions;
			}
		} catch {
			// No body provided, use default permissions
		}

		// Create new admin user with default or custom permissions
		const adminUser = await AdminUser.create({
			clerkId: userId,
			email: user.emailAddresses?.[0]?.emailAddress || '',
			displayName: user.firstName
				? `${user.firstName} ${user.lastName || ''}`.trim()
				: 'Admin User',
			role: 'admin',
			permissions: {
				canManageUsers: true,
				canModerateContent: true,
				canViewAnalytics: true,
				canManageSystem: true,
				...customPermissions,
			},
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		console.log(`[Admin] Created admin user for ${adminUser.email}`);
		return NextResponse.json({
			message: 'Admin user created successfully',
			adminUser,
		});
	} catch (error) {
		console.error('Error setting up admin user:', error);
		if (error instanceof Error && error.message.includes('duplicate key')) {
			return NextResponse.json(
				{ error: 'Admin user already exists' },
				{ status: 400 }
			);
		}
		return NextResponse.json(
			{ error: 'Failed to set up admin user' },
			{ status: 500 }
		);
	}
}
