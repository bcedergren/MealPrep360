import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/schemas';
import mongoose from 'mongoose';

/**
 * @swagger
 * /api/admin/users/{userId}/follow:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Follow user (Admin only)
 *     description: Creates a follow relationship between two users
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to follow
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - followerId
 *             properties:
 *               followerId:
 *                 type: string
 *                 description: ID of the user who will follow
 *     responses:
 *       200:
 *         description: Follow relationship created successfully
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
 *         description: Invalid user ID format or missing followerId
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
export async function POST(
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
		const { followerId } = body;

		if (!followerId) {
			return NextResponse.json(
				{ error: 'followerId is required' },
				{ status: 400 }
			);
		}

		// Validate follower ID format
		if (!mongoose.Types.ObjectId.isValid(followerId)) {
			return NextResponse.json(
				{ error: 'Invalid follower ID format' },
				{ status: 400 }
			);
		}

		// Prevent self-following
		if (params.userId === followerId) {
			return NextResponse.json(
				{ error: 'Users cannot follow themselves' },
				{ status: 400 }
			);
		}

		const [targetUser, followerUser] = await Promise.all([
			User.findById(params.userId),
			User.findById(followerId),
		]);

		if (!targetUser || !followerUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Check if already following
		const isAlreadyFollowing = followerUser.following?.includes(
			new mongoose.Types.ObjectId(params.userId)
		);
		if (isAlreadyFollowing) {
			return NextResponse.json(
				{ error: 'User is already following this user' },
				{ status: 400 }
			);
		}

		// Add to following list
		if (!followerUser.following) {
			followerUser.following = [];
		}
		followerUser.following.push(new mongoose.Types.ObjectId(params.userId));

		// Add to followers list
		if (!targetUser.followers) {
			targetUser.followers = [];
		}
		targetUser.followers.push(new mongoose.Types.ObjectId(followerId));

		// Save both users
		await Promise.all([followerUser.save(), targetUser.save()]);

		console.log(`[Admin] User ${followerId} now follows user ${params.userId}`);
		return NextResponse.json({
			success: true,
			message: 'Follow relationship created successfully',
		});
	} catch (error) {
		console.error('Failed to create follow relationship:', error);
		return NextResponse.json(
			{ error: 'Failed to create follow relationship' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/admin/users/{userId}/follow:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Unfollow user (Admin only)
 *     description: Removes a follow relationship between two users
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to unfollow
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - followerId
 *             properties:
 *               followerId:
 *                 type: string
 *                 description: ID of the user who will unfollow
 *     responses:
 *       200:
 *         description: Follow relationship removed successfully
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
 *         description: Invalid user ID format or missing followerId
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

		const body = await request.json();
		const { followerId } = body;

		if (!followerId) {
			return NextResponse.json(
				{ error: 'followerId is required' },
				{ status: 400 }
			);
		}

		// Validate follower ID format
		if (!mongoose.Types.ObjectId.isValid(followerId)) {
			return NextResponse.json(
				{ error: 'Invalid follower ID format' },
				{ status: 400 }
			);
		}

		const [targetUser, followerUser] = await Promise.all([
			User.findById(params.userId),
			User.findById(followerId),
		]);

		if (!targetUser || !followerUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Remove from following list
		if (followerUser.following) {
			followerUser.following = followerUser.following.filter(
				(id: mongoose.Types.ObjectId) =>
					!id.equals(new mongoose.Types.ObjectId(params.userId))
			);
		}

		// Remove from followers list
		if (targetUser.followers) {
			targetUser.followers = targetUser.followers.filter(
				(id: mongoose.Types.ObjectId) =>
					!id.equals(new mongoose.Types.ObjectId(followerId))
			);
		}

		// Save both users
		await Promise.all([followerUser.save(), targetUser.save()]);

		console.log(
			`[Admin] User ${followerId} no longer follows user ${params.userId}`
		);
		return NextResponse.json({
			success: true,
			message: 'Follow relationship removed successfully',
		});
	} catch (error) {
		console.error('Failed to remove follow relationship:', error);
		return NextResponse.json(
			{ error: 'Failed to remove follow relationship' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
