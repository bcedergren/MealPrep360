import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BlogPost from '@/models/BlogPost';

// Get single blog post
export async function GET(
	request: NextRequest,
	context: { params: Promise<{ id: string }> }
): Promise<Response> {
	try {
		await connectDB();
		const { id } = await context.params;
		const post = await BlogPost.findById(id);

		if (!post) {
			return NextResponse.json(
				{ error: 'Blog post not found' },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			data: post,
		});
	} catch (error) {
		console.error('Error fetching blog post:', error);
		return NextResponse.json(
			{ error: 'Error fetching blog post' },
			{ status: 500 }
		);
	}
}

// Update blog post
export async function PUT(
	request: NextRequest,
	context: { params: Promise<{ id: string }> }
): Promise<Response> {
	try {
		await connectDB();
		const { id } = await context.params;
		const updates = await request.json();

		const post = await BlogPost.findByIdAndUpdate(id, updates, {
			new: true,
		});

		if (!post) {
			return NextResponse.json(
				{ error: 'Blog post not found' },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			data: post,
		});
	} catch (error) {
		console.error('Error updating blog post:', error);
		return NextResponse.json(
			{ error: 'Error updating blog post' },
			{ status: 500 }
		);
	}
}
