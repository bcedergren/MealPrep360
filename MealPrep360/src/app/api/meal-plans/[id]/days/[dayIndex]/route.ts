import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serverApiClient } from '@/lib/api-client-server';
import { API_CONFIG } from '@/lib/api-config';
import connectDB from '@/lib/mongodb/connection';
import { MealPlan, User } from '@/lib/mongodb/schemas';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// PATCH /api/meal-plans/[id]/days/[dayIndex] - Update meal plan day
export async function PATCH(
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
			'🎯 Updating meal plan day:',
			`${id}/days/${dayIndex}`,
			'Body:',
			body
		);

		// Log the base URL being used
		console.log(
			'🌐 Environment variable NEXT_PUBLIC_API_URL:',
			process.env.NEXT_PUBLIC_API_URL
		);

		// Try different endpoint structures and methods that might be supported by the external API
		const attempts = [
			{
				method: 'patch',
				endpoint: `${API_CONFIG.endpoints.mealPlans}/${id}/days/${dayIndex}`,
				data: body,
			},
			{
				method: 'put',
				endpoint: `${API_CONFIG.endpoints.mealPlans}/${id}/days/${dayIndex}`,
				data: body,
			},
			{
				method: 'patch',
				endpoint: `${API_CONFIG.endpoints.mealPlans}/${id}`,
				data: { ...body, dayIndex: parseInt(dayIndex) },
			},
			{
				method: 'put',
				endpoint: `${API_CONFIG.endpoints.mealPlans}/${id}`,
				data: { ...body, dayIndex: parseInt(dayIndex) },
			},
		];

		let lastError = null;
		let lastResponse = null;

		for (const attempt of attempts) {
			try {
				const baseUrl =
					process.env.NEXT_PUBLIC_API_URL || 'https://api.mealprep360.com';
				const fullUrl = `${baseUrl}${attempt.endpoint}`;
				console.log(`🌐 Trying ${attempt.method.toUpperCase()} ${fullUrl}`);

				const response =
					attempt.method === 'patch'
						? await serverApiClient.patch(attempt.endpoint, attempt.data)
						: await serverApiClient.put(attempt.endpoint, attempt.data);

				console.log('📦 External API response:', {
					success: response.success,
					error: response.error,
					data: response.data,
					status: response.status,
				});

				if (response.success) {
					console.log('✅ Meal plan day updated successfully via external API');
					return NextResponse.json(response.data);
				}

				// Store the last response for error handling
				lastResponse = response;
				lastError = response.error;
			} catch (error) {
				console.log(
					`❌ ${attempt.method.toUpperCase()} ${attempt.endpoint} failed:`,
					error
				);
				lastError = error;
			}
		}

		// Check if the last response was a subscription error (403)
		if (lastResponse && lastResponse.status === 403) {
			console.log('❌ Subscription error detected, returning error to user');
			return NextResponse.json(
				{
					error:
						lastResponse.error || 'This feature requires a paid subscription',
					type: 'SUBSCRIPTION_REQUIRED',
					details: 'Please upgrade your plan to access this feature.',
				},
				{ status: 403 }
			);
		}

		// Check if the last response was a not found error (404)
		if (lastResponse && lastResponse.status === 404) {
			console.log('❌ Meal plan not found in external API');
			return NextResponse.json(
				{
					error: 'Meal plan not found',
					type: 'MEAL_PLAN_NOT_FOUND',
					details: 'The requested meal plan could not be found.',
				},
				{ status: 404 }
			);
		}

		// Only fall back to local database for actual API failures (5xx errors)
		const shouldFallback =
			lastResponse && lastResponse.status && lastResponse.status >= 500;
		if (!shouldFallback) {
			console.log(
				'❌ External API failed with non-fallback error, returning error to user'
			);
			return NextResponse.json(
				{
					error: lastError || 'Failed to update meal plan day',
					type: 'EXTERNAL_API_ERROR',
					details: 'The external service returned an error.',
				},
				{ status: lastResponse?.status || 500 }
			);
		}

		// If all external API attempts failed, fall back to local database
		console.error(
			'❌ All external API attempts failed, falling back to local database'
		);

		try {
			await connectDB();

			// Find user by Clerk ID to get the ObjectId
			const user = await User.findOne({ clerkId: userId });
			if (!user) {
				return NextResponse.json({ error: 'User not found' }, { status: 404 });
			}

			// Try to find the meal plan by both _id and id fields
			let mealPlan = await MealPlan.findOne({
				_id: id,
				userId: user._id,
			});

			// If not found by _id, try by id field
			if (!mealPlan) {
				mealPlan = await MealPlan.findOne({
					id: id,
					userId: user._id,
				});
			}

			if (!mealPlan) {
				console.error('Meal plan not found with ID:', id);
				return NextResponse.json(
					{
						error:
							'Meal plan not found in local database. The external API is currently unavailable and no local backup exists.',
						type: 'EXTERNAL_API_UNAVAILABLE',
						details:
							'Please try again later when the external service is restored.',
					},
					{ status: 503 }
				);
			}

			// Update the specific day
			const dayIndexNum = parseInt(dayIndex);
			if (dayIndexNum < 0 || dayIndexNum >= mealPlan.days.length) {
				return NextResponse.json(
					{ error: 'Invalid day index' },
					{ status: 400 }
				);
			}

			// Get the existing day data to preserve required fields
			const existingDay = mealPlan.days[dayIndexNum];

			// Update the day with the provided data, preserving required fields
			const updatedDay = {
				...existingDay, // Preserve all existing fields including required ones like date
				...body, // Override with new data
			};

			// Ensure the dayIndex is preserved
			updatedDay.dayIndex = dayIndexNum;

			// Validate that required fields are present
			if (!updatedDay.date) {
				console.error('Missing required date field in updated day');
				return NextResponse.json(
					{
						error: 'Invalid meal plan data: missing required date field',
						type: 'VALIDATION_ERROR',
						details: 'The meal plan data is missing required fields.',
					},
					{ status: 400 }
				);
			}

			// Update the day in the meal plan
			mealPlan.days[dayIndexNum] = updatedDay;
			mealPlan.updatedAt = new Date();

			try {
				await mealPlan.save();
				console.log('✅ Meal plan day updated successfully via local database');
			} catch (saveError) {
				console.error('Failed to save meal plan:', saveError);
				return NextResponse.json(
					{
						error: 'Failed to save meal plan to local database',
						type: 'DATABASE_ERROR',
						details: 'The meal plan could not be saved locally.',
					},
					{ status: 500 }
				);
			}

			return NextResponse.json({
				success: true,
				message: 'Meal plan day updated successfully',
				updatedDay: updatedDay,
			});
		} catch (dbError) {
			console.error('Database fallback failed:', dbError);
			return NextResponse.json(
				{
					error:
						'Failed to update meal plan day. External API is unavailable and local database operation failed.',
					type: 'EXTERNAL_API_UNAVAILABLE',
					details:
						'Please try again later when the external service is restored.',
				},
				{ status: 503 }
			);
		}
	} catch (error) {
		console.error('❌ Error updating meal plan day:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// PUT /api/meal-plans/[id]/days/[dayIndex] - Update meal plan day (alternative method)
export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string; dayIndex: string } }
) {
	// Delegate to PATCH method
	return PATCH(request, { params });
}
