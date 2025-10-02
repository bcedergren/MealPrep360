import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { User } from '@/lib/mongodb/schemas';
import connectDB from '@/lib/mongodb/connection';
import { MEALPLAN_SERVICE_URL, MEALPLAN_SERVICE_API_KEY } from '@/lib/config';

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ date: string }> }
) {
	const resolvedParams = await params;
	try {
		// Validate required environment variables at runtime
		if (!MEALPLAN_SERVICE_URL) {
			return NextResponse.json(
				{
					error: 'MEALPLAN_SERVICE_URL environment variable is not configured',
				},
				{ status: 500 }
			);
		}

		if (!MEALPLAN_SERVICE_API_KEY) {
			return NextResponse.json(
				{
					error:
						'MEALPLAN_SERVICE_API_KEY environment variable is not configured',
				},
				{ status: 500 }
			);
		}

		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { status } = await request.json();
		const dateStr = resolvedParams.date;

		console.log('Processing date:', {
			inputDate: dateStr,
			status,
		});

		await connectDB();
		const user = await User.findOne({ clerkId: userId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Validate userId format before sending to service
		const userIdString = user._id.toString();
		if (!userIdString || userIdString.length !== 24) {
			return NextResponse.json(
				{ error: 'Invalid user ID format' },
				{ status: 400 }
			);
		}

		console.log(
			`[Planned Day] Processing status update for date: ${dateStr}, userId: ${userIdString}`
		);

		// The external service doesn't have a day-based status update endpoint
		// This operation is not supported with the current service API
		return NextResponse.json(
			{
				error: 'Day-based status updates not supported',
				message:
					'Use meal plan specific endpoints with mealPlanId and dayIndex to update meal status',
			},
			{ status: 400 }
		);
	} catch (error) {
		console.error('Failed to update meal plan:', {
			date: resolvedParams.date,
			error,
		});

		return NextResponse.json(
			{ error: 'Failed to update meal plan' },
			{ status: 500 }
		);
	}
}
