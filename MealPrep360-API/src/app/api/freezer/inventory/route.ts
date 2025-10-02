import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User, MealPlan } from '@/lib/mongodb/schemas';
import {
	freezerCache,
	createCacheKey,
	invalidateUserFreezerCache,
} from '@/lib/cache';
import { SubscriptionPlan, PLAN_FEATURES } from '@/types/subscription';

function getFreezerLimit(plan: SubscriptionPlan): number {
	const feature = PLAN_FEATURES[plan]['Freezer Inventory'];
	if (feature === 'Unlimited') return -1; // -1 means unlimited
	if (feature === false) return 0; // No access
	if (typeof feature === 'string') {
		const match = feature.match(/(\d+)\s*Items?/i);
		if (match) {
			return parseInt(match[1]);
		}
		return 0;
	}
	if (typeof feature === 'number') return feature;
	return 0; // Default to 0 if no access
}

export async function GET() {
	try {
		const { userId: clerkId } = await auth();
		if (!clerkId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		// Get user from database
		const user = await User.findOne({ clerkId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Check subscription access to freezer inventory
		const currentPlan: SubscriptionPlan = user.subscription?.plan || 'FREE';
		const freezerLimit = getFreezerLimit(currentPlan);

		if (freezerLimit === 0) {
			return NextResponse.json(
				{
					error: `Freezer inventory is not available on the ${currentPlan} plan. Please upgrade to access this feature.`,
					type: 'FEATURE_NOT_AVAILABLE',
					plan: currentPlan,
				},
				{ status: 403 }
			);
		}

		// Check cache first
		const cacheKey = createCacheKey('freezer-inventory', {
			userId: user._id.toString(),
		});
		const cached = freezerCache.get(cacheKey) as any;
		if (cached) {
			const response = NextResponse.json({
				...cached,
				usage: {
					current: cached.total || 0,
					limit: freezerLimit === -1 ? 'unlimited' : freezerLimit,
					remaining:
						freezerLimit === -1
							? 'unlimited'
							: Math.max(0, freezerLimit - (cached.total || 0)),
				},
			});
			response.headers.set('X-Cache', 'HIT');
			response.headers.set(
				'Cache-Control',
				'private, s-maxage=300, stale-while-revalidate=600'
			);
			return response;
		}

		// Use aggregation pipeline for efficient querying
		const frozenMeals = await MealPlan.aggregate([
			// Match user's meal plans
			{ $match: { userId: user._id } },

			// Unwind recipe items
			{ $unwind: '$recipeItems' },

			// Filter only frozen items
			{ $match: { 'recipeItems.status': 'frozen' } },

			// Lookup recipe details
			{
				$lookup: {
					from: 'recipes',
					localField: 'recipeItems.recipeId',
					foreignField: '_id',
					as: 'recipe',
					pipeline: [
						{ $project: { title: 1, imageUrl: 1, servings: 1, prepTime: 1 } },
					],
				},
			},

			// Unwind recipe array
			{ $unwind: { path: '$recipe', preserveNullAndEmptyArrays: true } },

			// Group by recipe to aggregate quantities
			{
				$group: {
					_id: '$recipeItems.recipeId',
					recipe: { $first: '$recipe' },
					totalServings: { $sum: '$recipeItems.servings' },
					frozenDate: { $min: '$recipeItems.date' },
					instances: { $sum: 1 },
					mealPlanIds: { $addToSet: '$_id' },
				},
			},

			// Sort by frozen date (oldest first)
			{ $sort: { frozenDate: 1 } },

			// Format the output
			{
				$project: {
					_id: 0,
					recipeId: '$_id',
					recipe: 1,
					totalServings: 1,
					frozenDate: 1,
					instances: 1,
					daysFrozen: {
						$divide: [
							{ $subtract: [new Date(), '$frozenDate'] },
							1000 * 60 * 60 * 24,
						],
					},
				},
			},
		]);

		const inventoryData = {
			items: frozenMeals,
			total: frozenMeals.length,
			totalServings: frozenMeals.reduce(
				(sum, item) => sum + item.totalServings,
				0
			),
		};

		// Cache for 5 minutes
		freezerCache.set(cacheKey, inventoryData, 300);

		const response = NextResponse.json({
			...inventoryData,
			usage: {
				current: inventoryData.total,
				limit: freezerLimit === -1 ? 'unlimited' : freezerLimit,
				remaining:
					freezerLimit === -1
						? 'unlimited'
						: Math.max(0, freezerLimit - inventoryData.total),
			},
		});

		response.headers.set('X-Cache', 'MISS');
		response.headers.set(
			'Cache-Control',
			'private, s-maxage=300, stale-while-revalidate=600'
		);

		return response;
	} catch (error) {
		console.error('[FREEZER_INVENTORY] Error:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch freezer inventory' },
			{ status: 500 }
		);
	}
}

// When meal status changes to/from frozen, invalidate the cache
export async function POST(request: Request) {
	try {
		const { userId: clerkId } = await auth();
		if (!clerkId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const user = await User.findOne({ clerkId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Invalidate freezer cache when status changes
		invalidateUserFreezerCache(user._id.toString());

		return NextResponse.json({ message: 'Cache invalidated' });
	} catch (error) {
		console.error('[FREEZER_INVENTORY_INVALIDATE] Error:', error);
		return NextResponse.json(
			{ error: 'Failed to invalidate cache' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
export const maxDuration = 15;
