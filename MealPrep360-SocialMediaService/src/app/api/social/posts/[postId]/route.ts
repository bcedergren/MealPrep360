import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { Post } from '@/models/Post';
import type { NextRequest } from 'next/server';
import { requireAuth, handleAuthError } from '@/lib/auth';

/**
 * @swagger
 * /api/social/posts/{postId}:
 *   get:
 *     description: Get a specific post
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post object
 *   patch:
 *     description: Update a post
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
 *         description: Updated post
 *   delete:
 *     description: Delete a post
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success message
 */
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
		const { postId } = await context.params;

		const post = await Post.findById(postId).select('-__v');
		if (!post) {
			return NextResponse.json({ error: 'Post not found' }, { status: 404 });
		}

		return NextResponse.json(post);
	} catch (error) {
		console.error('Error fetching post:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

export async function PATCH(
	request: Request,
	context: { params: Promise<{ postId: string }> }
) {
	try {
		const userId = await requireAuth().catch(handleAuthError);
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();
		const { postId } = await context.params;
		const updates = await request.json();

		const post = await Post.findById(postId);
		if (!post) {
			return NextResponse.json({ error: 'Post not found' }, { status: 404 });
		}

		if (post.userId !== userId) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		Object.assign(post, updates);
		await post.save();

		return NextResponse.json(post);
	} catch (error) {
		console.error('Error updating post:', error);
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
		const userId = await requireAuth().catch(handleAuthError);
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();
		const { postId } = await context.params;

		const post = await Post.findById(postId);
		if (!post) {
			return NextResponse.json({ error: 'Post not found' }, { status: 404 });
		}

		if (post.userId !== userId) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		await Post.findByIdAndDelete(postId);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error deleting post:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
