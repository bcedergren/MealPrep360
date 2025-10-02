import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import connectDB from '@/lib/mongodb/connection';
import { SocialPost, SocialProfile, SocialComment } from '@/models';
import mongoose from 'mongoose';

/**
 * @swagger
 * /api/admin/social/posts/{postId}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get social post details (Admin only)
 *     description: Retrieves detailed information about a specific social post
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID to retrieve
 *       - in: query
 *         name: includeComments
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include post comments
 *     responses:
 *       200:
 *         description: Post details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 post:
 *                   type: object
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
export async function GET(
	request: Request,
	{ params }: { params: { postId: string } }
) {
	const authCheck = await adminAuth('canModerateContent');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		if (!mongoose.Types.ObjectId.isValid(params.postId)) {
			return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
		}

		const { searchParams } = new URL(request.url);
		const includeComments = searchParams.get('includeComments') === 'true';

		// Get post details
		const post = await SocialPost.findById(params.postId)
			.populate('authorId', 'userId displayName avatar')
			.populate('recipeId', 'title imageUrl')
			.populate('likes', 'userId displayName avatar')
			.lean();

		if (!post) {
			return NextResponse.json({ error: 'Post not found' }, { status: 404 });
		}

		let comments = null;
		if (includeComments) {
			comments = await SocialComment.find({ postId: params.postId })
				.populate('authorId', 'userId displayName avatar')
				.populate('likes', 'userId displayName avatar')
				.sort({ createdAt: -1 })
				.lean();
		}

		console.log(`[Admin] Retrieved post details: ${params.postId}`);
		return NextResponse.json({
			post,
			...(comments && { comments }),
		});
	} catch (error) {
		console.error('Error fetching post details:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch post details' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/admin/social/posts/{postId}:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Update social post (Admin only)
 *     description: Updates a social post for moderation or content management
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Updated post content
 *               isPublic:
 *                 type: boolean
 *                 description: Post visibility
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Updated image URLs
 *               moderationAction:
 *                 type: string
 *                 enum: [approve, hide, flag, remove]
 *                 description: Moderation action to take
 *               moderationReason:
 *                 type: string
 *                 description: Reason for moderation action
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 post:
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
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
export async function PATCH(
	request: Request,
	{ params }: { params: { postId: string } }
) {
	const authCheck = await adminAuth('canModerateContent');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		if (!mongoose.Types.ObjectId.isValid(params.postId)) {
			return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
		}

		const body = await request.json();
		const { content, isPublic, images, moderationAction, moderationReason } =
			body;

		const post = await SocialPost.findById(params.postId);
		if (!post) {
			return NextResponse.json({ error: 'Post not found' }, { status: 404 });
		}

		// Build update object
		const updateData: any = {
			updatedAt: new Date(),
		};

		if (content !== undefined) {
			updateData.content = content;
		}

		if (isPublic !== undefined) {
			updateData.isPublic = isPublic;
		}

		if (images !== undefined) {
			updateData.images = images;
		}

		// Handle moderation actions
		if (moderationAction) {
			switch (moderationAction) {
				case 'approve':
					updateData.isPublic = true;
					updateData.moderationStatus = 'approved';
					break;
				case 'hide':
					updateData.isPublic = false;
					updateData.moderationStatus = 'hidden';
					break;
				case 'flag':
					updateData.moderationStatus = 'flagged';
					break;
				case 'remove':
					updateData.moderationStatus = 'removed';
					updateData.isPublic = false;
					break;
			}

			if (moderationReason) {
				updateData.moderationReason = moderationReason;
				updateData.moderatedAt = new Date();
			}
		}

		const updatedPost = await SocialPost.findByIdAndUpdate(
			params.postId,
			updateData,
			{ new: true }
		)
			.populate('authorId', 'userId displayName avatar')
			.populate('recipeId', 'title imageUrl')
			.lean();

		console.log(
			`[Admin] Updated social post: ${params.postId} (${
				moderationAction || 'content update'
			})`
		);
		return NextResponse.json({
			post: updatedPost,
			message: 'Post updated successfully',
		});
	} catch (error) {
		console.error('Error updating post:', error);
		return NextResponse.json(
			{ error: 'Failed to update post' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/admin/social/posts/{postId}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete social post (Admin only)
 *     description: Permanently deletes a social post and all associated comments
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID to delete
 *       - in: query
 *         name: reason
 *         schema:
 *           type: string
 *         description: Reason for deletion
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 deletedComments:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(
	request: Request,
	{ params }: { params: { postId: string } }
) {
	const authCheck = await adminAuth('canModerateContent');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		if (!mongoose.Types.ObjectId.isValid(params.postId)) {
			return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
		}

		const { searchParams } = new URL(request.url);
		const reason = searchParams.get('reason');

		const post = await SocialPost.findById(params.postId);
		if (!post) {
			return NextResponse.json({ error: 'Post not found' }, { status: 404 });
		}

		// Delete all comments associated with this post
		const deletedComments = await SocialComment.deleteMany({
			postId: params.postId,
		});

		// Delete the post
		await SocialPost.findByIdAndDelete(params.postId);

		// Update author's posts count
		await SocialProfile.findByIdAndUpdate(post.authorId, {
			$inc: { postsCount: -1 },
		});

		console.log(
			`[Admin] Deleted social post: ${params.postId} (${
				reason || 'no reason provided'
			})`
		);
		console.log(
			`[Admin] Deleted ${deletedComments.deletedCount} associated comments`
		);

		return NextResponse.json({
			success: true,
			message: 'Post and associated comments deleted successfully',
			deletedComments: deletedComments.deletedCount,
		});
	} catch (error) {
		console.error('Error deleting post:', error);
		return NextResponse.json(
			{ error: 'Failed to delete post' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
