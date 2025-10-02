import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { Recipe, UserRecipe, User } from '@/lib/mongodb/schemas';
import { recipeCache, createCacheKey } from '@/lib/cache';

export async function GET(req: Request) {
	try {
		// First establish database connection
		await connectDB();

		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get the user's database ID
		const user = await User.findOne({ clerkId: userId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Prefetch first 3 pages of recommended recipes
		const pagesToPrefetch = [1, 2, 3];
		const limit = 20;

		// Get user's saved recipes once
		const userRecipeCollection = await UserRecipe.findOne({ userId: user._id });
		const savedRecipeIds =
			userRecipeCollection?.savedRecipes?.map((saved: any) =>
				saved.recipeId.toString()
			) || [];

		const prefetchPromises = pagesToPrefetch.map(async (page) => {
			const cacheKey = createCacheKey('recommended', { page, limit });

			// Check if already cached
			const cached = recipeCache.get(cacheKey);
			if (cached) {
				return { page, status: 'already_cached' };
			}

			const skip = (page - 1) * limit;

			// Get public recipes
			const recommendedRecipes = await Recipe.find(
				{
					isPublic: true,
					clerkId: { $ne: userId.toString() },
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
				.lean();

			// Get total count
			const totalCount = await Recipe.countDocuments({
				isPublic: true,
				clerkId: { $ne: userId.toString() },
			});

			// Cache the data
			recipeCache.set(
				cacheKey,
				{ recipes: recommendedRecipes, totalCount },
				300
			);

			return { page, status: 'cached' };
		});

		const results = await Promise.all(prefetchPromises);

		return NextResponse.json({
			message: 'Prefetch complete',
			results,
		});
	} catch (error: unknown) {
		console.error('[RECOMMENDED_RECIPES_PREFETCH] Error:', error);
		return NextResponse.json(
			{ error: 'Failed to prefetch recommended recipes' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
export const maxDuration = 15;
