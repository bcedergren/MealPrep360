import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { UserRecipe, Recipe } from '@/lib/mongodb/schemas';
import { getOrCreateUser } from '@/lib/getOrCreateUser';

export async function GET() {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get or create user
		const user = await getOrCreateUser(userId);

		// Get user's recipe collection
		const userRecipeCollection = await UserRecipe.findOne({ userId: user._id });
		if (!userRecipeCollection) {
			return NextResponse.json([]);
		}

		// Get all recipe IDs and save dates
		const savedRecipes = userRecipeCollection.savedRecipes;
		const recipeIds = savedRecipes.map((saved: any) => saved.recipeId);

		if (recipeIds.length === 0) {
			return NextResponse.json([]);
		}

		// Fetch all recipe objects in one query
		const recipes = await Recipe.find({ _id: { $in: recipeIds } });

		// Map recipeId to saveDate
		const saveDateMap = Object.fromEntries(
			savedRecipes.map((r: any) => [r.recipeId.toString(), r.savedAt])
		);

		// Return array of { recipe, saveDate }
		const result = recipes.map((recipe: any) => ({
			recipe,
			saveDate: saveDateMap[recipe._id.toString()],
		}));

		return NextResponse.json(result);
	} catch (error) {
		console.error('Error fetching saved recipes:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch saved recipes' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
