import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Follow, SocialProfile } from '@/models';
import { User } from '@/lib/mongodb/schemas';
import { PLAN_FEATURES } from '@/types/subscription';

function hasSocialAccess(plan) {
	const feature = PLAN_FEATURES[plan || 'FREE']['Social Features'];
	return feature !== false;
}

// POST /api/social/follow
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

		const { followingId } = await req.json();
		if (!followingId) {
			return NextResponse.json(
				{ error: 'Following ID is required' },
				{ status: 400 }
			);
		}

		// Get the follower's profile
		const followerProfile = await SocialProfile.findOne({ userId });
		if (!followerProfile) {
			return NextResponse.json(
				{ error: 'Follower profile not found' },
				{ status: 404 }
			);
		}

		// Get the following user's profile
		const followingProfile = await SocialProfile.findOne({
			userId: followingId,
		});
		if (!followingProfile) {
			return NextResponse.json(
				{ error: 'Following profile not found' },
				{ status: 404 }
			);
		}

		// Check if already following
		const existingFollow = await Follow.findOne({
			followerId: followerProfile._id,
			followingId: followingProfile._id,
		});

		if (existingFollow) {
			return NextResponse.json(
				{ error: 'Already following this user' },
				{ status: 400 }
			);
		}

		// Create the follow relationship
		const follow = await Follow.create({
			followerId: followerProfile._id,
			followingId: followingProfile._id,
		});

		return NextResponse.json(follow);
	} catch (error) {
		console.error('Error following user:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// DELETE /api/social/follow
export async function DELETE(req) {
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

		const { followingId } = await req.json();
		if (!followingId) {
			return NextResponse.json(
				{ error: 'Following ID is required' },
				{ status: 400 }
			);
		}

		// Get the follower's profile
		const followerProfile = await SocialProfile.findOne({ userId });
		if (!followerProfile) {
			return NextResponse.json(
				{ error: 'Follower profile not found' },
				{ status: 404 }
			);
		}

		// Get the following user's profile
		const followingProfile = await SocialProfile.findOne({
			userId: followingId,
		});
		if (!followingProfile) {
			return NextResponse.json(
				{ error: 'Following profile not found' },
				{ status: 404 }
			);
		}

		// Delete the follow relationship
		const result = await Follow.deleteOne({
			followerId: followerProfile._id,
			followingId: followingProfile._id,
		});

		if (result.deletedCount === 0) {
			return NextResponse.json(
				{ error: 'Not following this user' },
				{ status: 400 }
			);
		}

		return NextResponse.json({ message: 'Unfollowed successfully' });
	} catch (error) {
		console.error('Error unfollowing user:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
