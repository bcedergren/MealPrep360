import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { addDays, format } from 'date-fns';
import { User, MealPlan, Recipe } from '@/lib/mongodb/schemas';
import connectDB from '@/lib/mongodb/connection';
import { MEALPLAN_SERVICE_URL, MEALPLAN_SERVICE_API_KEY } from '@/lib/config';
import { Document } from 'mongoose';
import {
	mealPlanCache,
	createCacheKey,
	invalidateUserMealPlanCache,
} from '@/lib/cache';

interface RecipeDocument extends Document {
	_id: string;
	title: string;
	description?: string;
	imageUrl?: string;
}

interface MealPlanDocument extends Document {
	_id: string;
	date: Date;
	recipeItems: Array<{
		date: Date;
		recipeId: RecipeDocument | null;
		userId: string;
		servings: number;
		status: string;
		mealType: string;
		dayIndex: number;
	}>;
	userId: string;
	createdAt: Date;
	updatedAt: Date;
}

export async function GET(request: Request) {
	try {
		await connectDB();

		const { userId } = await auth();
		console.log('Fetching meals for user:', userId);

		if (!userId) {
			console.log('No userId found');
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get or create the user in our database
		let user = await User.findOne({ clerkId: userId });
		if (!user) {
			user = await User.create({ clerkId: userId, email: '', name: '' });
		}

		// Get query parameters
		const { searchParams } = new URL(request.url);
		const startDate = searchParams.get('startDate');
		const endDate = searchParams.get('endDate');

		if (!startDate || !endDate) {
			return NextResponse.json(
				{ error: 'startDate and endDate are required' },
				{ status: 400 }
			);
		}

		// Create cache key
		const cacheKey = createCacheKey('planned-meals', {
			userId: user._id.toString(),
			startDate,
			endDate,
		});

		// Check cache first
		const cachedData = mealPlanCache.get(cacheKey);
		if (cachedData) {
			console.log('Returning cached planned meals');
			return NextResponse.json(cachedData);
		}

		// Convert to Date objects and set to start/end of day
		const start = new Date(startDate);
		start.setHours(0, 0, 0, 0);
		const end = new Date(endDate);
		end.setHours(23, 59, 59, 999);

		// Find meal plans within the date range
		const mealPlans = await MealPlan.find({
			userId: user._id,
			startDate: { $lte: end },
			endDate: { $gte: start },
		})
			// .populate('recipeItems.recipeId') // Remove or update if not needed
			.sort({ startDate: 1 });

		console.log('Found planned meals:', JSON.stringify(mealPlans, null, 2));

		if (!mealPlans || mealPlans.length === 0) {
			console.log('No planned meals found');
			// Still cache empty results to avoid repeated database queries
			mealPlanCache.set(cacheKey, [], 120);
			return NextResponse.json([]);
		}

		// Transform the data to match the expected structure
		const transformedPlans = mealPlans.map((plan: MealPlanDocument) => ({
			_id: plan._id,
			id: plan._id,
			startDate: plan.recipeItems[0]?.date || new Date(),
			endDate:
				plan.recipeItems[plan.recipeItems.length - 1]?.date || new Date(),
			days: plan.recipeItems.map((item) => ({
				date: item.date,
				recipeId: item.recipeId?._id,
				recipe: item.recipeId
					? {
							id: item.recipeId._id,
							title: item.recipeId.title || 'Untitled Recipe',
							description: item.recipeId.description || '',
							mealType: item.mealType,
							imageUrl: item.recipeId.imageUrl,
					  }
					: null,
				mealType: item.mealType,
				status: item.status.toLowerCase(),
				dayIndex: item.dayIndex,
			})),
			userId: plan.userId,
			createdAt: plan.createdAt,
			updatedAt: plan.updatedAt,
		}));

		// Cache for 2 minutes
		mealPlanCache.set(cacheKey, transformedPlans, 120);

		const response = NextResponse.json(transformedPlans);

		// Set cache headers for CDN/browser caching
		// Private because meal plans are user-specific
		response.headers.set(
			'Cache-Control',
			'private, s-maxage=120, stale-while-revalidate=300'
		);

		return response;
	} catch (error) {
		console.error('Detailed error:', error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : 'Internal Server Error',
			},
			{ status: 500 }
		);
	}
}

async function cleanupDuplicateMeals(
	userId: string,
	startDate: Date,
	endDate: Date
) {
	console.log('Cleaning up duplicate meals for date range:', {
		startDate: format(startDate, 'yyyy-MM-dd'),
		endDate: format(endDate, 'yyyy-MM-dd'),
	});

	// Get all meal plans for the date range
	const mealPlans = await MealPlan.find({
		userId,
		date: { $gte: startDate, $lte: endDate },
	}).sort({ date: 1 });

	console.log('Found', mealPlans.length, 'meal plans to check for duplicates');

	// Group meals by date
	const mealsByDate = new Map<string, MealPlanDocument[]>();
	mealPlans.forEach((plan: MealPlanDocument) => {
		const dateKey = format(plan.date, 'yyyy-MM-dd');
		if (!mealsByDate.has(dateKey)) {
			mealsByDate.set(dateKey, []);
		}
		mealsByDate.get(dateKey)?.push(plan);
	});

	// Delete duplicate meals, keeping only the most recent one for each date
	for (const [date, plans] of mealsByDate.entries()) {
		if (plans.length > 1) {
			// Sort by creation date, newest first
			const sortedPlans = [...plans].sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			);

			// Keep the newest plan, delete the rest
			const plansToDelete = sortedPlans.slice(1);

			await MealPlan.deleteMany({
				_id: { $in: plansToDelete.map((p) => p._id) },
			});
		}
	}
}

export async function POST(request: Request) {
	try {
		const { userId: clerkId } = await auth();
		if (!clerkId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		// Get user from our database
		const user = await User.findOne({ clerkId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const body = await request.json();
		const { recipes } = body;

		if (!Array.isArray(recipes)) {
			return NextResponse.json(
				{ error: 'Invalid request body' },
				{ status: 400 }
			);
		}

		// Validate recipes
		const validRecipes = recipes.filter((recipe: any) => {
			return (
				recipe.date && recipe.recipeId && typeof recipe.servings === 'number'
			);
		});

		if (validRecipes.length === 0) {
			return NextResponse.json(
				{ error: 'No valid recipes provided' },
				{ status: 400 }
			);
		}

		// Forward the request to the meal plan service
		const response = await fetch(`${MEALPLAN_SERVICE_URL}/api/meal-plans`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${MEALPLAN_SERVICE_API_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				userId: user._id.toString(),
				recipes: validRecipes,
			}),
		});

		if (!response.ok) {
			const error = await response.json();
			return NextResponse.json(error, { status: response.status });
		}

		const mealPlans = await response.json();

		// Cache the meal plans in our database
		for (const mealPlan of mealPlans) {
			await MealPlan.findOneAndUpdate(
				{ _id: mealPlan._id },
				{ ...mealPlan, userId: user._id },
				{ upsert: true }
			);
		}

		// Invalidate cache after creating meal plans
		invalidateUserMealPlanCache(user._id.toString());

		return NextResponse.json(mealPlans);
	} catch (error) {
		console.error('Error creating meal plans:', error);
		return NextResponse.json(
			{ error: 'Failed to create meal plans' },
			{ status: 500 }
		);
	}
}
