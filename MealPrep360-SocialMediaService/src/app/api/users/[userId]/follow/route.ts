import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { UserProfile } from '@/models/UserProfile';
import type { NextRequest } from 'next/server';

/**
 * @swagger
 * /api/users/{userId}/follow:
 *   post:
 *     description: Follow a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Followed user
 *   delete:
 *     description: Unfollow a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unfollowed user
 */

export async function POST(
	request: Request,
	context: { params: Promise<{ userId: string }> }
) {
	try {
		const { userId: currentUserId } = await auth();
		if (!currentUserId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();
		const params = await context.params;
		const { userId: targetUserId } = params;

		// Prevent self-following
		if (currentUserId === targetUserId) {
			return NextResponse.json(
				{ error: 'Cannot follow yourself' },
				{ status: 400 }
			);
		}

		// Update current user's following list
		const currentUser = await UserProfile.findOneAndUpdate(
			{ clerkId: currentUserId },
			{ $addToSet: { following: targetUserId } },
			{ new: true }
		);

		if (!currentUser) {
			return NextResponse.json(
				{ error: 'User profile not found' },
				{ status: 404 }
			);
		}

		// Update target user's followers list
		const targetUser = await UserProfile.findOneAndUpdate(
			{ clerkId: targetUserId },
			{ $addToSet: { followers: currentUserId } },
			{ new: true }
		);

		if (!targetUser) {
			return NextResponse.json(
				{ error: 'Target user profile not found' },
				{ status: 404 }
			);
		}

		return NextResponse.json({ currentUser, targetUser });
	} catch (error) {
		console.error('Error following user:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: Request,
	context: { params: Promise<{ userId: string }> }
) {
	try {
		const { userId: currentUserId } = await auth();
		if (!currentUserId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();
		const params = await context.params;
		const { userId: targetUserId } = params;

		// Update current user's following list
		const currentUser = await UserProfile.findOneAndUpdate(
			{ clerkId: currentUserId },
			{ $pull: { following: targetUserId } },
			{ new: true }
		);

		if (!currentUser) {
			return NextResponse.json(
				{ error: 'User profile not found' },
				{ status: 404 }
			);
		}

		// Update target user's followers list
		const targetUser = await UserProfile.findOneAndUpdate(
			{ clerkId: targetUserId },
			{ $pull: { followers: currentUserId } },
			{ new: true }
		);

		if (!targetUser) {
			return NextResponse.json(
				{ error: 'Target user profile not found' },
				{ status: 404 }
			);
		}

		return NextResponse.json({ currentUser, targetUser });
	} catch (error) {
		console.error('Error unfollowing user:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
