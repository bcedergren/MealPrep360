import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User, BlogPost } from '@/lib/mongodb/schemas';
import { z } from 'zod';
import type { Document } from 'mongoose';

const blogPostSchema = z.object({
	title: z.string().min(1).max(200),
	content: z.string().min(1),
	excerpt: z.string().optional(),
	imageUrl: z.string().url().optional(),
	published: z.boolean().optional(),
	category: z.string(),
	tags: z.array(z.string()),
});

interface BlogPostDocument extends Document {
	_id: string;
	authorId: string;
}

// Add cleanup function
async function cleanupInvalidPosts() {
	try {
		await connectDB();
		// Get all posts
		const allPosts = await BlogPost.find().select('authorId');

		// Find posts with invalid authors
		const invalidPosts = allPosts.filter(
			(post: BlogPostDocument) => !post.authorId
		);

		if (invalidPosts.length > 0) {
			// Delete invalid posts
			await BlogPost.deleteMany({
				_id: {
					$in: invalidPosts.map((post: BlogPostDocument) => post._id),
				},
			});
		}
	} catch (error) {
		console.error('Error cleaning up invalid posts:', error);
	}
}

// Call cleanup when the server starts
cleanupInvalidPosts();

/**
 * @swagger
 * /api/blog/posts:
 *   get:
 *     tags:
 *       - Blog
 *     summary: Get published blog posts
 *     description: Retrieves published blog posts with optional filtering and pagination
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by tag
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of posts per page
 *     responses:
 *       200:
 *         description: Blog posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BlogPost'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     pages:
 *                       type: number
 *                     current:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: Request) {
	try {
		const { userId: clerkId } = await auth();
		if (!clerkId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		// Get the current user from the database
		const currentUser = await User.findOne({ clerkId });

		if (!currentUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const { searchParams } = new URL(request.url);

		// Use pagination for all views (admin functionality moved to separate project)
		const category = searchParams.get('category');
		const tag = searchParams.get('tag');
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '10');
		const skip = (page - 1) * limit;

		const query: any = {
			published: true,
		};

		if (category) {
			query.category = category;
		}

		if (tag) {
			query.tags = tag;
		}

		try {
			const [posts, total] = await Promise.all([
				BlogPost.find(query)
					.populate('authorId', 'name image')
					.sort({ createdAt: -1 })
					.skip(skip)
					.limit(limit),
				BlogPost.countDocuments(query),
			]);

			return NextResponse.json({
				posts,
				pagination: {
					total,
					pages: Math.ceil(total / limit),
					current: page,
				},
			});
		} catch (dbError) {
			console.error('Database error while fetching public posts:', dbError);
			if (dbError instanceof Error) {
				return NextResponse.json(
					{
						error: 'Database error while fetching posts',
						details: dbError.message,
					},
					{ status: 500 }
				);
			}
			throw dbError;
		}
	} catch (error) {
		console.error('Error fetching blog posts:', error);
		if (error instanceof z.ZodError) {
			console.error('Validation error:', error.errors);
			return NextResponse.json(
				{ error: 'Invalid data', details: error.errors },
				{ status: 400 }
			);
		} else if (error instanceof Error) {
			return NextResponse.json(
				{
					error: 'Internal error',
					details: error.message,
				},
				{ status: 500 }
			);
		} else {
			return NextResponse.json(
				{
					error: 'Internal error',
					details: 'Unknown error',
				},
				{ status: 500 }
			);
		}
	}
}

/**
 * @swagger
 * /api/blog/posts:
 *   post:
 *     tags:
 *       - Blog
 *     summary: Create a new blog post
 *     description: Creates a new blog post for the authenticated user
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - category
 *               - tags
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 description: Blog post title
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 description: Blog post content (HTML/Markdown)
 *               excerpt:
 *                 type: string
 *                 description: Brief excerpt or summary
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 description: Featured image URL
 *               published:
 *                 type: boolean
 *                 description: Whether the post is published
 *                 default: false
 *               category:
 *                 type: string
 *                 description: Post category
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Post tags
 *     responses:
 *       200:
 *         description: Blog post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlogPost'
 *       400:
 *         description: Invalid data or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Duplicate title or slug
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to create blog post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(req: Request) {
	try {
		const { userId: clerkId } = await auth();
		if (!clerkId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		// Get the current user from the database
		const currentUser = await User.findOne({ clerkId });

		if (!currentUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const body = await req.json();
		const validatedData = blogPostSchema.parse(body);
		const { title, content, excerpt, imageUrl, published, category, tags } =
			validatedData;

		// Create the post
		try {
			const post = await BlogPost.create({
				title,
				slug: title.toLowerCase().replace(/\s+/g, '-'),
				content,
				excerpt,
				imageUrl,
				published,
				category,
				tags,
				authorId: currentUser._id,
				readTime: Math.ceil(content.split(/\s+/).length / 200),
			});
			return NextResponse.json(post);
		} catch (dbError) {
			console.error('Database error:', dbError);
			throw dbError;
		}
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error('Validation error:', error.errors);
			return NextResponse.json(
				{ error: 'Invalid data', details: error.errors },
				{ status: 400 }
			);
		}
		if (
			typeof error === 'object' &&
			error !== null &&
			'code' in error &&
			(error as any).code === 11000 // MongoDB duplicate key error
		) {
			return NextResponse.json(
				{
					error: 'A post with the same title or slug already exists.',
				},
				{ status: 409 }
			);
		}
		console.error('Error creating blog post:', error);
		return NextResponse.json(
			{ error: 'Failed to create blog post' },
			{ status: 500 }
		);
	}
}

export async function PUT(request: Request) {
	try {
		const { userId: clerkId } = await auth();
		if (!clerkId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		// Get the current user from the database
		const currentUser = await User.findOne({ clerkId });

		if (!currentUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const { searchParams } = new URL(request.url);
		const postId = searchParams.get('id');

		if (!postId) {
			return NextResponse.json(
				{ error: 'Post ID is required' },
				{ status: 400 }
			);
		}

		const body = await request.json();
		const validatedData = blogPostSchema.parse(body);

		// Check if the post exists and belongs to the user
		const existingPost = await BlogPost.findOne({
			_id: postId,
			authorId: currentUser._id,
		});

		if (!existingPost) {
			return NextResponse.json(
				{ error: 'Post not found or unauthorized' },
				{ status: 404 }
			);
		}

		// Update the post
		const updatedPost = await BlogPost.findByIdAndUpdate(
			postId,
			{
				...validatedData,
				slug: validatedData.title.toLowerCase().replace(/\s+/g, '-'),
				readTime: Math.ceil(validatedData.content.split(/\s+/).length / 200),
			},
			{ new: true }
		);

		return NextResponse.json(updatedPost);
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

export async function DELETE(request: Request) {
	try {
		const { userId: clerkId } = await auth();
		if (!clerkId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		// Get the current user from the database
		const currentUser = await User.findOne({ clerkId });

		if (!currentUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const { searchParams } = new URL(request.url);
		const postId = searchParams.get('id');

		if (!postId) {
			return NextResponse.json(
				{ error: 'Post ID is required' },
				{ status: 400 }
			);
		}

		// Check if the post exists and belongs to the user
		const existingPost = await BlogPost.findOne({
			_id: postId,
			authorId: currentUser._id,
		});

		if (!existingPost) {
			return NextResponse.json(
				{ error: 'Post not found or unauthorized' },
				{ status: 404 }
			);
		}

		// Delete the post
		await BlogPost.findByIdAndDelete(postId);

		return NextResponse.json({ message: 'Post deleted successfully' });
	} catch (error) {
		console.error('Error deleting blog post:', error);
		return NextResponse.json(
			{ error: 'Failed to delete blog post' },
			{ status: 500 }
		);
	}
}
