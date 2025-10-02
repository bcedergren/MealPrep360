import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serverApiClient } from '@/lib/api-client-server';
import { API_CONFIG } from '@/lib/api-config';
import connectDB from '@/lib/mongodb/connection';
import { MealPlan, User } from '@/lib/mongodb/schemas';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/meal-plans/[id] - Get specific meal plan by ID
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId, getToken } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = params;

		console.log('🔍 Fetching meal plan by ID:', id);
		console.log(
			'🌐 External API endpoint:',
			`${API_CONFIG.endpoints.mealPlans}/${id}`
		);

		// Try external API first
		const response = await serverApiClient.get(
			`${API_CONFIG.endpoints.mealPlans}/${id}`
		);

		if (response.success) {
			console.log('✅ Meal plan fetched from external API');
			return NextResponse.json(response.data);
		}

		console.error('❌ External API failed, falling back to local database');
		console.error('External API error:', response.error);

		// Fallback to local database
		try {
			await connectDB();

			// Find user by Clerk ID to get the ObjectId
			const user = await User.findOne({ clerkId: userId });
			if (!user) {
				return NextResponse.json({ error: 'User not found' }, { status: 404 });
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

			console.log('✅ Meal plan fetched from local database');
			return NextResponse.json(mealPlan);
		} catch (dbError) {
			console.error('❌ Database fallback failed:', dbError);
			return NextResponse.json(
				{
					error: 'Failed to fetch meal plan',
					details:
						'Could not retrieve meal plan information from the database.',
					type: 'MEAL_PLAN_FETCH_ERROR',
					mealPlanId: id,
				},
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error('❌ Error fetching meal plan:', error);
		return NextResponse.json(
			{
				error: 'Internal server error',
				details: 'An unexpected error occurred while fetching the meal plan.',
				type: 'INTERNAL_ERROR',
				mealPlanId: params.id,
			},
			{ status: 500 }
		);
	}
}

// DELETE /api/meal-plans/[id] - Delete meal plan
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId, getToken } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = params;

		console.log(
			'External API endpoint:',
			`${API_CONFIG.endpoints.mealPlans}/${id}`
		);

		const response = await serverApiClient.delete(
			`${API_CONFIG.endpoints.mealPlans}/${id}`
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

				// Find and delete the meal plan
				const mealPlan = await MealPlan.findOneAndDelete({
					_id: id,
					userId: user._id,
				});

				if (!mealPlan) {
					return NextResponse.json(
						{ error: 'Meal plan not found' },
						{ status: 404 }
					);
				}

				return NextResponse.json({
					success: true,
					message: 'Meal plan deleted successfully',
				});
			} catch (dbError) {
				console.error('Database fallback failed:', dbError);
				return NextResponse.json(
					{ error: 'Failed to delete meal plan' },
					{ status: 500 }
				);
			}
		}

		return NextResponse.json(response.data);
	} catch (error) {
		console.error('Error deleting meal plan:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
