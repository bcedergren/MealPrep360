import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User, BlogPost } from '@/lib/mongodb/schemas';
import { z } from 'zod';
import { NextRequest } from 'next/server';

const blogPostSchema = z.object({
	title: z.string().min(1).max(200),
	content: z.string().min(1),
	excerpt: z.string().optional(),
	category: z.string().min(1),
	tags: z.array(z.string()),
	imageUrl: z.string().url().optional(),
	featured: z.boolean().optional(),
	published: z.boolean().optional(),
});

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	const { id } = params;
	try {
		await connectDB();
		const post = await BlogPost.findById(id).populate('authorId', 'name image');

		if (!post) {
			return NextResponse.json(
				{ error: 'Blog post not found' },
				{ status: 404 }
			);
		}

		// Increment view count
		await BlogPost.findByIdAndUpdate(id, { $inc: { views: 1 } });

		// Get related posts
		const relatedPosts = await BlogPost.find({
			_id: { $ne: id },
			$or: [{ category: post.category }, { tags: { $in: post.tags } }],
			published: true,
		})
			.populate('authorId', 'name image')
			.sort({ publishedAt: -1 })
			.limit(3);

		// Check if the current user has liked the post
		const session = await auth();
		let isLiked = false;
		if (session?.userId) {
			const user = await User.findOne({ clerkId: session.userId });
			if (user) {
				isLiked = user.likedPosts?.includes(id) || false;
			}
		}

		return NextResponse.json({
			post,
			relatedPosts,
			isLiked,
		});
	} catch (error) {
		console.error('Error fetching blog post:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch blog post' },
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	const { id } = params;
	try {
		await connectDB();
		const session = await auth();
		if (!session?.userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get the current user from the database
		const currentUser = await User.findOne({ clerkId: session.userId });

		if (!currentUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const body = await request.json();
		const validatedData = blogPostSchema.parse(body);

		const existingPost = await BlogPost.findById(id);

		if (!existingPost) {
			return NextResponse.json(
				{ error: 'Blog post not found' },
				{ status: 404 }
			);
		}

		if (existingPost.authorId.toString() !== currentUser._id.toString()) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const post = await BlogPost.findByIdAndUpdate(
			id,
			{
				...validatedData,
				publishedAt: validatedData.published ? new Date() : null,
				featuredAt: validatedData.featured ? new Date() : null,
			},
			{ new: true }
		);

		return NextResponse.json(post);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Invalid data', details: error.errors },
				{ status: 400 }
			);
		}

		console.error('Error updating blog post:', error);
		return NextResponse.json(
			{ error: 'Failed to update blog post' },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	const { id } = params;
	try {
		await connectDB();
		const session = await auth();
		if (!session?.userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const existingPost = await BlogPost.findById(id);

		if (!existingPost) {
			return NextResponse.json(
				{ error: 'Blog post not found' },
				{ status: 404 }
			);
		}

		if (existingPost.authorId.toString() !== session.userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await BlogPost.findByIdAndDelete(id);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error deleting blog post:', error);
		return NextResponse.json(
			{ error: 'Failed to delete blog post' },
			{ status: 500 }
		);
	}
}
