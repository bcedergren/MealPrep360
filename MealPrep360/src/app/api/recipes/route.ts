import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { Recipe, User } from '@/lib/mongodb/schemas';
import { serverApiClient } from '@/lib/api-client-server';
import { API_CONFIG } from '@/lib/api-config';
import jwt from 'jsonwebtoken';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/recipes - List recipes with filtering and pagination
export async function GET(request: NextRequest) {
	try {
		const { userId, getToken } = await auth();

		// Log the decoded JWT (redacted)
		const token = await getToken();
		if (token) {
			try {
				const decoded = jwt.decode(token, { complete: true });
				if (decoded && typeof decoded === 'object') {
					const redacted = { ...decoded };
					if (
						redacted.payload &&
						typeof redacted.payload === 'object' &&
						redacted.payload !== null
					) {
						if ('sub' in redacted.payload) redacted.payload.sub = '[REDACTED]';
						if ('email' in redacted.payload)
							redacted.payload.email = '[REDACTED]';
						if ('user_id' in redacted.payload)
							redacted.payload.user_id = '[REDACTED]';
					}
				} else {
					// Handle case where decoded is not an object
				}
			} catch (err) {
				// Handle JWT decode error
			}
		}

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const params = Object.fromEntries(searchParams.entries());

		try {
			await connectDB();

			// Find user by Clerk ID to get the ObjectId
			const user = await User.findOne({ clerkId: userId });
			if (!user) {
				return NextResponse.json({ recipes: [], total: 0 }, { status: 200 });
			}

			// Parse pagination parameters
			const page = parseInt(params.page || '1');
			const limit = parseInt(params.limit || '10');
			const skip = (page - 1) * limit;

			// Build query based on search parameters
			const query: any = { clerkId: userId };

			if (params.search) {
				query.$text = { $search: params.search };
			}

			if (params.tags) {
				const tags = params.tags.split(',');
				query.tags = { $in: tags };
			}

			if (params.prepTime && params.prepTime !== 'all') {
				const prepTime = parseInt(params.prepTime);
				query.prepTime = { $lte: prepTime };
			}

			// Sort options
			const sortBy = params.sortBy || 'createdAt';
			const sortOrder = params.sortOrder === 'asc' ? 1 : -1;
			const sort: any = { [sortBy]: sortOrder };

			// Get recipes with pagination
			const [recipes, total] = await Promise.all([
				Recipe.find(query).sort(sort).skip(skip).limit(limit).lean(),
				Recipe.countDocuments(query),
			]);

			// Transform to expected format
			const transformedRecipes = recipes.map((recipe: any) => ({
				id: recipe._id.toString(),
				title: recipe.title,
				description: recipe.description,
				ingredients: recipe.ingredients,
				instructions: recipe.instructions,
				prepTime: recipe.prepTime,
				cookTime: recipe.cookTime,
				servings: recipe.servings,
				imageUrl: recipe.imageUrl,
				mealType: recipe.mealType,
				createdAt: recipe.createdAt,
				updatedAt: recipe.updatedAt,
			}));

			return NextResponse.json({
				recipes: transformedRecipes,
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			});
		} catch (dbError) {
			console.error('Database fallback failed:', dbError);
			return NextResponse.json({ recipes: [], total: 0 }, { status: 200 });
		}
	} catch (error) {
		console.error('Error fetching recipes:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// POST /api/recipes - Create new recipe or batch fetch recipes by IDs
export async function POST(request: NextRequest) {
	try {
		const { userId, getToken } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();

		// Check if this is a batch fetch request
		if (body.recipeIds && Array.isArray(body.recipeIds)) {
			// Batch fetch recipes by IDs from local database, then fill in missing from external API
			const recipeIds = body.recipeIds.map((x: any) => String(x));

			console.log('🍳 Batch fetch request for recipe IDs:', recipeIds);
			console.log('🍳 Recipe IDs count:', recipeIds.length);

			const transform = (recipe: any) => ({
				_id: (recipe && (recipe._id || recipe.id))?.toString(),
				id: (recipe && (recipe._id || recipe.id))?.toString(),
				title: recipe?.title || 'Untitled Recipe',
				description: recipe?.description || '',
				ingredients: Array.isArray(recipe?.ingredients)
					? recipe.ingredients
					: [],
				instructions: Array.isArray(recipe?.instructions)
					? recipe.instructions
					: [],
				prepTime: recipe?.prepTime || 0,
				cookTime: recipe?.cookTime || 0,
				servings: recipe?.servings || 0,
				mealType: recipe?.mealType || 'dinner',
				imageUrl: recipe?.imageUrl || recipe?.images?.main || '',
				tags: recipe?.tags || [],
				clerkId: recipe?.clerkId || '',
				allergenInfo: recipe?.allergenInfo || [],
				dietaryInfo: recipe?.dietaryInfo || [],
				hasImage: recipe?.hasImage || false,
				season: recipe?.season || '',
				isPublic: recipe?.isPublic || false,
				isPlaceholder: recipe?.isPlaceholder || false,
				originalLanguage: recipe?.originalLanguage || 'en',
				createdAt: recipe?.createdAt ? new Date(recipe.createdAt) : new Date(),
				updatedAt: recipe?.updatedAt ? new Date(recipe.updatedAt) : new Date(),
			});

			try {
				await connectDB();

				console.log('🍳 Searching local database for recipes...');

				// Find recipes from local database
				const dbRecipes = await Recipe.find({ _id: { $in: recipeIds } }).lean();
				const dbMap = new Map<string, any>();
				dbRecipes.forEach((r: any) => dbMap.set(String(r._id), r));

				console.log('🍳 Found recipes in local database:', dbRecipes.length);

				// Determine missing IDs
				const missingIds = recipeIds.filter((id: string) => !dbMap.has(id));
				console.log(
					'🍳 Missing recipe IDs to fetch from external API:',
					missingIds
				);

				const externalFetched: any[] = [];
				if (missingIds.length > 0) {
					await Promise.all(
						missingIds.map(async (id: string) => {
							try {
								const resp = await serverApiClient.get(
									`${API_CONFIG.endpoints.recipes}/${id}`,
									{},
									{ requestContext: request }
								);
								if (resp.success && resp.data) {
									externalFetched.push(resp.data);
								} else {
									console.warn(
										'🍳 External recipe fetch failed',
										id,
										resp.status,
										resp.error
									);
								}
							} catch (e) {
								console.warn('🍳 External recipe fetch error', id, e);
							}
						})
					);
				}

				const mergedTransformed = [
					...dbRecipes.map(transform),
					...externalFetched.map(transform),
				];

				console.log(
					'🍳 Returning transformed recipes:',
					mergedTransformed.length
				);
				return NextResponse.json(mergedTransformed);
			} catch (dbOrExternalError) {
				console.error('Batch recipe resolution failed:', dbOrExternalError);
				return NextResponse.json([], { status: 200 });
			}
		}

		// Regular recipe creation request - handle locally
		try {
			await connectDB();

			// Create new recipe in local database
			const newRecipe = new Recipe({
				...body,
				clerkId: userId,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			const savedRecipe = await newRecipe.save();

			// Transform to expected format
			const transformedRecipe = {
				id: savedRecipe._id.toString(),
				title: savedRecipe.title,
				description: savedRecipe.description,
				ingredients: savedRecipe.ingredients,
				instructions: savedRecipe.instructions,
				prepTime: savedRecipe.prepTime,
				cookTime: savedRecipe.cookTime,
				servings: savedRecipe.servings,
				imageUrl: savedRecipe.imageUrl,
				mealType: savedRecipe.mealType,
				createdAt: savedRecipe.createdAt,
				updatedAt: savedRecipe.updatedAt,
			};

			return NextResponse.json(transformedRecipe);
		} catch (dbError) {
			console.error('Database recipe creation failed:', dbError);
			return NextResponse.json(
				{ error: 'Failed to create recipe' },
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error('Error in recipe POST handler:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
