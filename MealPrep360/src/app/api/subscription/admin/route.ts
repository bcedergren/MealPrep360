import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/schemas';
import { SubscriptionPlan, PLAN_FEATURES } from '@/types/subscription';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Connect to database and check if user is ADMIN
		await connectDB();
		const user = await User.findOne({ clerkId: userId }).select('role');

		if (!user || user.role !== 'ADMIN') {
			return NextResponse.json(
				{ error: 'Admin access required' },
				{ status: 403 }
			);
		}

		const body = await request.json();
		const { plan } = body;

		// Validate the plan
		if (!plan || !Object.keys(PLAN_FEATURES).includes(plan)) {
			return NextResponse.json(
				{ error: 'Invalid subscription plan' },
				{ status: 400 }
			);
		}

		// Update the user's subscription plan directly in the database
		const updatedUser = await User.findOneAndUpdate(
			{ clerkId: userId },
			{
				$set: {
					'subscription.plan': plan,
					'subscription.status': 'ACTIVE',
					'subscription.currentPeriodEnd': new Date(
						Date.now() + 30 * 24 * 60 * 60 * 1000
					), // 30 days from now
				},
			},
			{ new: true }
		);

		if (!updatedUser) {
			return NextResponse.json(
				{ error: 'Failed to update subscription' },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			message: `Successfully switched to ${plan} plan (Admin Override)`,
			plan: plan,
			features: PLAN_FEATURES[plan as SubscriptionPlan],
		});
	} catch (error) {
		console.error('Error switching admin subscription:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
