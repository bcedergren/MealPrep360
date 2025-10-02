import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { User, UserRecipe, MealPlan } from '@/lib/mongodb/schemas';
import connectDB from '@/lib/mongodb/connection';
import { MEALPLAN_SERVICE_URL, MEALPLAN_SERVICE_API_KEY } from '@/lib/config';
import { invalidateUserMealPlanCache } from '@/lib/cache';
import { SubscriptionPlan, PLAN_FEATURES } from '@/types/subscription';

function getMealPlanDurationLimit(plan: SubscriptionPlan): number {
	const feature = PLAN_FEATURES[plan]['Meal Plans'];
	if (feature === 'Unlimited') return -1; // -1 means unlimited
	if (typeof feature === 'string') {
		// Extract number from strings like "1 Week", "2 Weeks", "4 Weeks"
		const match = feature.match(/(\d+)\s*Week/i);
		if (match) {
			return parseInt(match[1]) * 7; // Convert weeks to days
		}
		return 0;
	}
	if (typeof feature === 'number') return feature;
	return 0; // Default to 0 if no access
}

export async function POST(request: Request) {
	try {
		await connectDB();
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const user = await User.findOne({ clerkId: userId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const body = await request.json();
		const { startDate, duration, skippedDays, overwrite } = body;

		console.log('[MEAL_PLANS_GENERATE] Request received:', {
			userId: user._id,
			startDate,
			duration,
			skippedDays,
			overwrite,
		});

		// Check subscription limits for meal plan duration
		const currentPlan: SubscriptionPlan = user.subscription?.plan || 'FREE';
		const durationLimit = getMealPlanDurationLimit(currentPlan);

		if (durationLimit !== -1 && duration > durationLimit) {
			const limitInWeeks = Math.floor(durationLimit / 7);
			const requestedWeeks = Math.ceil(duration / 7);

			return NextResponse.json(
				{
					error: `Your ${currentPlan} plan allows meal plans up to ${limitInWeeks} week${
						limitInWeeks !== 1 ? 's' : ''
					} (${durationLimit} days). You requested ${requestedWeeks} week${
						requestedWeeks !== 1 ? 's' : ''
					} (${duration} days). Please upgrade your plan for longer meal plans.`,
					type: 'SUBSCRIPTION_LIMIT_EXCEEDED',
					currentLimit: durationLimit,
					requestedDuration: duration,
					plan: currentPlan,
				},
				{ status: 403 }
			);
		}

		// Get user's saved recipes
		const userRecipe = await UserRecipe.findOne({ userId: user._id }).populate(
			'savedRecipes.recipeId'
		);

		const recipes =
			userRecipe?.savedRecipes
				?.map((saved: any) => saved.recipeId)
				.filter(Boolean) || [];

		console.log('[MEAL_PLANS_GENERATE] Found recipes:', recipes.length);

		if (recipes.length === 0) {
			return NextResponse.json(
				{ error: 'No saved recipes found. Please save some recipes first.' },
				{ status: 400 }
			);
		}

		// Convert skippedDays array to boolean array based on duration
		// skippedDays comes as an array of date strings, we need to convert to boolean array
		const skippedDaysBoolean = [];
		const start = new Date(startDate);

		for (let i = 0; i < duration; i++) {
			const currentDate = new Date(start);
			currentDate.setDate(start.getDate() + i);
			const dateString = currentDate.toISOString().split('T')[0];
			skippedDaysBoolean.push(skippedDays.includes(dateString));
		}

		console.log('[MEAL_PLANS_GENERATE] Calling meal plan service:', {
			url: `${MEALPLAN_SERVICE_URL}/api/meal-plans`,
			userId: user._id,
			startDate,
			duration,
			skippedDaysBoolean,
			hasApiKey: !!MEALPLAN_SERVICE_API_KEY,
		});

		// Call the meal plan service using the correct endpoint and format
		const serviceResponse = await fetch(
			`${MEALPLAN_SERVICE_URL}/api/meal-plans`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(MEALPLAN_SERVICE_API_KEY && {
						Authorization: `Bearer ${MEALPLAN_SERVICE_API_KEY}`,
					}),
				},
				body: JSON.stringify({
					userId: user._id.toString(),
					startDate,
					duration,
					skippedDays: skippedDaysBoolean, // Boolean array as per API docs
				}),
			}
		);

		console.log('[MEAL_PLANS_GENERATE] Service response:', {
			status: serviceResponse.status,
			statusText: serviceResponse.statusText,
		});

		// Handle the response
		if (!serviceResponse.ok) {
			const errorText = await serviceResponse.text();
			let parsedError: any = null;
			try {
				parsedError = JSON.parse(errorText);
			} catch {}

			console.error('[MEAL_PLANS_GENERATE] Service error:', {
				status: serviceResponse.status,
				statusText: serviceResponse.statusText,
				error: errorText,
				parsedCode: parsedError?.code,
			});

			// Handle conflict (existing meal plan)
			if (serviceResponse.status === 409) {
				return NextResponse.json(
					{
						error: 'Meal plan already exists for this date range',
						requiresOverwrite: true,
					},
					{ status: 409 }
				);
			}

			// If external service reports no recipes, fall back to local generation
			const errorTextLower = errorText.toLowerCase();
			const containsNoRecipesText = /no recipes/.test(errorTextLower);
			const parsedIndicatesNoRecipes =
				parsedError &&
				((typeof parsedError.error === 'string' &&
					/no recipes/i.test(parsedError.error)) ||
					(typeof parsedError.message === 'string' &&
						/no recipes/i.test(parsedError.message)) ||
					parsedError.code === 'NO_RECIPES');

			if (
				serviceResponse.status === 400 &&
				(containsNoRecipesText || parsedIndicatesNoRecipes)
			) {
				console.log(
					'[MEAL_PLANS_GENERATE] Service reported no recipes. Falling back to local generation.'
				);
				return await generateMealPlanLocally(
					user,
					startDate,
					duration,
					skippedDays,
					overwrite,
					recipes
				);
			}

			// If service is unavailable, fall back to local generation
			if (serviceResponse.status >= 500) {
				console.log(
					'[MEAL_PLANS_GENERATE] Service unavailable, falling back to local generation'
				);
				return await generateMealPlanLocally(
					user,
					startDate,
					duration,
					skippedDays,
					overwrite,
					recipes
				);
			}

			throw new Error(`Meal plan service error: ${serviceResponse.statusText}`);
		}

		// Parse response
		const data = await serviceResponse.json();

		console.log('[MEAL_PLANS_GENERATE] Service response data:', {
			hasData: !!data,
			dataKeys: data ? Object.keys(data) : [],
			daysCount: data?.days?.length,
		});

		// Ensure all non-skipped days have a recipe by filling from user's saved recipes (duplicates allowed)
		try {
			const start = new Date(startDate);
			const finalDays: any[] = [];
			for (let i = 0; i < duration; i++) {
				const currentDate = new Date(start);
				currentDate.setDate(start.getDate() + i);
				const dateString = currentDate.toISOString().split('T')[0];

				const isSkipped = skippedDays.includes(dateString);
				const existingDay = Array.isArray(data?.days)
					? data.days[i]
					: undefined;

				if (isSkipped) {
					finalDays.push({ recipeId: null, status: 'skipped' });
					continue;
				}

				if (existingDay && existingDay.recipeId) {
					finalDays.push({
						recipeId: existingDay.recipeId,
						status: existingDay.status || 'planned',
					});
					continue;
				}

				// Assign a recipe from saved list (allow duplicates)
				const randomRecipe =
					recipes[Math.floor(Math.random() * recipes.length)];
				finalDays.push({
					recipeId: randomRecipe._id.toString(),
					status: 'planned',
				});
			}

			// Update response data to ensure completeness
			const adjustedEndDate = new Date(start);
			adjustedEndDate.setDate(start.getDate() + duration - 1);
			data.days = finalDays;
			data.endDate = adjustedEndDate.toISOString();
			console.log('[MEAL_PLANS_GENERATE] Adjusted days to use saved recipes:', {
				daysCount: data.days.length,
			});
		} catch (adjustError) {
			console.warn(
				'[MEAL_PLANS_GENERATE] Failed to adjust days with saved recipes:',
				adjustError
			);
		}

		// Store the meal plan locally for easier updates
		try {
			if (data.id && data.days && data.days.length > 0) {
				console.log(
					'[MEAL_PLANS_GENERATE] Storing meal plan locally for easier access'
				);

				// Convert the external service format to local database format
				const localMealPlan = new MealPlan({
					id: data.id, // Use the external service ID as the id field
					userId: user._id,
					startDate: new Date(data.startDate),
					endDate: new Date(data.endDate),
					days: data.days.map((day: any, index: number) => ({
						date: new Date(
							new Date(data.startDate).getTime() + index * 24 * 60 * 60 * 1000
						),
						recipeId: day.recipeId,
						status: day.status || 'planned',
						mealType: 'dinner',
						dayIndex: index,
					})),
					recipeItems: data.days
						.filter((day: any) => day.recipeId && day.status !== 'skipped') // Only include days with recipes
						.map((day: any, index: number) => ({
							date: new Date(
								new Date(data.startDate).getTime() + index * 24 * 60 * 60 * 1000
							),
							recipeId: day.recipeId, // MongoDB will handle ObjectId conversion
							userId: user._id, // Add required userId for each recipe item
							servings: 4,
							status: day.status || 'planned',
							mealType: 'dinner',
							dayIndex: index,
						})),
					createdAt: new Date(),
					updatedAt: new Date(),
				});

				await localMealPlan.save();
				console.log(
					'[MEAL_PLANS_GENERATE] Meal plan stored locally successfully'
				);
			}
		} catch (localStorageError: any) {
			console.error(
				'[MEAL_PLANS_GENERATE] Failed to store locally, but external service succeeded:',
				localStorageError
			);
			// Log additional details for debugging
			if (localStorageError.errors) {
				console.error('[MEAL_PLANS_GENERATE] Validation errors:', {
					errors: Object.keys(localStorageError.errors).map((key) => ({
						field: key,
						message: localStorageError.errors[key].message,
						value: localStorageError.errors[key].value,
					})),
				});
			}
			// Don't fail the request if local storage fails, since external service succeeded
		}

		// Invalidate cache
		invalidateUserMealPlanCache(user._id.toString());

		return NextResponse.json(data);
	} catch (error) {
		console.error('[MEAL_PLANS_GENERATE] Error:', error);

		// If there's a network error or service is down, try local generation
		if (
			error instanceof Error &&
			(error.message.includes('fetch failed') ||
				error.message.includes('ECONNREFUSED'))
		) {
			console.log(
				'[MEAL_PLANS_GENERATE] Network error, falling back to local generation'
			);
			try {
				const { userId: fallbackUserId } = await auth();
				if (!fallbackUserId) {
					throw new Error('No user ID in fallback');
				}

				const userForFallback = await User.findOne({ clerkId: fallbackUserId });
				if (!userForFallback) {
					throw new Error('User not found in fallback');
				}

				const body = await request.json();
				const { startDate, duration, skippedDays, overwrite } = body;

				const userRecipe = await UserRecipe.findOne({
					userId: userForFallback._id,
				}).populate('savedRecipes.recipeId');
				const recipes =
					userRecipe?.savedRecipes
						?.map((saved: any) => saved.recipeId)
						.filter(Boolean) || [];

				return await generateMealPlanLocally(
					userForFallback,
					startDate,
					duration,
					skippedDays,
					overwrite,
					recipes
				);
			} catch (fallbackError) {
				console.error(
					'[MEAL_PLANS_GENERATE] Fallback also failed:',
					fallbackError
				);
			}
		}

		return NextResponse.json(
			{ error: 'Failed to generate meal plan' },
			{ status: 500 }
		);
	}
}

