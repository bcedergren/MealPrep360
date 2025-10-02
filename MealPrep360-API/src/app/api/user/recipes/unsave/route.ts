import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { User, UserRecipe } from '@/lib/mongodb/schemas';
import connectDB from '@/lib/mongodb/connection';
import { recipeCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
	try {
		const { userId: clerkId } = await auth();
		if (!clerkId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		// Get request body
		const { recipeId } = await request.json();
		if (!recipeId) {
			return NextResponse.json(
				{ error: 'Recipe ID is required' },
				{ status: 400 }
			);
		}

		// Get user
		const user = await User.findOne({ clerkId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Get user recipe collection
		const userRecipeCollection = await UserRecipe.findOne({ userId: user._id });

		if (!userRecipeCollection) {
			return NextResponse.json(
				{ message: 'No saved recipes found', saved: false },
				{ status: 200 }
			);
		}

		// Check if recipe is saved
		const savedRecipeIndex = userRecipeCollection.savedRecipes.findIndex(
			(savedRecipe: any) => savedRecipe.recipeId.toString() === recipeId
		);

		if (savedRecipeIndex === -1) {
			return NextResponse.json(
				{ message: 'Recipe not found in saved recipes', saved: false },
				{ status: 200 }
			);
		}

		// Remove recipe from saved recipes
		userRecipeCollection.savedRecipes.splice(savedRecipeIndex, 1);
		await userRecipeCollection.save();

		// Invalidate cache
		recipeCache.clear();

		// Return success with current usage info
		const newCount = userRecipeCollection.savedRecipes.length;
		return NextResponse.json({
			message: 'Recipe unsaved successfully',
			saved: false,
			usage: {
				current: newCount,
			},
		});
	} catch (error) {
		console.error('Error unsaving recipe:', error);
		return NextResponse.json(
			{ error: 'Failed to unsave recipe' },
			{ status: 500 }
		);
	}
}
