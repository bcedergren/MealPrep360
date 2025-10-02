import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { Post } from '@/models/Post';
import type { NextRequest } from 'next/server';

/**
 * @swagger
 * /api/social/posts/{postId}/like:
 *   post:
 *     description: Like or unlike a post
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated post with like status
 */
export async function POST(
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
		const { postId } = params;

		const post = await Post.findById(postId);
		if (!post) {
			return NextResponse.json({ error: 'Post not found' }, { status: 404 });
		}

		// Toggle like
		const hasLiked = post.likes.includes(userId);
		const update = hasLiked
			? { $pull: { likes: userId } }
			: { $addToSet: { likes: userId } };

		const updatedPost = await Post.findByIdAndUpdate(postId, update, {
			new: true,
		});

		return NextResponse.json(updatedPost);
	} catch (error) {
		console.error('Error toggling like:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
