import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/schemas';
import mongoose from 'mongoose';

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get user by ID (Admin only)
 *     description: Retrieves detailed information about a specific user including followers and following
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to retrieve
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid user ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
export async function GET(
	request: Request,
	{ params }: { params: { userId: string } }
) {
	const authCheck = await adminAuth('canManageUsers');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		// Validate user ID format
		if (!mongoose.Types.ObjectId.isValid(params.userId)) {
			return NextResponse.json(
				{ error: 'Invalid user ID format' },
				{ status: 400 }
			);
		}

		const user = await User.findById(params.userId)
			.select('-__v -pushSubscription -twoFactorAuth')
			.lean();

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		console.log(`[Admin] Retrieved user profile for ID: ${params.userId}`);
		return NextResponse.json(user);
	} catch (error) {
		console.error('Failed to fetch user:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch user' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Update user by ID (Admin only)
 *     description: Updates user information with provided data
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid request data or user ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
export async function PATCH(
	request: Request,
	{ params }: { params: { userId: string } }
) {
	const authCheck = await adminAuth('canManageUsers');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		// Validate user ID format
		if (!mongoose.Types.ObjectId.isValid(params.userId)) {
			return NextResponse.json(
				{ error: 'Invalid user ID format' },
				{ status: 400 }
			);
		}

		const body = await request.json();

		// Remove sensitive fields that shouldn't be updated via admin
		const { pushSubscription, twoFactorAuth, clerkId, ...updateData } = body;

		// Add updated timestamp
		updateData.updatedAt = new Date();

		const user = await User.findByIdAndUpdate(
			params.userId,
			{ $set: updateData },
			{
				new: true,
				runValidators: true,
				select: '-__v -pushSubscription -twoFactorAuth',
			}
		);

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		console.log(`[Admin] Updated user profile for ID: ${params.userId}`);
		return NextResponse.json(user);
	} catch (error) {
		console.error('Failed to update user:', error);
		if (error instanceof mongoose.Error.ValidationError) {
			return NextResponse.json(
				{ error: 'Validation error', details: error.message },
				{ status: 400 }
			);
		}
		return NextResponse.json(
			{ error: 'Failed to update user' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete user by ID (Admin only)
 *     description: Permanently deletes a user account and associated data
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid user ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(
	request: Request,
	{ params }: { params: { userId: string } }
) {
	const authCheck = await adminAuth('canManageUsers');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		// Validate user ID format
		if (!mongoose.Types.ObjectId.isValid(params.userId)) {
			return NextResponse.json(
				{ error: 'Invalid user ID format' },
				{ status: 400 }
			);
		}

		const user = await User.findByIdAndDelete(params.userId);

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		console.log(`[Admin] Deleted user account for ID: ${params.userId}`);
		return NextResponse.json({
			success: true,
			message: 'User account deleted successfully',
		});
	} catch (error) {
		console.error('Failed to delete user:', error);
		return NextResponse.json(
			{ error: 'Failed to delete user' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
