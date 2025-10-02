import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User, Recipe, UserRecipe } from '@/lib/mongodb/schemas';
import { recipeCache } from '@/lib/cache';
import { SubscriptionPlan, PLAN_FEATURES } from '@/types/subscription';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

function getRecipeSaveLimit(plan: SubscriptionPlan): number {
	const feature = PLAN_FEATURES[plan]['Saved Recipes'];
	if (feature === 'Unlimited') return -1; // -1 means unlimited
	if (typeof feature === 'number') return feature;
	if (typeof feature === 'string') {
		const num = parseInt(feature);
		return isNaN(num) ? 0 : num;
	}
	return 0; // Default to 0 if no access
}

export async function GET() {
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

		const recipes = await Recipe.find({ clerkId: userId });
		return NextResponse.json({ recipes });
	} catch (error) {
		console.error('Error fetching user recipes:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch user recipes' },
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
	try {
		const { userId: clerkId } = await auth();
		if (!clerkId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		// Get or create user
		const user = await User.findOne({ clerkId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const { recipeId } = await request.json();
		if (!recipeId) {
			return NextResponse.json(
				{ error: 'Recipe ID is required' },
				{ status: 400 }
			);
		}

		// Check if recipe exists
		const recipe = await Recipe.findById(recipeId);
		if (!recipe) {
			return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
		}

		// Get user's subscription plan
		const currentPlan: SubscriptionPlan = user.subscription?.plan || 'FREE';
		const saveLimit = getRecipeSaveLimit(currentPlan);

		// Get or create user's recipe collection
		let userRecipeCollection = await UserRecipe.findOne({ userId: user._id });

		if (!userRecipeCollection) {
			// Create new collection if it doesn't exist
			userRecipeCollection = await UserRecipe.create({
				userId: user._id,
				savedRecipes: [],
			});
		}

		// Check if recipe is already saved
		const isAlreadySaved = userRecipeCollection.savedRecipes.some(
			(saved: any) => saved.recipeId.toString() === recipeId
		);

		if (isAlreadySaved) {
			return NextResponse.json(
				{ message: 'Recipe already saved', saved: true },
				{ status: 200 }
			);
		}

		// Check subscription limits (only if not unlimited)
		if (saveLimit !== -1) {
			const currentSavedCount = userRecipeCollection.savedRecipes.length;

			if (currentSavedCount >= saveLimit) {
				return NextResponse.json(
					{
						error: `You've reached your recipe limit (${saveLimit} recipes). Upgrade your plan to save more recipes.`,
						type: 'SUBSCRIPTION_LIMIT_EXCEEDED',
						currentCount: currentSavedCount,
						limit: saveLimit,
						plan: currentPlan,
					},
					{ status: 403 }
				);
			}
		}

		// Add new recipe to saved recipes
		userRecipeCollection.savedRecipes.push({
			recipeId,
			savedAt: new Date(),
		});
		await userRecipeCollection.save();

		// Invalidate cache for saved recipes
		recipeCache.clear();

		// Return success with current usage info
		const newCount = userRecipeCollection.savedRecipes.length;
		return NextResponse.json({
			message: 'Recipe saved successfully',
			saved: true,
			usage: {
				current: newCount,
				limit: saveLimit === -1 ? 'unlimited' : saveLimit,
				remaining:
					saveLimit === -1 ? 'unlimited' : Math.max(0, saveLimit - newCount),
			},
		});
	} catch (error) {
		console.error('Error saving recipe:', error);
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
