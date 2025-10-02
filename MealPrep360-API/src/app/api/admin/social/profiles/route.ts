import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import connectDB from '@/lib/mongodb/connection';
import { SocialProfile, SocialPost, Follow } from '@/models';

/**
 * @swagger
 * /api/admin/social/profiles:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get social profiles (Admin only)
 *     description: Retrieves social profiles with filtering and analytics
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, inactive, private, public]
 *         description: Filter by profile status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by display name or user ID
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
 *         description: Number of profiles per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, followersCount, postsCount, displayName]
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
 *         name: minFollowers
 *         schema:
 *           type: integer
 *         description: Minimum followers count
 *       - in: query
 *         name: minPosts
 *         schema:
 *           type: integer
 *         description: Minimum posts count
 *     responses:
 *       200:
 *         description: Profiles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profiles:
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
	const authCheck = await adminAuth('canViewAnalytics');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		const { searchParams } = new URL(request.url);
		const status = searchParams.get('status') || 'all';
		const search = searchParams.get('search');
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '20');
		const sortBy = searchParams.get('sortBy') || 'createdAt';
		const sortOrder = searchParams.get('sortOrder') || 'desc';
		const minFollowers = parseInt(searchParams.get('minFollowers') || '0');
		const minPosts = parseInt(searchParams.get('minPosts') || '0');
		const skip = (page - 1) * limit;

		// Build query
		const query: any = {};

		if (status !== 'all') {
			switch (status) {
				case 'active':
					query.postsCount = { $gt: 0 };
					break;
				case 'inactive':
					query.postsCount = { $eq: 0 };
					break;
				case 'private':
					query.isPrivate = true;
					break;
				case 'public':
					query.isPrivate = false;
					break;
			}
		}

		if (search) {
			query.$or = [
				{ displayName: { $regex: search, $options: 'i' } },
				{ userId: { $regex: search, $options: 'i' } },
			];
		}

		if (minFollowers > 0) {
			query.followersCount = { $gte: minFollowers };
		}

		if (minPosts > 0) {
			query.postsCount = { $gte: minPosts };
		}

		// Create sort object
		const sortObj: any = {};
		sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

		// Execute queries in parallel
		const [profiles, total, stats] = await Promise.all([
			SocialProfile.find(query).sort(sortObj).skip(skip).limit(limit).lean(),
			SocialProfile.countDocuments(query),
			SocialProfile.aggregate([
				{
					$group: {
						_id: null,
						totalProfiles: { $sum: 1 },
						privateProfiles: {
							$sum: { $cond: [{ $eq: ['$isPrivate', true] }, 1, 0] },
						},
						publicProfiles: {
							$sum: { $cond: [{ $eq: ['$isPrivate', false] }, 1, 0] },
						},
						activeProfiles: {
							$sum: { $cond: [{ $gt: ['$postsCount', 0] }, 1, 0] },
						},
						totalFollowers: { $sum: '$followersCount' },
						totalFollowing: { $sum: '$followingCount' },
						totalPosts: { $sum: '$postsCount' },
						avgFollowers: { $avg: '$followersCount' },
						avgFollowing: { $avg: '$followingCount' },
						avgPosts: { $avg: '$postsCount' },
					},
				},
			]),
		]);

		const statsData = stats[0] || {
			totalProfiles: 0,
			privateProfiles: 0,
			publicProfiles: 0,
			activeProfiles: 0,
			totalFollowers: 0,
			totalFollowing: 0,
			totalPosts: 0,
			avgFollowers: 0,
			avgFollowing: 0,
			avgPosts: 0,
		};

		console.log(
			`[Admin] Retrieved ${profiles.length} social profiles (${status})`
		);
		return NextResponse.json({
			profiles,
			pagination: {
				total,
				pages: Math.ceil(total / limit),
				current: page,
			},
			stats: statsData,
		});
	} catch (error) {
		console.error('Error fetching social profiles:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch social profiles' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/admin/social/profiles:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create social profile (Admin only)
 *     description: Creates a social profile for a user
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - displayName
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Clerk user ID
 *               displayName:
 *                 type: string
 *                 description: Display name for the profile
 *               bio:
 *                 type: string
 *                 description: Profile bio
 *               avatar:
 *                 type: string
 *                 description: Avatar URL
 *               isPrivate:
 *                 type: boolean
 *                 default: false
 *                 description: Profile privacy setting
 *     responses:
 *       201:
 *         description: Profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request data or profile already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
	const authCheck = await adminAuth('canManageUsers');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		const body = await request.json();
		const { userId, displayName, bio, avatar, isPrivate = false } = body;

		if (!userId || !displayName) {
			return NextResponse.json(
				{ error: 'userId and displayName are required' },
				{ status: 400 }
			);
		}

		// Check if profile already exists
		const existingProfile = await SocialProfile.findOne({ userId });
		if (existingProfile) {
			return NextResponse.json(
				{ error: 'Profile already exists for this user' },
				{ status: 400 }
			);
		}

		// Create the profile
		const profile = new SocialProfile({
			userId,
			displayName,
			bio,
			avatar,
			isPrivate,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await profile.save();

		console.log(
			`[Admin] Created social profile: ${profile._id} for user ${userId}`
		);
		return NextResponse.json(
			{
				profile,
				message: 'Profile created successfully',
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error creating social profile:', error);
		return NextResponse.json(
			{ error: 'Failed to create social profile' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
