/**
 * @swagger
 * /api/social/feed:
 *   get:
 *     description: Get the social feed for the authenticated user
 *     responses:
 *       200:
 *         description: List of posts
 */
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { Post } from '@/models/Post';

export async function GET() {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		const posts = await Post.find({
			$or: [
				{ isPublic: true },
				{ authorId: userId },
				{ 'mentions.userId': userId },
			],
		})
			.sort({ createdAt: -1 })
			.limit(20)
			.populate('authorId', 'displayName avatar')
			.select('-__v');

		return NextResponse.json(posts);
	} catch (error) {
		console.error('Error fetching feed:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();
		const body = await request.json();

                const newPost = new Post({
                        ...body,
                        authorId: userId,
                });

		await newPost.save();

		return NextResponse.json(newPost);
	} catch (error) {
		console.error('Error creating post:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
