import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/connection';
import { User, Recipe, UserRecipe } from '@/lib/mongodb/schemas';
import { EXCLUDED_TAGS } from '@/lib/constants/tags';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RecipeWithTags {
	_id: string;
	tags?: string[];
	title: string;
}

interface SavedRecipe {
	recipeId: string;
	savedAt: Date;
}

export async function GET() {
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

		// Get user's saved recipes
		const userRecipes = await UserRecipe.findOne({ userId: user._id });
		if (!userRecipes) {
			return NextResponse.json([]);
		}
		if (!userRecipes.savedRecipes || userRecipes.savedRecipes.length === 0) {
			return NextResponse.json([]);
		}

		const savedRecipeIds = userRecipes.savedRecipes.map(
			(saved: SavedRecipe) => saved.recipeId
		);

		// Get all saved recipes with tags
		const recipes = await Recipe.find(
			{
				_id: { $in: savedRecipeIds },
				tags: { $exists: true, $ne: [] },
			},
			{ tags: 1, title: 1 }
		).lean();

		if (recipes.length === 0) {
			return NextResponse.json([]);
		}

		// Extract tags from recipes (case-insensitive deduplication, keep first occurrence)
		const tagMap = new Map<string, string>();
		for (const recipe of recipes) {
			const tags = recipe.tags || [];
			for (const tag of tags) {
				const lower = tag.toLowerCase();
				if (!EXCLUDED_TAGS.has(lower) && !tagMap.has(lower)) {
					tagMap.set(lower, tag);
				}
			}
		}

		// Only keep tags that exist in at least one recipe (already ensured by above)
		const verifiedTags = Array.from(tagMap.values()).sort();

		return NextResponse.json(verifiedTags);
	} catch (error) {
		console.error('[TAGS] Error:', error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : 'Failed to fetch tags',
			},
			{ status: 500 }
		);
	}
}
