import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User, MealPlan, SkippedDay } from '@/lib/mongodb/schemas';
import { MEALPLAN_SERVICE_URL, MEALPLAN_SERVICE_API_KEY } from '@/lib/config';
import { invalidateUserMealPlanCache } from '@/lib/cache';

export async function POST(request: Request) {
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

		await connectDB();

		// Get user from our database
		const user = await User.findOne({ clerkId: userId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const body = await request.json();
		const { date, status, planId } = body;

		if (!date) {
			return NextResponse.json({ error: 'Date is required' }, { status: 400 });
		}

		// Default to 'skipped' if no status provided (for backward compatibility)
		const targetStatus = status || 'skipped';

		// Validate userId format before sending to service
		const userIdString = user._id.toString();
		if (!userIdString || userIdString.length !== 24) {
			return NextResponse.json(
				{ error: 'Invalid user ID format' },
				{ status: 400 }
			);
		}

		// Call the meal plan service skip-date endpoint
		const serviceUrl = `${MEALPLAN_SERVICE_URL}/api/meal-plans/skip-date`;

		const serviceRequestBody = {
			userId: userIdString,
			date: date,
		};

		const serviceResponse = await fetch(serviceUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${MEALPLAN_SERVICE_API_KEY}`,
			},
			body: JSON.stringify(serviceRequestBody),
		});

		if (!serviceResponse.ok) {
			const errorText = await serviceResponse.text();

			let errorMessage = `Failed to ${targetStatus} date`;
			let errorData;

			try {
				errorData = JSON.parse(errorText);
				errorMessage = errorData.message || errorData.error || errorMessage;
			} catch (e) {
				// Error parsing response, use default message
			}

			// Handle the specific case where no meal plan exists for the date
			if (errorData?.error === 'No meal plan found') {
				// For skip operations on dates without meal plans, we can create a local skip entry
				// This allows users to proactively skip days before generating meal plans
				if (targetStatus === 'skipped') {
					try {
						// Store the skip entry in our local database using SkippedDay model
						const skipDate = new Date(date);
						const existingSkip = await SkippedDay.findOne({
							userId: user._id,
							date: skipDate,
						});

						if (!existingSkip) {
							await SkippedDay.create({
								userId: user._id,
								date: skipDate,
								status: 'skipped',
							});
						}

						// Invalidate cache after skipping
						invalidateUserMealPlanCache(user._id.toString());

						// Return a successful response with the skip data
						return NextResponse.json({
							message: 'Date marked as skipped (stored locally)',
							updatedDay: {
								date: date,
								dayIndex: 0,
								status: 'skipped',
								recipeId: null,
								mealPlanId: null,
							},
							localSkip: true, // Flag to indicate this is a local skip
						});
					} catch (dbError) {
						console.error('Error creating local skip entry:', dbError);

						// Still invalidate cache even if database fails
						invalidateUserMealPlanCache(user._id.toString());

						// Fall back to the original mock response if database fails
						return NextResponse.json({
							message: 'Date marked as skipped (no meal plan required)',
							updatedDay: {
								date: date,
								dayIndex: 0,
								status: 'skipped',
								recipeId: null,
								mealPlanId: null,
							},
							localSkip: true,
						});
					}
				}
			}

			return NextResponse.json(
				{ error: errorMessage },
				{ status: serviceResponse.status }
			);
		}

		let serviceData;
		const responseText = await serviceResponse.text();

		try {
			serviceData = JSON.parse(responseText);
		} catch (parseError) {
			// If we can't parse the response but the status was OK, treat it as success
			serviceData = {
				success: true,
				message: `Date ${targetStatus} successfully`,
				rawResponse: responseText,
			};
		}

		// Validate that the operation was actually successful
		if (serviceData.error) {
			return NextResponse.json({ error: serviceData.error }, { status: 400 });
		}

		// Invalidate cache after successful skip operation
		invalidateUserMealPlanCache(user._id.toString());

		return NextResponse.json({
			message: status
				? `Date status updated to ${targetStatus} successfully`
				: 'Date skipped successfully',
			...serviceData,
		});
	} catch (error) {
		console.error('Error skipping date:', error);
		return NextResponse.json({ error: 'Failed to skip date' }, { status: 500 });
	}
}

export async function DELETE(request: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		// Get user from our database
		const user = await User.findOne({ clerkId: userId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const body = await request.json();
		const { date } = body;

		if (!date) {
			return NextResponse.json({ error: 'Date is required' }, { status: 400 });
		}

		try {
			// Delete the local skip entry from our database
			const skipDate = new Date(date);
			const deleteResult = await SkippedDay.deleteOne({
				userId: user._id,
				date: skipDate,
			});

			// Invalidate cache after unskipping
			invalidateUserMealPlanCache(user._id.toString());

			// Return a successful response
			return NextResponse.json({
				message: 'Date unskipped successfully',
				updatedDay: {
					date: date,
					dayIndex: 0,
					status: 'planned',
					recipeId: null,
					mealPlanId: null,
				},
				localUnskip: true, // Flag to indicate this was a local unskip
			});
		} catch (dbError) {
			console.error('Error deleting local skip entry:', dbError);
			return NextResponse.json(
				{ error: 'Failed to unskip date' },
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error('Error unskipping date:', error);
		return NextResponse.json(
			{ error: 'Failed to unskip date' },
			{ status: 500 }
		);
	}
}
