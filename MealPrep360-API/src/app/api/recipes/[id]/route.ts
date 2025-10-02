import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { Recipe, User, UserRecipe } from '@/lib/mongodb/schemas';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { recipeCache, createCacheKey } from '@/lib/cache';

interface CachedRecipeData {
	recipe: any;
}

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const resolvedParams = await params;
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = resolvedParams;

		// Validate ObjectId format before attempting to query
		const objectIdPattern = /^[0-9a-fA-F]{24}$/;
		if (!objectIdPattern.test(id)) {
			return NextResponse.json(
				{ error: 'Invalid recipe ID format' },
				{ status: 400 }
			);
		}

		await connectDB();

		// Create cache key for recipe details
		const cacheKey = createCacheKey('recipe-details', { id });

		// Try to get cached recipe data
		const cachedData = recipeCache.get<CachedRecipeData>(cacheKey);
		let transformedRecipe: any;

		if (cachedData) {
			transformedRecipe = cachedData.recipe;
		} else {
			// Use lean() for better performance
			const recipe = (await Recipe.findById(id).lean()) as any;

			if (!recipe) {
				return NextResponse.json(
					{ error: 'Recipe not found' },
					{ status: 404 }
				);
			}

			// Transform the recipe data
			transformedRecipe = {
				_id: recipe._id.toString(),
				id: recipe._id.toString(),
				title: recipe.title || 'Untitled Recipe',
				description: recipe.description || '',
				ingredients: Array.isArray(recipe.ingredients)
					? recipe.ingredients.map((ing: any) =>
							typeof ing === 'string'
								? ing
								: `${ing.amount || ''} ${ing.unit || ''} ${ing.name || ''}`
						)
					: typeof recipe.ingredients === 'string'
						? recipe.ingredients.split('\n').map((line: string) => {
								const [amount, unit, ...nameParts] = line.trim().split(' ');
								return `${amount || ''} ${unit || ''} ${nameParts.join(' ')}`;
							})
						: [],
				instructions: Array.isArray(recipe.instructions)
					? recipe.instructions
					: typeof recipe.instructions === 'string'
						? recipe.instructions.split('\n')
						: [],
				prepTime: recipe.prepTime || 0,
				cookTime: recipe.cookTime || 0,
				servings: recipe.servings || 0,
				mealType: recipe.mealType || 'dinner',
				imageUrl: recipe.imageUrl || recipe.images?.main || '',
				images: recipe.images || { main: recipe.imageUrl },
				prepInstructions: Array.isArray(recipe.prepInstructions)
					? recipe.prepInstructions
					: typeof recipe.prepInstructions === 'string'
						? recipe.prepInstructions.split('\n')
						: [],
				cookingInstructions: Array.isArray(recipe.cookingInstructions)
					? recipe.cookingInstructions
					: typeof recipe.cookingInstructions === 'string'
						? recipe.cookingInstructions.split('\n')
						: [],
				servingInstructions: Array.isArray(recipe.servingInstructions)
					? recipe.servingInstructions
					: typeof recipe.servingInstructions === 'string'
						? recipe.servingInstructions.split('\n')
						: [],
				defrostInstructions: Array.isArray(recipe.defrostInstructions)
					? recipe.defrostInstructions
					: typeof recipe.defrostInstructions === 'string'
						? recipe.defrostInstructions.split('\n')
						: [],
				containerSuggestions: Array.isArray(recipe.containerSuggestions)
					? recipe.containerSuggestions
					: typeof recipe.containerSuggestions === 'string'
						? recipe.containerSuggestions.split('\n')
						: [],
				freezerPrep: Array.isArray(recipe.freezerPrep)
					? recipe.freezerPrep
					: typeof recipe.freezerPrep === 'string'
						? recipe.freezerPrep.split('\n')
						: [],
				tags: Array.isArray(recipe.tags) ? recipe.tags : [],
				allergenInfo: Array.isArray(recipe.allergenInfo)
					? recipe.allergenInfo
					: [],
				dietaryInfo: Array.isArray(recipe.dietaryInfo)
					? recipe.dietaryInfo
					: [],
				difficulty: recipe.difficulty || 'medium',
				season: recipe.season || '',
				storageTime: recipe.storageTime || '',
				isPublic: recipe.isPublic || false,
				clerkId: recipe.clerkId,
			};

			// Cache the recipe details for 10 minutes
			recipeCache.set(cacheKey, { recipe: transformedRecipe }, 600);
		}

		// Get user and check if recipe is saved (this is personalized, so not cached)
		const user = await User.findOne({ clerkId: userId });
		if (user) {
			const savedRecipe = await UserRecipe.findOne({
				userId: user._id,
				'savedRecipes.recipeId': id,
			});
			transformedRecipe.isSaved = !!savedRecipe;
		} else {
			transformedRecipe.isSaved = false;
		}

		// Create response with cache headers
		const response = NextResponse.json(transformedRecipe);

		// Set cache headers for CDN/browser caching
		// Public recipes can be cached publicly, private recipes should be private
		const cacheControl = transformedRecipe.isPublic
			? 'public, s-maxage=600, stale-while-revalidate=1200'
			: 'private, s-maxage=300, stale-while-revalidate=600';

		response.headers.set('Cache-Control', cacheControl);

		return response;
	} catch (error) {
		console.error('Error fetching recipe:', error);
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const resolvedParams = await params;
	try {
		const { userId } = getAuth(request);
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = resolvedParams;

		// Validate ObjectId format before attempting to query
		const objectIdPattern = /^[0-9a-fA-F]{24}$/;
		if (!objectIdPattern.test(id)) {
			return NextResponse.json(
				{ error: 'Invalid recipe ID format' },
				{ status: 400 }
			);
		}

		await connectDB();
		const recipe = await request.json();

		// Validate required fields
		if (!recipe.prepInstructions) {
			return NextResponse.json(
				{ error: 'Prep instructions are required' },
				{ status: 400 }
			);
		}

		// Verify recipe ownership before allowing updates
		const existingRecipe = await Recipe.findById(id);

		if (!existingRecipe) {
			return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
		}

		if (existingRecipe.userId.toString() !== userId) {
			return NextResponse.json(
				{ error: 'You do not have permission to edit this recipe' },
				{ status: 403 }
			);
		}

		const updatedRecipe = await Recipe.findByIdAndUpdate(id, recipe, {
			new: true,
		});

		// Invalidate cache for this recipe
		const cacheKey = createCacheKey('recipe-details', { id });
		recipeCache.delete(cacheKey);

		return NextResponse.json(updatedRecipe);
	} catch (error) {
		console.error('Error updating recipe:', error);
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const resolvedParams = await params;
	try {
		const { userId } = await auth();

		if (!userId) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		const { id } = resolvedParams;

		// Validate ObjectId format before attempting to query
		const objectIdPattern = /^[0-9a-fA-F]{24}$/;
		if (!objectIdPattern.test(id)) {
			return NextResponse.json(
				{ error: 'Invalid recipe ID format' },
				{ status: 400 }
			);
		}

		await connectDB();
		// Verify recipe ownership before allowing deletion
		const existingRecipe = await Recipe.findById(id);

		if (!existingRecipe) {
			return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
		}

		if (existingRecipe.userId.toString() !== userId) {
			return NextResponse.json(
				{ error: 'You do not have permission to delete this recipe' },
				{ status: 403 }
			);
		}

		const recipe = await Recipe.findByIdAndDelete(id);

		// Invalidate recipe cache
		recipeCache.clear();

		return NextResponse.json(recipe);
	} catch (error) {
		console.error('Error deleting recipe:', error);
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const resolvedParams = await params;
	try {
		const { userId } = await auth();

		if (!userId) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		const { id } = resolvedParams;

		// Validate ObjectId format before attempting to query
		const objectIdPattern = /^[0-9a-fA-F]{24}$/;
		if (!objectIdPattern.test(id)) {
			return NextResponse.json(
				{ error: 'Invalid recipe ID format' },
				{ status: 400 }
			);
		}

		await connectDB();
		const data = await request.json();
		const recipe = await Recipe.findOneAndUpdate({ _id: id, userId }, data, {
			new: true,
		});

		// Invalidate cache for this recipe
		const cacheKey = createCacheKey('recipe-details', { id });
		recipeCache.delete(cacheKey);

		return NextResponse.json(recipe);
	} catch (error) {
		console.error('Error updating recipe:', error);
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}
