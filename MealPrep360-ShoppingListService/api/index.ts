import { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import { connectToDatabase } from '../src/utils/database';
import { Recipe } from '../src/models/Recipe';
import { ShoppingList } from '../src/models/ShoppingList';
import { generateShoppingList } from '../src/services/shoppingListService';
import { normalizeIngredientCategory } from '../src/services/ingredientNormalizationService';
import { ShoppingListRequestSchema } from '../src/types';
import { MealPlanModel } from '../src/models/MealPlan';

export default async function handler(req: VercelRequest, res: VercelResponse) {
	console.log('API request received:', {
		method: req.method,
		url: req.url,
		headers: req.headers,
		query: req.query,
		body: req.body,
	});

	// Add CORS headers for cross-origin requests
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
	res.setHeader(
		'Access-Control-Allow-Headers',
		'Content-Type, Authorization, X-User-Id'
	);

	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}

	if (req.method !== 'POST') {
		console.log('Method not allowed:', req.method);
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		// Connect to database with retry logic
		console.log('Connecting to database...');
		let dbConnected = false;
		let retryCount = 0;
		const maxRetries = 3;

		while (!dbConnected && retryCount < maxRetries) {
			try {
				await connectToDatabase();
				dbConnected = true;
				console.log('Database connection successful');
			} catch (dbError) {
				retryCount++;
				console.warn(
					`Database connection attempt ${retryCount} failed:`,
					dbError
				);

				if (retryCount >= maxRetries) {
					console.error('Max database connection retries exceeded');
					return res.status(503).json({
						error: 'Service temporarily unavailable',
						message:
							'Database connection failed after multiple retries. Please try again later.',
						retryAfter: 30, // seconds
					});
				}

				// Wait before retrying (exponential backoff)
				await new Promise((resolve) =>
					setTimeout(resolve, Math.pow(2, retryCount) * 1000)
				);
			}
		}

		// Get user ID from auth header or request body
		const userId = req.headers['x-user-id'] || req.body.userId;
		console.log('User ID:', userId);

		if (!userId) {
			console.error('User ID not provided');
			return res.status(401).json({ error: 'User ID is required' });
		}

		if (typeof userId !== 'string' || userId.trim() === '') {
			console.error('Invalid user ID:', userId);
			return res.status(401).json({ error: 'Invalid user ID provided' });
		}

		// Process recipes first if they exist in the request body
		if (req.body.recipes) {
			console.log(
				'Starting recipe processing. Found recipes:',
				req.body.recipes.length
			);
			try {
				const processedRecipes = await Promise.all(
					req.body.recipes.map(async (recipe) => {
						console.log('Processing recipe:', {
							title: recipe.title,
							ingredientCount: recipe.ingredients?.length,
						});

						const processedIngredients = await Promise.all(
							recipe.ingredients.map(async (ing) => {
								console.log('Processing ingredient before normalization:', {
									recipe: recipe.title,
									ingredient: ing.name,
									category: ing.category,
								});

								const normalizedCategory = await normalizeIngredientCategory(
									ing.name,
									ing.category
								);

								console.log('Normalized category:', {
									recipe: recipe.title,
									ingredient: ing.name,
									originalCategory: ing.category,
									normalizedCategory,
								});

								const result = { ...ing, category: normalizedCategory };
								console.log('Final ingredient after normalization:', {
									recipe: recipe.title,
									ingredient: result.name,
									category: result.category,
								});

								return result;
							})
						);
						return { ...recipe, ingredients: processedIngredients };
					})
				);
				console.log(
					'Recipe processing complete. Processed recipes:',
					processedRecipes.length
				);
				req.body.recipes = processedRecipes;
			} catch (error) {
				console.error('Error normalizing categories:', error);
				return res.status(400).json({
					error: 'Failed to normalize ingredient categories',
					details: error instanceof Error ? error.message : 'Unknown error',
				});
			}
		}

		// Log recipes before validation
		if (req.body.recipes) {
			console.log(
				'Recipes before validation:',
				req.body.recipes.map((recipe) => ({
					title: recipe.title,
					ingredients: recipe.ingredients.map((ing) => ({
						name: ing.name,
						category: ing.category,
					})),
				}))
			);
		}

		// Validate request body
		console.log('Validating request body:', {
			...req.body,
			recipes: req.body.recipes?.map((r) => ({
				title: r.title,
				ingredientCount: r.ingredients?.length,
			})),
		});

		let validatedData;
		try {
			validatedData = ShoppingListRequestSchema.parse(req.body);
			console.log('Request validation successful:', {
				mealPlanId: validatedData.mealPlanId,
				recipeIds: validatedData.recipeIds?.length,
				pantryExclusions: validatedData.pantryExclusions?.length,
			});
		} catch (error) {
			console.error('Validation error details:', error);
			if (error instanceof Error) {
				console.error('Full validation error:', {
					name: error.name,
					message: error.message,
					stack: error.stack,
					details: error,
				});
			}
			return res.status(400).json({
				error: 'Invalid request data',
				details:
					error instanceof Error ? error.message : 'Unknown validation error',
			});
		}
		const { mealPlanId, recipeIds, pantryExclusions } = validatedData;

		let finalRecipeIds: string[];
		let mealPlanItems: { recipeId: string; servings: number }[] = [];

		if (mealPlanId) {
			// Validate meal plan ID is a valid ObjectId
			if (!mongoose.Types.ObjectId.isValid(mealPlanId)) {
				console.error('Invalid meal plan ObjectId:', mealPlanId);
				return res.status(400).json({
					error: 'Invalid meal plan ID provided',
					invalidId: mealPlanId,
				});
			}

			// Fetch meal plan
			console.log('Fetching meal plan:', { mealPlanId, userId });
			let mealPlan;
			try {
				mealPlan = await MealPlanModel.findOne({ _id: mealPlanId, userId });
			} catch (error) {
				console.error('Failed to fetch meal plan:', error);
				return res.status(500).json({
					error: 'Failed to fetch meal plan from database',
					details: error instanceof Error ? error.message : 'Unknown error',
				});
			}
			if (!mealPlan) {
				console.error('Meal plan not found:', { mealPlanId, userId });
				return res.status(404).json({ error: 'Meal plan not found' });
			}
			console.log('Meal plan found:', {
				id: mealPlan._id,
				userId: mealPlan.userId,
				itemsCount: mealPlan.items.length,
			});
			console.log('Meal plan items:', mealPlan.items);
			finalRecipeIds = mealPlan.items.map((item) => item.recipeId);
			mealPlanItems = mealPlan.items;
		} else if (recipeIds) {
			finalRecipeIds = recipeIds;
			mealPlanItems = recipeIds.map((recipeId) => ({ recipeId, servings: 1 }));
		} else {
			return res
				.status(400)
				.json({ error: 'Either mealPlanId or recipeIds must be provided' });
		}

		// Validate recipe IDs are valid ObjectIds
		const invalidObjectIds = finalRecipeIds.filter(
			(id) => !mongoose.Types.ObjectId.isValid(id)
		);
		if (invalidObjectIds.length > 0) {
			console.error('Invalid ObjectIds:', invalidObjectIds);
			return res.status(400).json({
				error: 'Invalid recipe IDs provided',
				invalidIds: invalidObjectIds,
			});
		}

		// Fetch recipes
		let recipes;
		try {
			recipes = await Recipe.find({ _id: { $in: finalRecipeIds } });
		} catch (error) {
			console.error('Failed to fetch recipes:', error);
			return res.status(500).json({
				error: 'Failed to fetch recipes from database',
				details: error instanceof Error ? error.message : 'Unknown error',
			});
		}
		console.log('Fetched recipes count:', recipes.length);
		console.log('Recipe IDs requested:', finalRecipeIds);
		console.log(
			'Recipe IDs found:',
			recipes.map((r) => r._id.toString())
		);

		// Check for missing recipes
		const foundRecipeIds = recipes.map((r) => r._id.toString());
		console.log('Recipe ID format comparison:', {
			requestedIds: finalRecipeIds,
			foundIds: foundRecipeIds,
			requestedTypes: finalRecipeIds.map((id) => typeof id),
			foundTypes: foundRecipeIds.map((id) => typeof id),
		});

		const missingRecipeIds = finalRecipeIds.filter(
			(id) => !foundRecipeIds.includes(id)
		);
		if (missingRecipeIds.length > 0) {
			console.error('Missing recipes:', missingRecipeIds);
			return res.status(404).json({
				error: 'Some recipes not found',
				missingRecipeIds,
			});
		}

		// Validate meal plan items have valid recipe IDs
		const validRecipeIds = new Set(foundRecipeIds);
		const invalidMealPlanItems = mealPlanItems.filter(
			(item) => !validRecipeIds.has(item.recipeId)
		);
		if (invalidMealPlanItems.length > 0) {
			console.error('Invalid meal plan items:', invalidMealPlanItems);
			console.error('Valid recipe IDs:', Array.from(validRecipeIds));
			console.error(
				'Invalid recipe IDs:',
				invalidMealPlanItems.map((item) => item.recipeId)
			);
			return res.status(400).json({
				error: 'Some meal plan items reference non-existent recipes',
				invalidMealPlanItems: invalidMealPlanItems.map((item) => item.recipeId),
			});
		}

		if (recipes.length === 0) {
			return res
				.status(404)
				.json({ error: 'No recipes found with the provided IDs' });
		}

		// Convert MongoDB documents to expected type and normalize categories
		console.log(
			'Raw recipe data from database:',
			recipes.map((r) => ({
				id: r._id,
				title: r.title,
				ingredientsCount: r.ingredients?.length || 0,
				ingredients: r.ingredients?.slice(0, 2), // Show first 2 ingredients for debugging
			}))
		);

		// Normalize categories for recipes from database
		try {
			const normalizedRecipes = await Promise.all(
				recipes.map(async (recipe) => {
					const normalizedIngredients = await Promise.all(
						(recipe.ingredients || []).map(async (ing) => {
							console.log(
								'Processing database ingredient before normalization:',
								{
									recipe: recipe.title,
									ingredient: ing.name,
									category: ing.category,
								}
							);

							// Handle "Meat & Seafood" case directly
							let normalizedCategory;
							if (ing.category === 'Meat & Seafood') {
								const seafoodTerms = [
									'fish',
									'salmon',
									'tuna',
									'shrimp',
									'seafood',
									'crab',
									'lobster',
									'tilapia',
									'cod',
									'halibut',
									'mahi',
									'bass',
									'trout',
									'mackerel',
									'sardines',
									'anchovies',
									'oysters',
									'mussels',
									'clams',
									'scallops',
									'calamari',
									'squid',
									'octopus',
									'prawns',
								];
								const lowercaseIngredient = ing.name.toLowerCase();
								normalizedCategory = seafoodTerms.some((term) =>
									lowercaseIngredient.includes(term)
								)
									? 'Seafood'
									: 'Meat';
							} else {
								normalizedCategory = await normalizeIngredientCategory(
									ing.name,
									ing.category
								);
							}

							console.log('Normalized category for database recipe:', {
								recipe: recipe.title,
								ingredient: ing.name,
								originalCategory: ing.category,
								normalizedCategory,
							});

							const result = { ...ing, category: normalizedCategory };
							console.log('Final ingredient after normalization:', {
								recipe: recipe.title,
								ingredient: result.name,
								category: result.category,
							});

							return result;
						})
					);
					return {
						_id: recipe._id.toString(),
						title: recipe.title,
						ingredients: normalizedIngredients,
					};
				})
			);
			recipes = normalizedRecipes;
		} catch (error) {
			console.error(
				'Error normalizing categories for database recipes:',
				error
			);
			return res.status(400).json({
				error: 'Failed to normalize ingredient categories for database recipes',
				details: error instanceof Error ? error.message : 'Unknown error',
			});
		}

		// Log recipe IDs for debugging
		console.log(
			'Recipe IDs being processed:',
			recipes.map((r) => r._id.toString())
		);

		// Check for recipes with missing titles before processing
		const recipesWithMissingTitles = recipes.filter((r) => !r.title);
		if (recipesWithMissingTitles.length > 0) {
			console.error(
				'Recipes with missing titles found:',
				recipesWithMissingTitles.map((r) => r._id.toString())
			);
			return res.status(400).json({
				error: 'Recipe data validation failed',
				details: `${recipesWithMissingTitles.length} recipe(s) are missing titles`,
				missingTitleRecipeIds: recipesWithMissingTitles.map((r) =>
					r._id.toString()
				),
				suggestion: 'Please update the recipe titles in the database',
			});
		}

		// Process recipes and validate ingredients
		const recipePromises = recipes.map(async (recipe) => {
			const recipeObj = recipe.toObject ? recipe.toObject() : recipe;

			console.log('Processing recipe:', {
				id: recipeObj._id,
				title: recipeObj.title,
				ingredientsCount: recipeObj.ingredients?.length || 0,
			});

			// Validate recipe has required fields
			if (!recipeObj.title) {
				console.error('Recipe missing title:', recipeObj._id);
				throw new Error(`Recipe with ID ${recipeObj._id} is missing a title`);
			}

			// Validate ingredients have required fields
			if (!recipeObj.ingredients || !Array.isArray(recipeObj.ingredients)) {
				throw new Error(
					`Recipe "${recipeObj.title}" has invalid ingredients array`
				);
			}

			// Process ingredients and validate fields
			const ingredientPromises = recipeObj.ingredients.map(
				async (ing, index) => {
					// Ensure ingredient is a valid object
					if (!ing || typeof ing !== 'object') {
						throw new Error(
							`Recipe "${recipeObj.title}" has invalid ingredient at index ${index}`
						);
					}

					console.log(
						`Validating ingredient ${index} in recipe "${recipeObj.title}":`,
						{
							name: ing.name,
							amount: ing.amount,
							unit: ing.unit,
							category: ing.category,
						}
					);

					if (!ing.name) {
						throw new Error(
							`Recipe "${recipeObj.title}" has ingredient at index ${index} missing name`
						);
					}
					if (typeof ing.amount === 'undefined' || ing.amount === null) {
						throw new Error(
							`Recipe "${recipeObj.title}" has ingredient "${ing.name}" missing amount`
						);
					}
					if (!ing.unit) {
						throw new Error(
							`Recipe "${recipeObj.title}" has ingredient "${ing.name}" missing unit`
						);
					}
					if (!ing.category) {
						throw new Error(
							`Recipe "${recipeObj.title}" has ingredient "${ing.name}" missing category`
						);
					}

					// Handle "Meat & Seafood" case directly here as well
					let category = ing.category;
					if (category === 'Meat & Seafood') {
						const seafoodTerms = [
							'fish',
							'salmon',
							'tuna',
							'shrimp',
							'seafood',
							'crab',
							'lobster',
							'tilapia',
							'cod',
							'halibut',
							'mahi',
							'bass',
							'trout',
							'mackerel',
							'sardines',
							'anchovies',
							'oysters',
							'mussels',
							'clams',
							'scallops',
							'calamari',
							'squid',
							'octopus',
							'prawns',
						];
						const lowercaseIngredient = ing.name.toLowerCase();
						category = seafoodTerms.some((term) =>
							lowercaseIngredient.includes(term)
						)
							? 'Seafood'
							: 'Meat';

						console.log('Normalized Meat & Seafood category in validation:', {
							recipe: recipeObj.title,
							ingredient: ing.name,
							originalCategory: ing.category,
							normalizedCategory: category,
						});
					}

					return {
						name: ing.name,
						amount: ing.amount,
						unit: ing.unit,
						category: category,
					};
				}
			);

			const validatedIngredients = await Promise.all(ingredientPromises);

			return {
				_id: recipeObj._id.toString(),
				title: recipeObj.title,
				ingredients: validatedIngredients,
			};
		});

		// Wait for all recipe promises to resolve
		const recipeDocuments = await Promise.all(recipePromises);

		// Generate shopping list using meal plan items
		console.log('Starting shopping list generation with:', {
			recipeCount: recipeDocuments.length,
			mealPlanItemsCount: mealPlanItems.length,
			pantryExclusionsCount: pantryExclusions?.length || 0,
		});

		let shoppingListItems;
		try {
			shoppingListItems = await generateShoppingList(
				recipeDocuments,
				mealPlanItems,
				pantryExclusions
			);
		} catch (error) {
			console.error('Shopping list generation failed:', error);
			console.error(
				'Recipe documents:',
				recipeDocuments.map((r) => ({
					id: r._id,
					name: r.name,
					ingredientsCount: r.ingredients.length,
				}))
			);
			console.error('Meal plan items:', mealPlanItems);

			// Provide a more specific error message
			if (error instanceof Error) {
				if (error.message.includes('Missing unit for ingredient')) {
					return res.status(400).json({
						error: 'Recipe data validation failed',
						details: error.message,
						suggestion:
							'Please check that all recipe ingredients have valid units',
					});
				}
				if (error.message.includes('Missing amount for ingredient')) {
					return res.status(400).json({
						error: 'Recipe data validation failed',
						details: error.message,
						suggestion:
							'Please check that all recipe ingredients have valid amounts',
					});
				}
				if (error.message.includes('is missing title')) {
					return res.status(400).json({
						error: 'Recipe data validation failed',
						details: error.message,
						suggestion:
							'Please check that all recipes have valid titles in the database',
					});
				}
			}

			throw error;
		}

		// Validate shopping list items
		if (!shoppingListItems || !Array.isArray(shoppingListItems)) {
			console.error('Invalid shopping list items:', shoppingListItems);
			return res
				.status(500)
				.json({ error: 'Invalid shopping list items generated' });
		}

		if (shoppingListItems.length === 0) {
			console.warn('No shopping list items generated');
			return res.status(400).json({
				error: 'No shopping list items generated - check recipe data',
			});
		}

		// Validate each shopping list item
		const invalidItems = shoppingListItems.filter(
			(item) =>
				!item.name ||
				typeof item.amount !== 'number' ||
				isNaN(item.amount) ||
				!item.unit ||
				!item.category
		);

		if (invalidItems.length > 0) {
			console.error('Invalid shopping list items:', invalidItems);
			return res.status(500).json({
				error: 'Invalid shopping list items generated',
				invalidItemsCount: invalidItems.length,
				invalidItems: invalidItems.map((item) => ({
					name: item.name,
					amount: item.amount,
					unit: item.unit,
					category: item.category,
				})),
			});
		}

		// Create shopping list document
		console.log(
			'Creating shopping list document with items:',
			shoppingListItems.length
		);
		const shoppingList = new ShoppingList({
			userId,
			recipeIds: finalRecipeIds,
			items: shoppingListItems.map((item) => ({
				name: item.name,
				amount: item.amount,
				unit: item.unit,
				category: item.category,
				normalizedAmount: item.normalizedAmount,
				normalizedUnit: item.normalizedUnit,
			})),
			createdAt: new Date(),
		});

		// Save shopping list
		console.log('Saving shopping list to database...');
		try {
			await shoppingList.save();
			console.log('Shopping list saved successfully');
		} catch (error) {
			console.error('Failed to save shopping list:', error);
			return res.status(500).json({
				error: 'Failed to save shopping list',
				details: error instanceof Error ? error.message : 'Unknown error',
			});
		}

		console.log('Shopping list created successfully:', {
			userId,
			recipeCount: recipes.length,
			itemCount: shoppingListItems.length,
		});

		// Transform the shopping list to match frontend expectations
		const transformedShoppingList = {
			name: `Shopping List ${new Date().toLocaleDateString()}`,
			userId,
			status: 'ACTIVE',
			items: shoppingList.items.map((item) => ({
				name: item.name,
				quantity: item.amount, // Transform amount to quantity for frontend
				unit: item.unit,
				category: item.category,
				status: 'PENDING', // Add status field expected by frontend
				_id: new mongoose.Types.ObjectId().toString(), // Generate ID for frontend
			})),
			_id: shoppingList._id,
			createdAt: shoppingList.createdAt,
			updatedAt: shoppingList.createdAt,
			__v: 0,
		};

		res.status(201).json({
			message: 'Shopping list created successfully',
			shoppingList: transformedShoppingList,
		});
	} catch (error) {
		console.error('Error creating shopping list:', error);

		// Provide more specific error messages based on error type
		if (error instanceof Error) {
			if (error.message.includes('ValidationError')) {
				return res.status(400).json({
					error: 'Validation error',
					details: error.message,
					suggestion: 'Please check the request data format',
				});
			}
			if (error.message.includes('CastError')) {
				return res.status(400).json({
					error: 'Invalid data format',
					details: error.message,
					suggestion: 'Please check that all IDs are valid',
				});
			}
			if (
				error.message.includes('MongoError') ||
				error.message.includes('MongoServerError')
			) {
				return res.status(500).json({
					error: 'Database error',
					details: error.message,
					suggestion: 'Please try again later',
				});
			}
		}

		// Return error in format that matches the external API
		if (error instanceof Error && error.message.includes('Database')) {
			return res.status(503).json({
				error: 'Shopping service unavailable',
				message:
					'The shopping list service is temporarily experiencing database issues. Please try again later.',
				retryAfter: 30,
			});
		}

		res.status(503).json({
			error: 'Shopping service unavailable',
			message:
				'The shopping list service is currently unavailable. Please try again later.',
			details: error instanceof Error ? error.message : 'Unknown error',
			retryAfter: 30,
		});
	}
}
