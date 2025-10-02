import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import connectDB from '@/lib/mongodb/connection';
import { BlogPost, User } from '@/lib/mongodb/schemas';
import mongoose from 'mongoose';

/**
 * @swagger
 * /api/admin/blog/posts:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all blog posts (Admin only)
 *     description: Retrieves all blog posts including unpublished ones with admin filtering options
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, published, draft]
 *         description: Filter by publication status
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filter by author ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
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
 *           default: 20
 *         description: Number of posts per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and content
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
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalPosts:
 *                       type: number
 *                     publishedPosts:
 *                       type: number
 *                     draftPosts:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request) {
	const authCheck = await adminAuth('canModerateContent');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		const { searchParams } = new URL(request.url);
		const status = searchParams.get('status') || 'all';
		const author = searchParams.get('author');
		const category = searchParams.get('category');
		const search = searchParams.get('search');
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '20');
		const skip = (page - 1) * limit;

		// Build query
		const query: any = {};

		if (status !== 'all') {
			query.published = status === 'published';
		}

		if (author) {
			if (mongoose.Types.ObjectId.isValid(author)) {
				query.authorId = new mongoose.Types.ObjectId(author);
			}
		}

		if (category) {
			query.category = category;
		}

		if (search) {
			query.$or = [
				{ title: { $regex: search, $options: 'i' } },
				{ content: { $regex: search, $options: 'i' } },
				{ excerpt: { $regex: search, $options: 'i' } },
			];
		}

		// Execute queries in parallel
		const [posts, total, stats] = await Promise.all([
			BlogPost.find(query)
				.populate('authorId', 'name email image')
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			BlogPost.countDocuments(query),
			BlogPost.aggregate([
				{
					$group: {
						_id: null,
						totalPosts: { $sum: 1 },
						publishedPosts: {
							$sum: { $cond: [{ $eq: ['$published', true] }, 1, 0] },
						},
						draftPosts: {
							$sum: { $cond: [{ $eq: ['$published', false] }, 1, 0] },
						},
					},
				},
			]),
		]);

		const statsData = stats[0] || {
			totalPosts: 0,
			publishedPosts: 0,
			draftPosts: 0,
		};

		console.log(`[Admin] Retrieved ${posts.length} blog posts (${status})`);
		return NextResponse.json({
			posts,
			pagination: {
				total,
				pages: Math.ceil(total / limit),
				current: page,
			},
			stats: statsData,
		});
	} catch (error) {
		console.error('Error fetching admin blog posts:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch blog posts' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/admin/blog/posts:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create blog post (Admin only)
 *     description: Creates a new blog post with admin privileges
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
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *               content:
 *                 type: string
 *                 minLength: 1
 *               excerpt:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *               published:
 *                 type: boolean
 *                 default: false
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               authorId:
 *                 type: string
 *                 description: Override author (admin only)
 *     responses:
 *       201:
 *         description: Blog post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlogPost'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
	const authCheck = await adminAuth('canModerateContent');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		const body = await request.json();
		const {
			title,
			content,
			excerpt,
			imageUrl,
			published,
			category,
			tags,
			authorId,
		} = body;

		// Validate required fields
		if (!title || !content || !category) {
			return NextResponse.json(
				{ error: 'Title, content, and category are required' },
				{ status: 400 }
			);
		}

		// Validate author if provided
		let finalAuthorId = authorId;
		if (authorId) {
			if (!mongoose.Types.ObjectId.isValid(authorId)) {
				return NextResponse.json(
					{ error: 'Invalid author ID format' },
					{ status: 400 }
				);
			}
			const authorExists = await User.findById(authorId);
			if (!authorExists) {
				return NextResponse.json(
					{ error: 'Author not found' },
					{ status: 400 }
				);
			}
		}

		// Create blog post
		const post = new BlogPost({
			title: title.trim(),
			content: content.trim(),
			excerpt: excerpt?.trim(),
			imageUrl: imageUrl?.trim(),
			published: Boolean(published),
			category: category.trim(),
			tags: Array.isArray(tags)
				? tags.map((tag) => tag.trim()).filter(Boolean)
				: [],
			authorId: finalAuthorId,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await post.save();

		// Populate author data for response
		await post.populate('authorId', 'name email image');

		console.log(
			`[Admin] Created blog post: ${title} (${
				published ? 'published' : 'draft'
			})`
		);
		return NextResponse.json(post, { status: 201 });
	} catch (error) {
		console.error('Error creating blog post:', error);
		if (error instanceof mongoose.Error.ValidationError) {
			return NextResponse.json(
				{ error: 'Validation error', details: error.message },
				{ status: 400 }
			);
		}
		return NextResponse.json(
			{ error: 'Failed to create blog post' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
