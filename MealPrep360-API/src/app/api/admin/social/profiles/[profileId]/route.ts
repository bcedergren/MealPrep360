import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import connectDB from '@/lib/mongodb/connection';
import { SocialProfile, SocialPost, Follow } from '@/models';
import mongoose from 'mongoose';

/**
 * @swagger
 * /api/admin/social/profiles/{profileId}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get social profile details (Admin only)
 *     description: Retrieves detailed information about a specific social profile
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: Profile ID to retrieve
 *       - in: query
 *         name: includeActivity
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include recent activity and posts
 *       - in: query
 *         name: includeFollowers
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include followers list
 *       - in: query
 *         name: includeFollowing
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include following list
 *     responses:
 *       200:
 *         description: Profile details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   type: object
 *                 activity:
 *                   type: object
 *                 followers:
 *                   type: array
 *                 following:
 *                   type: array
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Internal server error
 */
export async function GET(
	request: Request,
	{ params }: { params: { profileId: string } }
) {
	const authCheck = await adminAuth('canViewAnalytics');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		if (!mongoose.Types.ObjectId.isValid(params.profileId)) {
			return NextResponse.json(
				{ error: 'Invalid profile ID' },
				{ status: 400 }
			);
		}

		const { searchParams } = new URL(request.url);
		const includeActivity = searchParams.get('includeActivity') === 'true';
		const includeFollowers = searchParams.get('includeFollowers') === 'true';
		const includeFollowing = searchParams.get('includeFollowing') === 'true';

		// Get profile details
		const profile = await SocialProfile.findById(params.profileId).lean();

		if (!profile) {
			return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
		}

		const result: any = { profile };

		// Include activity if requested
		if (includeActivity) {
			const [recentPosts, totalLikes, totalComments] = await Promise.all([
				SocialPost.find({ authorId: params.profileId })
					.sort({ createdAt: -1 })
					.limit(10)
					.populate('recipeId', 'title imageUrl')
					.lean(),
				SocialPost.aggregate([
					{
						$match: { authorId: new mongoose.Types.ObjectId(params.profileId) },
					},
					{ $group: { _id: null, totalLikes: { $sum: '$likesCount' } } },
				]),
				SocialPost.aggregate([
					{
						$match: { authorId: new mongoose.Types.ObjectId(params.profileId) },
					},
					{ $group: { _id: null, totalComments: { $sum: '$commentsCount' } } },
				]),
			]);

			result.activity = {
				recentPosts,
				totalLikes: totalLikes[0]?.totalLikes || 0,
				totalComments: totalComments[0]?.totalComments || 0,
			};
		}

		// Include followers if requested
		if (includeFollowers && (profile as any).followers) {
			result.followers = await SocialProfile.find({
				_id: { $in: (profile as any).followers },
			})
				.select('userId displayName avatar')
				.lean();
		}

		// Include following if requested
		if (includeFollowing && (profile as any).following) {
			result.following = await SocialProfile.find({
				_id: { $in: (profile as any).following },
			})
				.select('userId displayName avatar')
				.lean();
		}

		console.log(`[Admin] Retrieved profile details: ${params.profileId}`);
		return NextResponse.json(result);
	} catch (error) {
		console.error('Error fetching profile details:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch profile details' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/admin/social/profiles/{profileId}:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Update social profile (Admin only)
 *     description: Updates a social profile for moderation or management
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: Profile ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 description: Updated display name
 *               bio:
 *                 type: string
 *                 description: Updated bio
 *               avatar:
 *                 type: string
 *                 description: Updated avatar URL
 *               isPrivate:
 *                 type: boolean
 *                 description: Profile privacy setting
 *               moderationAction:
 *                 type: string
 *                 enum: [suspend, unsuspend, verify, unverify]
 *                 description: Moderation action to take
 *               moderationReason:
 *                 type: string
 *                 description: Reason for moderation action
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Internal server error
 */
export async function PATCH(
	request: Request,
	{ params }: { params: { profileId: string } }
) {
	const authCheck = await adminAuth('canManageUsers');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		if (!mongoose.Types.ObjectId.isValid(params.profileId)) {
			return NextResponse.json(
				{ error: 'Invalid profile ID' },
				{ status: 400 }
			);
		}

		const body = await request.json();
		const {
			displayName,
			bio,
			avatar,
			isPrivate,
			moderationAction,
			moderationReason,
		} = body;

		const profile = await SocialProfile.findById(params.profileId);
		if (!profile) {
			return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
		}

		// Build update object
		const updateData: any = {
			updatedAt: new Date(),
		};

		if (displayName !== undefined) {
			updateData.displayName = displayName;
		}

		if (bio !== undefined) {
			updateData.bio = bio;
		}

		if (avatar !== undefined) {
			updateData.avatar = avatar;
		}

		if (isPrivate !== undefined) {
			updateData.isPrivate = isPrivate;
		}

		// Handle moderation actions
		if (moderationAction) {
			switch (moderationAction) {
				case 'suspend':
					updateData.isSuspended = true;
					updateData.suspendedAt = new Date();
					break;
				case 'unsuspend':
					updateData.isSuspended = false;
					updateData.suspendedAt = null;
					break;
				case 'verify':
					updateData.isVerified = true;
					updateData.verifiedAt = new Date();
					break;
				case 'unverify':
					updateData.isVerified = false;
					updateData.verifiedAt = null;
					break;
			}

			if (moderationReason) {
				updateData.moderationReason = moderationReason;
				updateData.moderatedAt = new Date();
			}
		}

		const updatedProfile = await SocialProfile.findByIdAndUpdate(
			params.profileId,
			updateData,
			{ new: true }
		).lean();

		console.log(
			`[Admin] Updated social profile: ${params.profileId} (${
				moderationAction || 'profile update'
			})`
		);
		return NextResponse.json({
			profile: updatedProfile,
			message: 'Profile updated successfully',
		});
	} catch (error) {
		console.error('Error updating profile:', error);
		return NextResponse.json(
			{ error: 'Failed to update profile' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/admin/social/profiles/{profileId}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete social profile (Admin only)
 *     description: Permanently deletes a social profile and all associated data
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: Profile ID to delete
 *       - in: query
 *         name: reason
 *         schema:
 *           type: string
 *         description: Reason for deletion
 *     responses:
 *       200:
 *         description: Profile deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 deletedData:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(
	request: Request,
	{ params }: { params: { profileId: string } }
) {
	const authCheck = await adminAuth('canManageUsers');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		if (!mongoose.Types.ObjectId.isValid(params.profileId)) {
			return NextResponse.json(
				{ error: 'Invalid profile ID' },
				{ status: 400 }
			);
		}

		const { searchParams } = new URL(request.url);
		const reason = searchParams.get('reason');

		const profile = await SocialProfile.findById(params.profileId);
		if (!profile) {
			return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
		}

		// Delete all associated data
		const [deletedPosts, deletedComments, deletedFollows] = await Promise.all([
			SocialPost.deleteMany({ authorId: params.profileId }),
			// Delete comments by this profile
			SocialPost.updateMany(
				{},
				{ $pull: { comments: { authorId: params.profileId } } }
			),
			// Delete follow relationships
			Follow.deleteMany({
				$or: [
					{ followerId: params.profileId },
					{ followingId: params.profileId },
				],
			}),
		]);

		// Remove profile from other profiles' followers/following arrays
		await SocialProfile.updateMany(
			{ followers: params.profileId },
			{ $pull: { followers: params.profileId }, $inc: { followersCount: -1 } }
		);

		await SocialProfile.updateMany(
			{ following: params.profileId },
			{ $pull: { following: params.profileId }, $inc: { followingCount: -1 } }
		);

		// Delete the profile
		await SocialProfile.findByIdAndDelete(params.profileId);

		console.log(
			`[Admin] Deleted social profile: ${params.profileId} (${
				reason || 'no reason provided'
			})`
		);
		console.log(
			`[Admin] Cleanup: ${deletedPosts.deletedCount} posts, ${deletedComments.modifiedCount} comment updates, ${deletedFollows.deletedCount} follow relationships`
		);

		return NextResponse.json({
			success: true,
			message: 'Profile and all associated data deleted successfully',
			deletedData: {
				posts: deletedPosts.deletedCount,
				commentUpdates: deletedComments.modifiedCount,
				followRelationships: deletedFollows.deletedCount,
			},
		});
	} catch (error) {
		console.error('Error deleting profile:', error);
		return NextResponse.json(
			{ error: 'Failed to delete profile' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
