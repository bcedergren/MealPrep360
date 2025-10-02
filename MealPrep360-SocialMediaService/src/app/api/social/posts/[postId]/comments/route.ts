import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Post } from '@/models/Post';
import { Comment } from '@/models/Comment';
import { Notification } from '@/models/Notification';
import connectDB from '@/lib/mongodb';
import type { NextRequest } from 'next/server';
import { requireAuth, handleAuthError } from '@/lib/auth';
import { handleError, Errors } from '@/lib/errorHandler';
import { defaultRateLimit } from '@/lib/rateLimit';
import mongoose from 'mongoose';

interface CommentBody {
	content: string;
	parentId?: string;
}

/**
 * @swagger
 * /api/social/posts/{postId}/comments:
 *   get:
 *     description: Get comments for a post
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments
 *   post:
 *     description: Add a comment to a post
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Created comment
 *   delete:
 *     description: Delete a comment from a post
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Deleted comment
 */

// Add comment
export async function POST(
	request: Request,
	context: { params: Promise<{ postId: string }> }
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body: CommentBody = await request.json();
		const { content, parentId } = body;

		if (!content) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			);
		}

		await connectDB();

		const params = await context.params;
		const post = await Post.findById(params.postId);
		if (!post) {
			return NextResponse.json({ error: 'Post not found' }, { status: 404 });
		}

		// Create comment
		const comment = new Comment({
			postId: post._id,
			authorId: userId,
			content,
			parentId,
		});

		await comment.save();

		// Add comment to post
		post.comments.push(comment._id);
		await post.save();

		// Notify post author if comment is not from them
		if (post.authorId !== userId) {
			await Notification.create({
				userId: post.authorId,
				type: 'comment',
				content: `Someone commented on your post`,
				data: { postId: post._id, commentId: comment._id },
			});
		}

		// If this is a reply, notify parent comment author
		if (parentId) {
			const parentComment = await Comment.findById(parentId);
			if (parentComment && parentComment.authorId !== userId) {
				await Notification.create({
					userId: parentComment.authorId,
					type: 'comment_reply',
					content: `Someone replied to your comment`,
					data: { postId: post._id, commentId: comment._id },
				});
			}
		}

		return NextResponse.json(comment);
	} catch (error) {
		console.error('Error adding comment:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// Get comments
export async function GET(
	request: Request,
	context: { params: Promise<{ postId: string }> }
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		const params = await context.params;
		const post = await Post.findById(params.postId);
		if (!post) {
			return NextResponse.json({ error: 'Post not found' }, { status: 404 });
		}

		// Get comments
		const comments = await Comment.find({ postId: post._id })
			.sort({ createdAt: -1 })
			.populate<{ authorId: { username: string } }>('authorId', 'username')
			.lean();

		return NextResponse.json(comments);
	} catch (error) {
		console.error('Error fetching comments:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: Request,
	context: { params: Promise<{ postId: string }> }
) {
	try {
		// Apply rate limiting
		const rateLimitResult = await defaultRateLimit(request);
		if (rateLimitResult) return rateLimitResult;

		// Authenticate user
		const userId = await requireAuth().catch(handleAuthError);
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Connect to database
		await connectDB();

		const params = await context.params;
		const { postId } = params;
		const { commentId } = await request.json();

		// Find post
		const post = await Post.findById(postId);
		if (!post) {
			return handleError(Errors.NotFound('Post not found'));
		}

		// Verify comment ownership
		const comment = await Comment.findById(commentId);
		if (!comment || comment.authorId !== userId) {
			return handleError(Errors.Forbidden('Cannot delete this comment'));
		}

		// Remove comment
		const updatedPost = await Post.findByIdAndUpdate(
			postId,
			{ $pull: { comments: new mongoose.Types.ObjectId(commentId) } },
			{ new: true }
		);

		await Comment.findByIdAndDelete(commentId);

		return NextResponse.json(updatedPost);
	} catch (error) {
		return handleError(error);
	}
}
