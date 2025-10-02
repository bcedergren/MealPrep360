import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GroupPrepSession, SocialProfile } from '@/models';
import { User } from '@/lib/mongodb/schemas';
import { PLAN_FEATURES } from '@/types/subscription';

function hasSocialAccess(plan) {
	const feature = PLAN_FEATURES[plan || 'FREE']['Social Features'];
	return feature !== false;
}

// GET /api/social/group-prep
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

		// Get sessions where user is either host or participant
		const sessions = await GroupPrepSession.find({
			$or: [{ hostId: userProfile._id }, { participants: userProfile._id }],
		})
			.sort({ startTime: -1 })
			.skip(skip)
			.limit(limit)
			.populate('hostId', 'userId displayName avatar')
			.populate('participants', 'userId displayName avatar')
			.populate('tasks.assignedTo', 'userId displayName avatar');

		const total = await GroupPrepSession.countDocuments({
			$or: [{ hostId: userProfile._id }, { participants: userProfile._id }],
		});

		return NextResponse.json({
			sessions,
			total,
			hasMore: skip + sessions.length < total,
		});
	} catch (error) {
		console.error('Error fetching group prep sessions:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// POST /api/social/group-prep
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

		const { title, description, startTime, endTime, maxParticipants, tasks } =
			await req.json();
		if (!title || !startTime || !endTime) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			);
		}

		// Get user's profile
		const userProfile = await SocialProfile.findOne({ userId });
		if (!userProfile) {
			return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
		}

		// Create the session
		const session = await GroupPrepSession.create({
			hostId: userProfile._id,
			title,
			description,
			startTime: new Date(startTime),
			endTime: new Date(endTime),
			maxParticipants: maxParticipants || 10,
			tasks: tasks || [],
			participants: [userProfile._id], // Host is automatically a participant
		});

		// Populate the host and participants information
		await session.populate('hostId', 'userId displayName avatar');
		await session.populate('participants', 'userId displayName avatar');
		await session.populate('tasks.assignedTo', 'userId displayName avatar');

		return NextResponse.json(session);
	} catch (error) {
		console.error('Error creating group prep session:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