// Local fallback function
async function generateMealPlanLocally(
	user: any,
	startDate: string,
	duration: number,
	skippedDays: string[],
	overwrite: boolean,
	recipes: any[]
) {
	console.log('[MEAL_PLANS_GENERATE] Generating meal plan locally');

	if (recipes.length === 0) {
		return NextResponse.json(
			{ error: 'No saved recipes found. Please save some recipes first.' },
			{ status: 400 }
		);
	}

	// Generate days array
	const days = [];
	const start = new Date(startDate);

	for (let i = 0; i < duration; i++) {
		const currentDate = new Date(start);
		currentDate.setDate(start.getDate() + i);
		const dateString = currentDate.toISOString().split('T')[0];

		if (skippedDays.includes(dateString)) {
			days.push({
				recipeId: null,
				status: 'skipped',
			});
		} else {
			// Randomly select a recipe
			const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
			days.push({
				recipeId: randomRecipe._id.toString(),
				status: 'planned',
			});
		}
	}

	// Calculate end date
	const endDate = new Date(start);
	endDate.setDate(start.getDate() + duration - 1);

	const mealPlan = {
		id: new Date().getTime().toString(), // Temporary ID
		userId: user._id.toString(),
		startDate,
		endDate: endDate.toISOString(),
		days,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	console.log('[MEAL_PLANS_GENERATE] Local meal plan generated:', {
		daysCount: days.length,
		skippedDaysCount: days.filter((d) => d.status === 'skipped').length,
	});

	return NextResponse.json(mealPlan);
}
