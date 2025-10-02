import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { Recipe, UserRecipe, User } from '@/lib/mongodb/schemas';
import { recipeCache, createCacheKey } from '@/lib/cache';

interface RecipeDocument {
	_id: any;
	ingredients?: string | string[];
	instructions?: string | string[];
	imageUrl?: string;
	images?: { main?: string };
	tags?: string[];
	[key: string]: any;
}

interface CachedRecipeData {
	recipes: any[];
	totalCount: number;
}

export const dynamic = 'force-dynamic';
export const maxDuration = 15; // Increase to 15 seconds for more breathing room

export async function GET(req: Request) {
	try {
		// First establish database connection
		await connectDB();

		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get the page and limit from query params, with defaults
		const url = new URL(req.url);
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '20'); // Default to 20 recipes
		const skip = (page - 1) * limit;

		// Create cache key for non-personalized recipe data
		const cacheKey = createCacheKey('recommended', { page, limit });

		// Try to get cached data
		let cachedData = recipeCache.get<CachedRecipeData>(cacheKey);
		let recommendedRecipes: any[];
		let totalCount: number;

		if (cachedData) {
			// Use cached data
			recommendedRecipes = cachedData.recipes;
			totalCount = cachedData.totalCount;
		} else {
			// Get public recipes that the user hasn't created
			recommendedRecipes = await Recipe.find(
				{
					isPublic: true,
					clerkId: { $ne: userId.toString() }, // Exclude user's own recipes
				},
				{
					title: 1,
					description: 1,
					'images.main': 1,
					imageUrl: 1,
					prepTime: 1,
					_id: 1,
				}
			)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean()
				.maxTimeMS(12000);

			// Get total count for pagination
			totalCount = await Recipe.countDocuments({
				isPublic: true,
				clerkId: { $ne: userId.toString() },
			});

			// Cache the non-personalized data for 5 minutes
			recipeCache.set(
				cacheKey,
				{ recipes: recommendedRecipes, totalCount },
				300
			);
		}

		// Get the user's database ID for saved status
		const user = await User.findOne({ clerkId: userId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Get user's saved recipes (this is personalized, so not cached)
		const userRecipeCollection = await UserRecipe.findOne({ userId: user._id });
		const savedRecipeIds =
			userRecipeCollection?.savedRecipes?.map((saved: any) =>
				saved.recipeId.toString()
			) || [];

		if (!recommendedRecipes || recommendedRecipes.length === 0) {
			return NextResponse.json(
				{
					recipes: [],
					pagination: {
						total: 0,
						page,
						limit,
						hasMore: false,
					},
				},
				{ status: 200 }
			);
		}

		// Transform the recipes to match the expected format
		const transformedRecipes = recommendedRecipes.map(
			(recipe: RecipeDocument) => ({
				id: recipe._id.toString(),
				title: recipe.title,
				description: recipe.description || '',
				prepTime: recipe.prepTime || 0,
				imageUrl: recipe.imageUrl || recipe.images?.main || '',
				saved: savedRecipeIds.includes(recipe._id.toString()), // This is already included!
			})
		);

		// Create response with cache headers
		const response = NextResponse.json({
			recipes: transformedRecipes,
			pagination: {
				total: totalCount,
				page,
				limit,
				hasMore: skip + limit < totalCount,
			},
		});

		// Set cache headers for CDN/browser caching
		// public: cacheable by CDN
		// s-maxage: CDN cache for 5 minutes
		// stale-while-revalidate: serve stale content while revalidating for 10 minutes
		response.headers.set(
			'Cache-Control',
			'public, s-maxage=300, stale-while-revalidate=600'
		);

		return response;
	} catch (error: unknown) {
		console.error('[RECOMMENDED_RECIPES_GET] Error:', error);
		if (error instanceof Error) {
			console.error('[RECOMMENDED_RECIPES_GET] Error details:', error.message);
			console.error('[RECOMMENDED_RECIPES_GET] Error stack:', error.stack);
		}
		return NextResponse.json(
			{ error: 'Failed to fetch recommended recipes' },
			{ status: 500 }
		);
	}
}
