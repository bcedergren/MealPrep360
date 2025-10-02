import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { BlogComment, User } from '@/lib/mongodb/schemas';
import connectDB from '@/lib/mongodb/connection';
import { z } from 'zod';

const commentSchema = z.object({
	content: z.string().min(1).max(1000),
	postId: z.string(),
	parentId: z.string().optional(),
});

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const postId = searchParams.get('postId');
		const parentId = searchParams.get('parentId');

		if (!postId) {
			return NextResponse.json(
				{ error: 'Post ID is required' },
				{ status: 400 }
			);
		}

		await connectDB();
		const comments = await BlogComment.find({
			postId,
			parentId: parentId || null,
		})
			.populate('userId', 'name image')
			.populate({
				path: 'replies',
				populate: {
					path: 'userId',
					select: 'name image',
				},
			})
			.sort({ createdAt: -1 });

		return NextResponse.json(comments);
	} catch (error) {
		console.error('Error fetching comments:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch comments' },
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

		const body = await request.json();
		const validatedData = commentSchema.parse(body);

		await connectDB();
		const comment = await (
			await BlogComment.create({
				...validatedData,
				userId,
			})
		).populate('userId', 'name image');

		return NextResponse.json(comment);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Invalid data', details: error.errors },
				{ status: 400 }
			);
		}

		console.error('Error creating comment:', error);
		return NextResponse.json(
			{ error: 'Failed to create comment' },
			{ status: 500 }
		);
	}
}

export async function PUT(request: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { id, ...data } = body;
		const validatedData = commentSchema.parse(data);

		await connectDB();
		const existingComment = await BlogComment.findById(id).select('userId');

		if (!existingComment) {
			return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
		}

		if (existingComment.userId.toString() !== userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const comment = await BlogComment.findByIdAndUpdate(id, validatedData, {
			new: true,
		}).populate('userId', 'name image');

		return NextResponse.json(comment);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Invalid data', details: error.errors },
				{ status: 400 }
			);
		}

		console.error('Error updating comment:', error);
		return NextResponse.json(
			{ error: 'Failed to update comment' },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const id = searchParams.get('id');

		if (!id) {
			return NextResponse.json(
				{ error: 'Comment ID is required' },
				{ status: 400 }
			);
		}

		await connectDB();
		const existingComment = await BlogComment.findById(id).select('userId');

		if (!existingComment) {
			return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
		}

		if (existingComment.userId.toString() !== userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await BlogComment.findByIdAndDelete(id);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error deleting comment:', error);
		return NextResponse.json(
			{ error: 'Failed to delete comment' },
			{ status: 500 }
		);
	}
}
