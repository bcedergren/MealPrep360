import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SocialPost, SocialProfile } from '@/models';
import { User } from '@/lib/mongodb/schemas';
import { PLAN_FEATURES } from '@/types/subscription';

function hasSocialAccess(plan) {
	const feature = PLAN_FEATURES[plan || 'FREE']['Social Features'];
	return feature !== false;
}

// GET /api/social/posts
export async function GET(req) {
	try {
		const { userId } = auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check user's subscription plan
		const user = await User.findOne({ clerkId: userId });
		const currentPlan = user?.subscription?.plan || 'FREE';

		if (!hasSocialAccess(currentPlan)) {
			return NextResponse.json(
				{
					error: `Social features are not available on the ${currentPlan} plan. Please upgrade to access social features.`,
					type: 'FEATURE_NOT_AVAILABLE',
					plan: currentPlan,
				},
				{ status: 403 }
			);
		}

		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get('page')) || 1;
		const limit = parseInt(searchParams.get('limit')) || 10;
		const skip = (page - 1) * limit;

		// Get user's profile
		const userProfile = await SocialProfile.findOne({ userId });
		if (!userProfile) {
			return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
		}

		// Get posts from followed users and user's own posts
		const posts = await SocialPost.find({
			$or: [
				{ authorId: userProfile._id },
				{ authorId: { $in: userProfile.following } },
			],
		})
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.populate('authorId', 'userId displayName avatar')
			.populate('likes', 'userId displayName')
			.populate({
				path: 'comments',
				populate: {
					path: 'authorId',
					select: 'userId displayName avatar',
				},
			});

		const total = await SocialPost.countDocuments({
			$or: [
				{ authorId: userProfile._id },
				{ authorId: { $in: userProfile.following } },
			],
		});

		return NextResponse.json({
			posts,
			total,
			hasMore: skip + posts.length < total,
		});
	} catch (error) {
		console.error('Error fetching posts:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// POST /api/social/posts
export async function POST(req) {
	try {
		const { userId } = auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check user's subscription plan
		const user = await User.findOne({ clerkId: userId });
		const currentPlan = user?.subscription?.plan || 'FREE';

		if (!hasSocialAccess(currentPlan)) {
			return NextResponse.json(
				{
					error: `Social features are not available on the ${currentPlan} plan. Please upgrade to access social features.`,
					type: 'FEATURE_NOT_AVAILABLE',
					plan: currentPlan,
				},
				{ status: 403 }
			);
		}

		const { content, images, visibility } = await req.json();
		if (!content) {
			return NextResponse.json(
				{ error: 'Content is required' },
				{ status: 400 }
			);
		}

		// Get user's profile
		const userProfile = await SocialProfile.findOne({ userId });
		if (!userProfile) {
			return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
		}

		// Create the post
		const post = await SocialPost.create({
			authorId: userProfile._id,
			content,
			images,
			visibility: visibility || 'PUBLIC',
		});

		// Populate the author information
		await post.populate('authorId', 'userId displayName avatar');

		return NextResponse.json(post);
	} catch (error) {
		console.error('Error creating post:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
