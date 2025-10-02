import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serverApiClient } from '@/lib/api-client-server';
import { API_CONFIG } from '@/lib/api-config';
import connectDB from '@/lib/mongodb/connection';
import { MealPlan, User } from '@/lib/mongodb/schemas';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// POST /api/meal-plans/[id]/days/[dayIndex]/skip - Skip meal plan day
export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string; dayIndex: string } }
) {
	try {
		const { userId, getToken } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id, dayIndex } = params;
		const body = await request.json();

		console.log(
			'External API endpoint:',
			`${API_CONFIG.endpoints.mealPlans}/${id}/days/${dayIndex}/skip`,
			'Body:',
			body
		);

		const response = await serverApiClient.post(
			`${API_CONFIG.endpoints.mealPlans}/${id}/days/${dayIndex}/skip`,
			body
		);

		if (!response.success) {
			console.error('External API failed, falling back to local database');

			try {
				await connectDB();

				// Find user by Clerk ID to get the ObjectId
				const user = await User.findOne({ clerkId: userId });
				if (!user) {
					return NextResponse.json(
						{ error: 'User not found' },
						{ status: 404 }
					);
				}

				// Find the meal plan
				const mealPlan = await MealPlan.findOne({
					_id: id,
					userId: user._id,
				});

				if (!mealPlan) {
					return NextResponse.json(
						{ error: 'Meal plan not found' },
						{ status: 404 }
					);
				}

				// Update the specific day to skipped
				const dayIndexNum = parseInt(dayIndex);
				if (dayIndexNum < 0 || dayIndexNum >= mealPlan.days.length) {
					return NextResponse.json(
						{ error: 'Invalid day index' },
						{ status: 400 }
					);
				}

				// Mark the day as skipped
				mealPlan.days[dayIndexNum] = {
					...mealPlan.days[dayIndexNum],
					status: 'skipped',
					recipeId: null,
					recipe: null,
				};

				mealPlan.updatedAt = new Date();
				await mealPlan.save();

				return NextResponse.json({
					success: true,
					message: 'Meal plan day skipped successfully',
					updatedDay: mealPlan.days[dayIndexNum],
				});
			} catch (dbError) {
				console.error('Database fallback failed:', dbError);
				return NextResponse.json(
					{ error: 'Failed to skip meal plan day' },
					{ status: 500 }
				);
			}
		}

		return NextResponse.json(response.data);
	} catch (error) {
		console.error('Error skipping meal plan day:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
