import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serverApiClient } from '@/lib/api-client-server';
import { API_CONFIG } from '@/lib/api-config';
import jwt from 'jsonwebtoken';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// POST /api/shopping-lists/generate - Generate optimized shopping list
export async function POST(request: NextRequest) {
	try {
		const { userId, getToken } = await auth();
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
					console.log(
						'Decoded JWT (redacted):',
						JSON.stringify(redacted, null, 2)
					);
				} else {
					console.log('Decoded JWT (redacted):', '[Unable to decode]');
				}
			} catch (err) {
				console.log('Error decoding JWT:', err);
			}
		} else {
			console.log('No JWT token available to decode.');
		}
		console.log(
			'API authentication code: Using Bearer token in Authorization header.'
		);

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		console.log(
			'🔍 Shopping List Generation - Request body:',
			JSON.stringify(body, null, 2)
		);
		console.log('🔍 Request body validation fields:', {
			hasRecipes: body.hasRecipes,
			hasRecipesType: typeof body.hasRecipes,
			recipeCount: body.recipeCount,
			recipeCountType: typeof body.recipeCount,
		});

		// Validate meal plan exists on external API
		if (body.mealPlanId) {
			console.log(
				'🔍 Shopping list generation for meal plan:',
				body.mealPlanId
			);
			console.log('📊 Meal plan data:', {
				id: body.mealPlanId,
				hasDays: body.hasDays,
				daysLength: body.daysLength,
				hasRecipes: body.hasRecipes,
				recipeCount: body.recipeCount || 0,
			});
			console.log('🌐 External API base URL:', API_CONFIG.baseURL);
			console.log(
				'🔗 Full shopping list generation URL:',
				`${API_CONFIG.baseURL}${API_CONFIG.endpoints.shoppingListsGenerate}`
			);
		}

		// Early validation: Check if meal plan has recipes
		if (
			body.hasRecipes === false ||
			body.hasRecipes === 'false' ||
			!body.hasRecipes ||
			(body.recipeCount !== undefined && body.recipeCount === 0)
		) {
			console.log('⚠️ Meal plan has no recipes - skipping external API call');
			console.log('🔍 Validation details:', {
				hasRecipes: body.hasRecipes,
				hasRecipesType: typeof body.hasRecipes,
				recipeCount: body.recipeCount,
				recipeCountType: typeof body.recipeCount,
			});
			return NextResponse.json(
				{
					error: 'No recipes found in meal plan',
					details:
						'Please add recipes to your meal plan before generating a shopping list. Your meal plan currently has no recipes assigned.',
					type: 'NO_RECIPES_FOUND',
					mealPlanId: body.mealPlanId,
				},
				{ status: 400 }
			);
		}

		console.log(
			'🌐 External API endpoint:',
			API_CONFIG.endpoints.shoppingListsGenerate
		);
		console.log(
			'🔗 Full URL:',
			`${API_CONFIG.baseURL}${API_CONFIG.endpoints.shoppingListsGenerate}`
		);
		console.log('🚀 Making request to external API...');

		// Prepare the request body for external API
		const externalApiBody = {
			userId: userId,
			mealPlanId: body.mealPlanId,
			...(body.pantryExclusions && {
				pantryExclusions: body.pantryExclusions,
			}),
		};

		console.log(
			'📤 Request body for external API:',
			JSON.stringify(externalApiBody, null, 2)
		);

		// Make request to external API using serverApiClient
		const response = await serverApiClient.post(
			API_CONFIG.endpoints.shoppingListsGenerate,
			externalApiBody,
			{
				requestContext: request
			}
		);

		console.log('📥 External API response:', {
			success: response.success,
			status: response.status,
			hasData: response.success,
			error: response.error,
		});

		if (!response.success) {
			console.error('❌ External API error:', {
				error: response.error,
				status: response.status,
			});

			// Handle specific error cases for no recipes
			if (
				response.status === 400 &&
				(response.error?.includes('No active recipes found') ||
					response.error?.includes('no recipes') ||
					response.error?.includes('No recipes') ||
					response.error?.includes('empty meal plan') ||
					response.error?.includes('no meals'))
			) {
				return NextResponse.json(
					{
						error: 'No recipes found in meal plan',
						details:
							'Please add recipes to your meal plan before generating a shopping list. Your meal plan currently has no recipes assigned.',
						type: 'NO_RECIPES_FOUND',
						mealPlanId: body.mealPlanId,
					},
					{ status: 400 }
				);
			}

			// Handle 404 errors specifically
			if (response.status === 404) {
				return NextResponse.json(
					{
						error:
							'Your meal plan was not found on the external service. Please regenerate your meal plan and try again.',
						details: `The meal plan '${body.mealPlanId}' was not found on the external API. Please ensure the meal plan exists and is accessible.`,
						type: 'MEAL_PLAN_NOT_FOUND_EXTERNAL',
						status: response.status,
						requestedId: body.mealPlanId,
					},
					{ status: 404 }
				);
			}

			// Handle 400 errors (bad request)
			if (response.status === 400) {
				return NextResponse.json(
					{
						error: response.error || 'Invalid request to external API',
						details:
							'The request to generate a shopping list was invalid. Please check your meal plan and try again.',
						type: 'BAD_REQUEST',
						status: response.status,
						mealPlanId: body.mealPlanId,
					},
					{ status: 400 }
				);
			}

			// Handle 503 errors (service unavailable)
			if (response.status === 503) {
				return NextResponse.json(
					{
						error: 'Shopping list service temporarily unavailable',
						details:
							'The shopping list generation service is currently unavailable. Please try again in a few minutes.',
						type: 'SERVICE_UNAVAILABLE',
						status: response.status,
						mealPlanId: body.mealPlanId,
						retryAfter: '5 minutes',
					},
					{ status: 503 }
				);
			}

			return NextResponse.json(
				{
					error:
						response.error || 'External API shopping list generation failed',
					details: 'External API shopping list generation failed',
					type: 'EXTERNAL_API_ERROR',
					status: response.status,
					mealPlanId: body.mealPlanId,
				},
				{ status: 500 }
			);
		}

		// Add detailed response logging
		console.log(
			'📥 External API response data:',
			JSON.stringify(response.data, null, 2)
		);
		return NextResponse.json(response.data);
	} catch (error) {
		console.error('Error generating shopping list:', error);
		return NextResponse.json(
			{
				error: 'Failed to connect to external API',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
