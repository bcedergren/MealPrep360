import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serverApiClient } from '@/lib/api-client-server';
import { API_CONFIG } from '@/lib/api-config';
import connectDB from '@/lib/mongodb/connection';
import { User, UserRecipe } from '@/lib/mongodb/schemas';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/recipes/[id]/saved - Check if a specific recipe is saved by the user
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId, getToken } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const token = await getToken();
		const recipeId = params.id;

		if (!recipeId) {
			return NextResponse.json(
				{ error: 'Recipe ID required' },
				{ status: 400 }
			);
		}

		// Try to call the external API first
		try {
			const response = await serverApiClient.get(
				API_CONFIG.endpoints.userRecipesSaved
			);

			if (response.success && response.data) {
				// Check if the recipe exists in the saved recipes list
				const savedRecipes = response.data as any[];

				// Ensure savedRecipes is an array before calling .some()
				if (!Array.isArray(savedRecipes)) {
					console.error('External API returned non-array data:', savedRecipes);
					throw new Error('Invalid response format from external API');
				}

				const isSaved = savedRecipes.some(
					(recipe: any) => recipe._id === recipeId || recipe.id === recipeId
				);

				return NextResponse.json({ saved: isSaved });
			} else {
				console.error('External API failed:', response.error);
				throw new Error(`External API failed: ${response.error}`);
			}
		} catch (externalApiError) {
			console.error(
				'External API error, falling back to local database:',
				externalApiError
			);

			// Fallback to local database
			try {
				await connectDB();

				const user = await User.findOne({ clerkId: userId });
				if (!user) {
					return NextResponse.json({ saved: false });
				}

				const userRecipe = await UserRecipe.findOne({ userId: user._id });
				if (!userRecipe) {
					return NextResponse.json({ saved: false });
				}

				const isSaved = userRecipe.savedRecipes.some(
					(recipe: any) => recipe.recipeId.toString() === recipeId
				);
				return NextResponse.json({ saved: isSaved });
			} catch (dbError) {
				console.error('Database fallback failed:', dbError);
				return NextResponse.json(
					{ error: 'Failed to check saved recipe status' },
					{ status: 500 }
				);
			}
		}
	} catch (error) {
		console.error('Error checking if recipe is saved:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// POST /api/recipes/[id]/saved - Save a recipe to user's collection
export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId, getToken } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const token = await getToken();
		const recipeId = params.id;

		if (!recipeId) {
			return NextResponse.json(
				{ error: 'Recipe ID required' },
				{ status: 400 }
			);
		}

		// Try to call the external API first
		try {
			const response = await serverApiClient.post(
				API_CONFIG.endpoints.userRecipesSaved,
				{ recipeId }
			);

			if (response.success) {
				return NextResponse.json({
					success: true,
					message: 'Recipe saved successfully',
				});
			} else {
				console.error('External API failed to save recipe:', response.error);
				throw new Error(`External API failed: ${response.error}`);
			}
		} catch (externalApiError) {
			console.error(
				'External API error, falling back to local database:',
				externalApiError
			);

			// Fallback to local database
			try {
				await connectDB();

				const user = await User.findOne({ clerkId: userId });
				if (!user) {
					return NextResponse.json(
						{ error: 'User not found' },
						{ status: 404 }
					);
				}

				// Find or create UserRecipe document
				let userRecipe = await UserRecipe.findOne({ userId: user._id });
				if (!userRecipe) {
					userRecipe = new UserRecipe({
						userId: user._id,
						savedRecipes: [],
					});
				}

				// Check if recipe is already saved
				const isAlreadySaved = userRecipe.savedRecipes.some(
					(recipe: any) => recipe.recipeId.toString() === recipeId
				);

				if (!isAlreadySaved) {
					userRecipe.savedRecipes.push({
						recipeId: recipeId,
						savedAt: new Date(),
					});
					await userRecipe.save();
				}

				return NextResponse.json({
					success: true,
					message: 'Recipe saved successfully',
				});
			} catch (dbError) {
				console.error('Database fallback failed:', dbError);
				return NextResponse.json(
					{ error: 'Failed to save recipe' },
					{ status: 500 }
				);
			}
		}
	} catch (error) {
		console.error('Error saving recipe:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
