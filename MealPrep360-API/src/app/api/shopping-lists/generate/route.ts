import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User, ShoppingList, MealPlan, Recipe } from '@/lib/mongodb/schemas';
import { serviceDiscovery } from '@/lib/services/discovery';
import { resilientClient } from '@/lib/services/resilience';
import { getOrCreateUser } from '@/lib/getOrCreateUser';

export async function POST(request: NextRequest) {
	try {
		// Check for debug mode (development only)
		const isDebugMode =
			process.env.DEBUG_MODE === 'true' &&
			process.env.NODE_ENV === 'development';

		let clerkId: string | null = null;

		if (isDebugMode) {
			// In debug mode, use a default user ID for testing
			clerkId = 'debug_user_' + Date.now();
			console.log('🔧 DEBUG MODE: Using debug user ID:', clerkId);
		} else {
			// Normal authentication flow
			const authResult = await auth();
			clerkId = authResult.userId;

			if (!clerkId) {
				return NextResponse.json(
					{
						error: 'Unauthorized',
						debug: {
							message: 'No authentication token provided',
							suggestions: [
								'Include Authorization header with Bearer token',
								'Ensure you are logged in to the frontend',
								'Check that Clerk authentication is working',
							],
						},
					},
					{ status: 401 }
				);
			}
		}

		let user;
		if (isDebugMode) {
			// In debug mode, use a mock user
			user = {
				_id: 'debug_user_id',
				email: 'debug@example.com',
				name: 'Debug User',
			};
			console.log('🔧 DEBUG MODE: Using mock user:', user);
		} else {
			await connectDB();
			user = await getOrCreateUser(clerkId);
		}

		const { mealPlanId, startDate, endDate } = await request.json();
		console.log(`[SHOPPING_LIST_GENERATE] Request parameters:`, {
			mealPlanId,
			startDate,
			endDate,
			hasStartDate: !!startDate,
			hasEndDate: !!endDate,
		});

		if (!mealPlanId) {
			return NextResponse.json(
				{ error: 'Meal plan ID is required' },
				{ status: 400 }
			);
		}

		let mealPlan;
		if (isDebugMode) {
			// In debug mode, use a mock meal plan
			mealPlan = {
				_id: mealPlanId,
				startDate: new Date(),
				endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
				recipeItems: [
					{
						recipeId: 'test_recipe',
						servings: 4,
						status: 'planned',
					},
				],
			};
			console.log('🔧 DEBUG MODE: Using mock meal plan:', mealPlan);
		} else {
			// Fetch the meal plan from the database - no need to populate recipe details
			mealPlan = await MealPlan.findById(mealPlanId);
			if (!mealPlan) {
				return NextResponse.json(
					{ error: 'Meal plan not found' },
					{ status: 404 }
				);
			}
		}

		console.log(`[SHOPPING_LIST_GENERATE] Meal plan found:`, {
			id: mealPlan._id,
			startDate: mealPlan.startDate,
			endDate: mealPlan.endDate,
			recipeItemsCount: mealPlan.recipeItems?.length || 0,
			daysCount: mealPlan.days?.length || 0,
		});

		interface RecipeItem {
			recipeId: string;
			servings: number;
			status: string;
		}

		// Filter recipe items based on date range if provided
		let recipeItemsToProcess = mealPlan.recipeItems || [];

		console.log(
			`[SHOPPING_LIST_GENERATE] Total recipe items found: ${recipeItemsToProcess.length}`
		);
		console.log(
			`[SHOPPING_LIST_GENERATE] Recipe items count: ${recipeItemsToProcess.length}`
		);

		// If no recipeItems, try using days array
		if (
			recipeItemsToProcess.length === 0 &&
			mealPlan.days &&
			mealPlan.days.length > 0
		) {
			console.log(
				`[SHOPPING_LIST_GENERATE] No recipeItems found, using days array instead`
			);
			recipeItemsToProcess = mealPlan.days.map((day: any) => ({
				date: day.date,
				recipeId: day.recipeId,
				servings: 4, // Default servings
				status: day.status || 'planned',
				mealType: day.mealType || 'dinner',
				dayIndex: day.dayIndex,
			}));
			console.log(
				`[SHOPPING_LIST_GENERATE] Converted days to recipe items: ${recipeItemsToProcess.length}`
			);
		}

		// Log the date filtering parameters
		console.log(`[SHOPPING_LIST_GENERATE] Date filtering parameters:`, {
			startDate,
			endDate,
			mealPlanStartDate: mealPlan.startDate,
			mealPlanEndDate: mealPlan.endDate,
		});

		// Determine the date range to use
		let effectiveStartDate: Date;
		let effectiveEndDate: Date;
		let usingMealPlanDates = false;

		if (startDate && endDate) {
			const requestedStart = new Date(startDate);
			const requestedEnd = new Date(endDate);
			const mealPlanStart = new Date(mealPlan.startDate);
			const mealPlanEnd = new Date(mealPlan.endDate);

			// Check if requested dates overlap with meal plan dates
			const hasOverlap =
				requestedStart <= mealPlanEnd && requestedEnd >= mealPlanStart;

			if (hasOverlap) {
				// Use the intersection of requested dates and meal plan dates
				effectiveStartDate = new Date(
					Math.max(requestedStart.getTime(), mealPlanStart.getTime())
				);
				effectiveEndDate = new Date(
					Math.min(requestedEnd.getTime(), mealPlanEnd.getTime())
				);
				console.log(
					`[SHOPPING_LIST_GENERATE] Using intersection of requested and meal plan dates`
				);
			} else {
				// No overlap, use meal plan dates
				effectiveStartDate = mealPlanStart;
				effectiveEndDate = mealPlanEnd;
				usingMealPlanDates = true;
				console.log(
					`[SHOPPING_LIST_GENERATE] Requested dates don't overlap with meal plan, using meal plan dates`
				);
			}
		} else {
			// No dates provided, use meal plan dates
			effectiveStartDate = new Date(mealPlan.startDate);
			effectiveEndDate = new Date(mealPlan.endDate);
			usingMealPlanDates = true;
			console.log(
				`[SHOPPING_LIST_GENERATE] No dates provided, using meal plan dates`
			);
		}

		console.log(`[SHOPPING_LIST_GENERATE] Effective date filtering with:`, {
			start: effectiveStartDate.toISOString(),
			end: effectiveEndDate.toISOString(),
			usingMealPlanDates,
		});

		recipeItemsToProcess = recipeItemsToProcess.filter((item: any) => {
			if (!item.date) {
				console.log(
					`[SHOPPING_LIST_GENERATE] Item has no date, including:`,
					item
				);
				return true; // Include items without dates
			}
			const itemDate = new Date(item.date);
			const isInRange =
				itemDate >= effectiveStartDate && itemDate <= effectiveEndDate;
			console.log(`[SHOPPING_LIST_GENERATE] Item date check:`, {
				itemDate: itemDate.toISOString(),
				start: effectiveStartDate.toISOString(),
				end: effectiveEndDate.toISOString(),
				isInRange,
				item: {
					date: item.date,
					status: item.status,
					recipeId: item.recipeId?._id || item.recipeId,
				},
			});
			return isInRange;
		});
		console.log(
			`[SHOPPING_LIST_GENERATE] After date filtering: ${recipeItemsToProcess.length} items`
		);

		// Get active recipe items (not skipped and have recipes)
		console.log(
			`[SHOPPING_LIST_GENERATE] Processing ${recipeItemsToProcess.length} items for active recipes`
		);

		const activeRecipeItems = recipeItemsToProcess
			.filter((item: any) => {
				// Handle both string recipeIds (from days) and ObjectId recipeIds (from recipeItems)
				const hasRecipe = item.recipeId && (item.recipeId._id || item.recipeId);
				const notSkipped =
					item.status !== 'skipped' && item.status !== 'cancelled';
				const recipeId = item.recipeId?._id || item.recipeId;
				console.log(
					`[SHOPPING_LIST_GENERATE] Item check - hasRecipe: ${hasRecipe}, notSkipped: ${notSkipped}, status: ${item.status}, recipeId: ${recipeId || 'null'}`
				);
				return hasRecipe && notSkipped;
			})
			.map((item: any) => {
				// Get recipe ID - handle both populated and unpopulated cases
				const recipeId = item.recipeId._id
					? item.recipeId._id.toString()
					: item.recipeId.toString();

				return {
					recipeId,
					servings: item.servings || 4,
					status: item.status,
				};
			}) as RecipeItem[];

		console.log(
			`[SHOPPING_LIST_GENERATE] Active recipe items found: ${activeRecipeItems.length}`
		);

		// Log summary of active recipe items
		console.log(`[SHOPPING_LIST_GENERATE] Active recipes summary:`, {
			count: activeRecipeItems.length,
			servingsRange: {
				min: Math.min(...activeRecipeItems.map((item) => item.servings)),
				max: Math.max(...activeRecipeItems.map((item) => item.servings)),
			},
		});

		if (activeRecipeItems.length === 0) {
			console.log(
				`[SHOPPING_LIST_GENERATE] No active recipes found. Debug info:`,
				{
					totalItems: mealPlan.recipeItems?.length || 0,
					totalDays: mealPlan.days?.length || 0,
					itemsWithRecipes: recipeItemsToProcess.filter(
						(item: any) => item.recipeId && (item.recipeId._id || item.recipeId)
					).length,
					itemsNotSkipped: recipeItemsToProcess.filter(
						(item: any) => item.status !== 'skipped'
					).length,
					itemsWithRecipesAndNotSkipped: recipeItemsToProcess.filter(
						(item: any) =>
							item.recipeId &&
							(item.recipeId._id || item.recipeId) &&
							item.status !== 'skipped'
					).length,
					sampleItems: recipeItemsToProcess.slice(0, 3).map((item: any) => ({
						hasRecipe: !!(
							item.recipeId &&
							(item.recipeId._id || item.recipeId)
						),
						status: item.status,
						recipeId: item.recipeId?._id || item.recipeId,
					})),
				}
			);
			return NextResponse.json(
				{ error: 'No active recipes found in meal plan' },
				{ status: 400 }
			);
		}

		let recipes;
		if (isDebugMode) {
			// In debug mode, use mock recipes
			recipes = activeRecipeItems.map((item) => ({
				_id: item.recipeId,
				title: 'Test Recipe',
				ingredients: [
					{
						name: 'Test Ingredient',
						amount: 1,
						unit: 'piece',
						category: 'Other',
					},
				],
				servings: 4,
			}));
			console.log('🔧 DEBUG MODE: Using mock recipes:', recipes);
		} else {
			// Fetch recipes from database
			const recipeIds = activeRecipeItems.map((item) => item.recipeId);
			recipes = await Recipe.find({ _id: { $in: recipeIds } });

			console.log(
				`[SHOPPING_LIST_GENERATE] Fetched ${recipes.length} recipes from database`
			);

			if (recipes.length === 0) {
				return NextResponse.json(
					{ error: 'No recipes found for the meal plan' },
					{ status: 404 }
				);
			}
		}

		// Create a map of recipe ID to recipe for easy lookup
		const recipeMap = new Map(
			recipes.map((recipe) => [recipe._id.toString(), recipe])
		);

		// Prepare meal plans for processing
		const processableMealPlans = activeRecipeItems
			.map((item) => {
				const recipe = recipeMap.get(item.recipeId);
				if (!recipe) {
					console.log(
						`[SHOPPING_LIST_GENERATE] Recipe not found for ID: ${item.recipeId}`
					);
					return null;
				}
				return {
					recipeId: item.recipeId,
					recipe: {
						title: recipe.title || 'Untitled Recipe',
						ingredients: recipe.ingredients || [],
						servings: recipe.servings || 1,
					},
					servings: item.servings,
				};
			})
			.filter(
				(
					item
				): item is {
					recipeId: string;
					recipe: { title: string; ingredients: any[] | string; servings: number };
					servings: number;
				} => item !== null
			);

		console.log(
			`[SHOPPING_LIST_GENERATE] Processable meal plans: ${processableMealPlans.length}`
		);

		if (processableMealPlans.length === 0) {
			return NextResponse.json(
				{ error: 'No valid recipes found for processing' },
				{ status: 400 }
			);
		}

		console.log(
			`[SHOPPING_LIST_GENERATE] Using external shopping service (required)`
		);

		const shoppingService = serviceDiscovery.getService('shopping-service');

		console.log(`🔍 Shopping service health check result:`, {
			hasService: !!shoppingService,
			serviceUrl: shoppingService?.endpoint.url || 'Not found',
			allServices: serviceDiscovery.listServices().map((s) => s.name),
		});

		if (!shoppingService) {
			return NextResponse.json(
				{
					error: 'Shopping service unavailable',
					message:
						'The external shopping list service is currently unavailable. Please try again later.',
				},
				{ status: 503 }
			);
		}

		console.log(
			`[SHOPPING_LIST_GENERATE] Using shopping service at ${shoppingService.endpoint.url}`
		);

		// Log the meal plans that will be processed
		console.log(`[SHOPPING_LIST_GENERATE] Processing ${processableMealPlans.length} meal plan items`);

		let serviceData: any;
		try {
			// Prepare basic meal plan data for external service
			const recipesForService = processableMealPlans.map((item) => ({
				id: item.recipeId,
				title: item.recipe.title,
				servings: item.servings || 1,
				ingredients: item.recipe.ingredients
			}));

			// Use resilient client with retry logic for external shopping service
			serviceData = await resilientClient.post(
				`${shoppingService.endpoint.url}/api/shopping-list`,
				{
					recipes: recipesForService,
					userId: user._id.toString(),
					pantryExclusions: [],
				},
				{
					headers: {
						'Content-Type': 'application/json',
						'X-API-Key': process.env.SHOPPING_SERVICE_API_KEY,
					}
				}
			);

			console.log(
				`[SHOPPING_LIST_GENERATE] External shopping service response received`
			);

			// Process the external service response and save to database
			const processedItems = (
				Array.isArray(serviceData)
					? serviceData
					: serviceData.shoppingList?.items || serviceData.items || []
			).map((item: any, index: number) => ({
				id: `${new Date().getTime()}-${index}`,
				name: item.name,
				quantity: item.amount || item.quantity || 1,
				unit: item.unit || 'piece',
				category: item.category || 'Other',
				status: 'PENDING',
			}));

			// Save the shopping list to our database
			const shoppingList = await ShoppingList.create({
				userId: user._id,
				name: `Shopping List ${new Date().toLocaleDateString()}`,
				status: 'ACTIVE',
				items: processedItems,
			});

			console.log(
				`[SHOPPING_LIST_GENERATE] Shopping list created from external service:`,
				{
					id: shoppingList._id,
					itemsCount: shoppingList.items?.length || 0,
				}
			);

			const responseData: any = { shoppingList };
			// Add warning if we used meal plan dates instead of requested dates
			if (usingMealPlanDates && startDate && endDate) {
				responseData.warning = `Requested dates (${startDate} to ${endDate}) don't overlap with meal plan dates (${mealPlan.startDate.toISOString()} to ${mealPlan.endDate.toISOString()}). Using meal plan dates instead.`;
			}

			return NextResponse.json(responseData);
		} catch (error) {
			console.error(
				`[SHOPPING_LIST_GENERATE] External shopping service call failed:`,
				error
			);

			// Enhanced error handling for HTML responses
			if (error && typeof error === 'object' && 'response' in error) {
				const axiosError = error as any;
				if (axiosError.response?.headers?.['content-type']?.includes('text/html')) {
					console.error('External API returned HTML instead of JSON - service may be misconfigured');
					return NextResponse.json(
						{
							error: 'External API returned HTML error page instead of JSON response. The external API at ' + shoppingService.endpoint.url + ' may be down or misconfigured.',
							status: axiosError.response?.status || 500,
							endpoint: '/shopping-lists',
							baseURL: shoppingService.endpoint.url,
							userId: user._id.toString(),
							timestamp: new Date().toISOString()
						},
						{ status: 503 }
					);
				}
			}

			return NextResponse.json(
				{
					error: 'Shopping service unavailable',
					message:
						'The external shopping list service is currently unavailable. Please try again later.',
					details: {
						error: error instanceof Error ? error.message : 'Unknown error',
					},
				},
				{ status: 503 }
			);
		}
	} catch (error) {
		console.error('Shopping list generation error:', error);
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: 'Failed to generate shopping list',
				message:
					'An error occurred while generating the shopping list. Please try again later.',
			},
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
