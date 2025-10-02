import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import connectDB from '@/lib/mongodb/connection';
import { SocialPost, SocialProfile, SocialComment } from '@/models';

/**
 * @swagger
 * /api/admin/social/posts:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get social posts (Admin only)
 *     description: Retrieves social posts with filtering and moderation capabilities
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, public, private, reported, flagged]
 *         description: Filter by post status
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *         description: Filter by author profile ID
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
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, likesCount, commentsCount, updatedAt]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in post content
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [today, week, month, all]
 *           default: all
 *         description: Filter by time range
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                 stats:
 *                   type: object
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
		const authorId = searchParams.get('authorId');
		const search = searchParams.get('search');
		const timeRange = searchParams.get('timeRange') || 'all';
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '20');
		const sortBy = searchParams.get('sortBy') || 'createdAt';
		const sortOrder = searchParams.get('sortOrder') || 'desc';
		const skip = (page - 1) * limit;

		// Build query
		const query: any = {};

		if (status !== 'all') {
			switch (status) {
				case 'public':
					query.isPublic = true;
					break;
				case 'private':
					query.isPublic = false;
					break;
				case 'reported':
					// Would need to add a reports field or join with reports collection
					break;
				case 'flagged':
					// Would need to add a flagged field
					break;
			}
		}

		if (authorId) {
			query.authorId = authorId;
		}

		if (search) {
			query.content = { $regex: search, $options: 'i' };
		}

		// Add time range filter
		if (timeRange !== 'all') {
			const now = new Date();
			let startDate: Date;

			switch (timeRange) {
				case 'today':
					startDate = new Date(
						now.getFullYear(),
						now.getMonth(),
						now.getDate()
					);
					break;
				case 'week':
					startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
					break;
				case 'month':
					startDate = new Date(now.getFullYear(), now.getMonth(), 1);
					break;
				default:
					startDate = new Date(0);
			}

			query.createdAt = { $gte: startDate };
		}

		// Create sort object
		const sortObj: any = {};
		sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

		// Execute queries in parallel
		const [posts, total, stats] = await Promise.all([
			SocialPost.find(query)
				.sort(sortObj)
				.skip(skip)
				.limit(limit)
				.populate('authorId', 'userId displayName avatar')
				.populate('recipeId', 'title imageUrl')
				.lean(),
			SocialPost.countDocuments(query),
			SocialPost.aggregate([
				{
					$group: {
						_id: null,
						totalPosts: { $sum: 1 },
						publicPosts: {
							$sum: { $cond: [{ $eq: ['$isPublic', true] }, 1, 0] },
						},
						privatePosts: {
							$sum: { $cond: [{ $eq: ['$isPublic', false] }, 1, 0] },
						},
						totalLikes: { $sum: '$likesCount' },
						totalComments: { $sum: '$commentsCount' },
						avgLikes: { $avg: '$likesCount' },
						avgComments: { $avg: '$commentsCount' },
					},
				},
			]),
		]);

		const statsData = stats[0] || {
			totalPosts: 0,
			publicPosts: 0,
			privatePosts: 0,
			totalLikes: 0,
			totalComments: 0,
			avgLikes: 0,
			avgComments: 0,
		};

		console.log(`[Admin] Retrieved ${posts.length} social posts (${status})`);
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
		console.error('Error fetching social posts:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch social posts' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/admin/social/posts:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create admin social post (Admin only)
 *     description: Creates a social post as an admin for announcements or moderation
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - authorId
 *             properties:
 *               content:
 *                 type: string
 *                 description: Post content
 *               authorId:
 *                 type: string
 *                 description: Social profile ID of the author
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of image URLs
 *               recipeId:
 *                 type: string
 *                 description: Optional recipe reference
 *               isPublic:
 *                 type: boolean
 *                 default: true
 *                 description: Post visibility
 *     responses:
 *       201:
 *         description: Post created successfully
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
 *         description: Author profile not found
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
	const authCheck = await adminAuth('canModerateContent');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		const body = await request.json();
		const { content, authorId, images = [], recipeId, isPublic = true } = body;

		if (!content || !authorId) {
			return NextResponse.json(
				{ error: 'Content and authorId are required' },
				{ status: 400 }
			);
		}

		// Verify author profile exists
		const authorProfile = await SocialProfile.findById(authorId);
		if (!authorProfile) {
			return NextResponse.json(
				{ error: 'Author profile not found' },
				{ status: 404 }
			);
		}

		// Create the post
		const post = new SocialPost({
			authorId,
			content,
			images,
			recipeId: recipeId || undefined,
			isPublic,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await post.save();

		// Update author's posts count
		await SocialProfile.findByIdAndUpdate(authorId, {
			$inc: { postsCount: 1 },
		});

		// Populate the post with author information
		await post.populate('authorId', 'userId displayName avatar');
		if (recipeId) {
			await post.populate('recipeId', 'title imageUrl');
		}

		console.log(
			`[Admin] Created social post: ${post._id} by ${authorProfile.displayName}`
		);
		return NextResponse.json(
			{
				post,
				message: 'Post created successfully',
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error creating social post:', error);
		return NextResponse.json(
			{ error: 'Failed to create social post' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
