import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/schemas';
import { PLAN_FEATURES, SubscriptionPlan } from '@/types/subscription';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Connect to database and fetch user's subscription
		await connectDB();
		const user = await User.findOne({ clerkId: userId }).select('subscription');

		// Default to FREE plan if no subscription found
		const plan: SubscriptionPlan = user?.subscription?.plan || 'FREE';
		const status = user?.subscription?.status || 'ACTIVE';
		const currentPeriodEnd = user?.subscription?.currentPeriodEnd;

		// Return response matching the API documentation format
		const subscription = {
			plan: plan,
			status: status,
			currentPeriodEnd: currentPeriodEnd,
			features: PLAN_FEATURES[plan] || PLAN_FEATURES.FREE,
		};

		return NextResponse.json(subscription);
	} catch (error) {
		console.error('Error fetching subscription:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
