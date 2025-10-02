import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { User, UserRecipe } from '@/lib/mongodb/schemas';
import connectDB from '@/lib/mongodb/connection';
import { recipeCache, createCacheKey } from '@/lib/cache';
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

export async function GET(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		await connectDB();
		const { userId: clerkId } = await auth();
		if (!clerkId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get user
		const user = await User.findOne({ clerkId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Check if recipe is saved
		const savedRecipe = await UserRecipe.findOne({
			userId: user._id,
			'savedRecipes.recipeId': params.id,
		});

		return NextResponse.json({ saved: !!savedRecipe });
	} catch (error) {
		console.error('Error checking saved recipe:', error);
		return NextResponse.json(
			{ error: 'Failed to check saved recipe' },
			{ status: 500 }
		);
	}
}

export async function POST(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId: clerkId } = await auth();

		if (!clerkId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		const user = await User.findOne({ clerkId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const recipeId = params.id;
		if (!recipeId) {
			return NextResponse.json(
				{ error: 'Recipe ID is required' },
				{ status: 400 }
			);
		}

		// Get user's subscription plan
		const currentPlan: SubscriptionPlan = user.subscription?.plan || 'FREE';
		const saveLimit = getRecipeSaveLimit(currentPlan);

		// Get or create user recipe collection
		let userRecipeCollection = await UserRecipe.findOne({ userId: user._id });

		if (!userRecipeCollection) {
			userRecipeCollection = await UserRecipe.create({
				userId: user._id,
				savedRecipes: [],
			});
		}

		// Check if recipe is already saved
		const isAlreadySaved = userRecipeCollection.savedRecipes.some(
			(savedRecipe: any) => savedRecipe.recipeId === recipeId
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

		// Add recipe to saved recipes
		userRecipeCollection.savedRecipes.push({
			recipeId,
			savedAt: new Date(),
		});

		await userRecipeCollection.save();

		// Invalidate cache
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
			{ error: 'Failed to save recipe' },
			{ status: 500 }
		);
	}
}
