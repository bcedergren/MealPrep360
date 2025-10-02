import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { User, MealPlan, Recipe, SkippedDay } from '@/lib/mongodb/schemas';
import connectDB from '@/lib/mongodb/connection';
import { mealPlanCache, createCacheKey } from '@/lib/cache';

interface OptimizedMealPlanResponse {
	mealPlans: any[];
	skippedDays: string[];
}

export async function GET(request: Request) {
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

		const { searchParams } = new URL(request.url);
		const startDate = searchParams.get('startDate');
		const endDate = searchParams.get('endDate');

		if (!startDate || !endDate) {
			return NextResponse.json(
				{ error: 'Start date and end date are required' },
				{ status: 400 }
			);
		}

		// Create cache key
		const cacheKey = createCacheKey('optimized-meal-plans', {
			userId: user._id.toString(),
			startDate,
			endDate,
		});

		// Check cache first
		const cachedData = mealPlanCache.get<OptimizedMealPlanResponse>(cacheKey);
		if (cachedData) {
			const response = NextResponse.json(cachedData);
			response.headers.set('X-Cache', 'HIT');
			response.headers.set(
				'Cache-Control',
				'private, s-maxage=120, stale-while-revalidate=300'
			);
			return response;
		}

		// Parallel fetch meal plans and skipped days
		const [mealPlans, skippedDays] = await Promise.all([
			// Fetch meal plans
			MealPlan.find({
				userId: user._id,
				$or: [
					{
						startDate: {
							$gte: new Date(startDate),
							$lte: new Date(endDate),
						},
					},
					{
						endDate: {
							$gte: new Date(startDate),
							$lte: new Date(endDate),
						},
					},
					{
						startDate: { $lte: new Date(startDate) },
						endDate: { $gte: new Date(endDate) },
					},
				],
			})
				.populate({
					path: 'days.recipeId',
					model: Recipe,
					select: 'title imageUrl prepTime servings cookTime',
				})
				.populate({
					path: 'recipeItems.recipeId',
					model: Recipe,
					select: 'title imageUrl prepTime servings cookTime',
				})
				.lean(), // Use lean() for better performance

			// Fetch skipped days
			SkippedDay.find({
				userId: user._id,
				date: {
					$gte: new Date(startDate),
					$lte: new Date(endDate),
				},
			}).lean(),
		]);

		// Transform meal plans
		const transformedPlans = mealPlans.map((plan: any) => {
			// Start with recipeItems as the base
			let items: any[] = [];

			if (plan.recipeItems && plan.recipeItems.length > 0) {
				items = [...plan.recipeItems];
			}

			// Add any days that don't already exist in recipeItems
			if (plan.days && plan.days.length > 0) {
				plan.days.forEach((dayItem: any) => {
					try {
						const dayDate = new Date(dayItem.date);
						if (isNaN(dayDate.getTime())) {
							console.error('Invalid date in day:', dayItem.date);
							return;
						}

						const dayDateKey = dayDate.toISOString().split('T')[0];

						// Check if this date already exists in recipeItems
						const existingItemIndex = items.findIndex((item: any) => {
							try {
								const itemDate = new Date(item.date);
								if (isNaN(itemDate.getTime())) return false;
								return itemDate.toISOString().split('T')[0] === dayDateKey;
							} catch {
								return false;
							}
						});

						if (existingItemIndex >= 0) {
							// Replace the existing item with the day item (days take precedence)
							items[existingItemIndex] = dayItem;
						} else {
							// Add new day item
							items.push(dayItem);
						}
					} catch (error) {
						console.error('Error processing day:', dayItem, error);
					}
				});
			}

			// Sort items by date
			items.sort((a, b) => {
				try {
					return new Date(a.date).getTime() - new Date(b.date).getTime();
				} catch {
					return 0;
				}
			});

			const days = items.map((item: any, i: number) => {
				let date;
				try {
					date = new Date(item.date);
					if (isNaN(date.getTime())) {
						date = new Date(plan.startDate);
						date.setDate(date.getDate() + i);
					}
				} catch {
					date = new Date(plan.startDate);
					date.setDate(date.getDate() + i);
				}

				// Calculate the correct dayIndex
				const planStartDate = new Date(plan.startDate);
				planStartDate.setHours(0, 0, 0, 0);
				const itemDate = new Date(date);
				itemDate.setHours(0, 0, 0, 0);
				const dayIndex = Math.floor(
					(itemDate.getTime() - planStartDate.getTime()) / (24 * 60 * 60 * 1000)
				);

				let recipe = null;
				if (item.recipeId && typeof item.recipeId === 'object') {
					recipe = {
						id: item.recipeId._id.toString(),
						title: item.recipeId.title || 'Untitled Recipe',
						imageUrl: item.recipeId.imageUrl || null,
						prepTime: item.recipeId.prepTime || 0,
						cookTime: item.recipeId.cookTime || 0,
						servings: item.recipeId.servings || 4,
					};
				}

				return {
					date,
					recipeId: item.recipeId?._id?.toString() || item.recipeId || null,
					recipe,
					mealType: item.mealType || 'dinner',
					status: item.status || 'planned',
					dayIndex: dayIndex >= 0 ? dayIndex : i,
				};
			});

			return {
				_id: plan._id.toString(),
				id: plan.id,
				startDate: plan.startDate,
				endDate: plan.endDate,
				days,
				userId: plan.userId.toString(),
				createdAt: plan.createdAt,
				updatedAt: plan.updatedAt,
			};
		});

		// Transform skipped days to array of date strings
		const skippedDaysArray = skippedDays.map(
			(skip: any) => new Date(skip.date).toISOString().split('T')[0]
		);

		const responseData: OptimizedMealPlanResponse = {
			mealPlans: transformedPlans,
			skippedDays: skippedDaysArray,
		};

		// Cache for 2 minutes
		mealPlanCache.set(cacheKey, responseData, 120);

		const response = NextResponse.json(responseData);
		response.headers.set('X-Cache', 'MISS');
		response.headers.set(
			'Cache-Control',
			'private, s-maxage=120, stale-while-revalidate=300'
		);

		return response;
	} catch (error) {
		console.error('Error fetching optimized meal plans:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch meal plans' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
export const maxDuration = 15;
