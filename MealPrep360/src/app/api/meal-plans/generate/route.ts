import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import jwt from 'jsonwebtoken';
import { API_CONFIG } from '@/lib/api-config';
import { serverApiClient } from '@/lib/api-client-server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
	try {
		const { userId, getToken } = await auth();
		const token = await getToken();

		// Enhanced logging for debugging
		console.log('🔍 Meal Plan Generation - Starting request');
		console.log('👤 User ID:', userId ? 'present' : 'missing');
		console.log('🔑 Token available:', !!token);

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
			console.error('❌ Unauthorized: No user ID found');
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		console.log('📦 Request body:', JSON.stringify(body, null, 2));
		console.log(
			'🍽️ Meals per day requested:',
			body.mealsPerDay || 'not specified'
		);

		// Normalize inputs: ensure mealsPerDay is set, coerce duration to integer, and use YYYY-MM-DD for startDate
		const normalizeDateOnly = (value: unknown) => {
			if (!value) return undefined;
			if (typeof value === 'string') {
				return value.includes('T') ? value.split('T')[0] : value;
			}
			try {
				const iso = new Date(value as any).toISOString();
				return iso.split('T')[0];
			} catch {
				return undefined;
			}
		};

		const normalizedStartDate = normalizeDateOnly(body.startDate);
		const normalizedDuration = Number.isFinite(Number(body.duration))
			? Math.max(1, parseInt(String(body.duration), 10))
			: 7;

		const requestBody = {
			...body,
			startDate: normalizedStartDate || body.startDate,
			duration: normalizedDuration,
			mealsPerDay: body.mealsPerDay || 1,
		} as Record<string, unknown>;

		console.log('🍽️ Final meals per day:', requestBody.mealsPerDay);
		console.log(
			'🌐 External API endpoint:',
			API_CONFIG.endpoints.mealPlansGenerate
		);
		console.log(
			'🔗 Full URL:',
			`${API_CONFIG.baseURL}${API_CONFIG.endpoints.mealPlansGenerate}`
		);

		// Make the request to the main API using the shared server API client
		console.log('🚀 Making meal plan generation request to main API...');

		const apiResponse = await serverApiClient.post(
			API_CONFIG.endpoints.mealPlansGenerate,
			requestBody,
			{ requestContext: request }
		);

		console.log('📥 External API response:', {
			success: apiResponse.success,
			status: apiResponse.status,
			hasData: !!apiResponse.data,
			error: apiResponse.error,
		});

		if (!apiResponse.success) {
			const responseStatus = apiResponse.status || 500;
			console.error('❌ Meal plan service error status:', responseStatus);

			// Provide specific error messages and map status codes
			if (responseStatus === 401) {
				return NextResponse.json(
					{
						error: 'Meal plan service authentication failed',
						details:
							apiResponse.error ||
							'Authentication error with external meal plan service',
						type: 'MEAL_PLAN_SERVICE_AUTH_ERROR',
						status: responseStatus,
					},
					{ status: 401 }
				);
			}

			if (responseStatus === 403) {
				return NextResponse.json(
					{
						error: 'Access denied by meal plan service',
						details: apiResponse.error,
						type: 'MEAL_PLAN_SERVICE_FORBIDDEN',
						status: responseStatus,
					},
					{ status: 403 }
				);
			}

			if (responseStatus === 404) {
				return NextResponse.json(
					{
						error: 'Meal plan generation endpoint not found',
						details: apiResponse.error,
						type: 'MEAL_PLAN_SERVICE_NOT_FOUND',
						status: responseStatus,
					},
					{ status: 404 }
				);
			}

			if (responseStatus === 409) {
				return NextResponse.json(
					{
						error: 'A meal plan already exists for the specified range',
						details: apiResponse.error,
						type: 'MEAL_PLAN_CONFLICT',
						status: responseStatus,
					},
					{ status: 409 }
				);
			}

			if (responseStatus === 429) {
				return NextResponse.json(
					{
						error: 'Rate limit exceeded for meal plan generation',
						details: apiResponse.error,
						type: 'MEAL_PLAN_RATE_LIMITED',
						status: responseStatus,
					},
					{ status: 429 }
				);
			}

			if (responseStatus === 400) {
				return NextResponse.json(
					{
						error: apiResponse.error || 'Invalid meal plan request',
						details: 'The request to generate a meal plan was invalid',
						type: 'BAD_REQUEST',
						status: responseStatus,
					},
					{ status: 400 }
				);
			}

			// 5xx → service unavailable to the client
			return NextResponse.json(
				{
					error: 'Meal plan service server error',
					details: apiResponse.error,
					type: 'MEAL_PLAN_SERVICE_ERROR',
					status: responseStatus,
				},
				{ status: 503 }
			);
		}

		const mealPlanData = apiResponse.data as any;
		console.log('📊 Meal plan generation response data:', mealPlanData);
		if (mealPlanData && mealPlanData.days && Array.isArray(mealPlanData.days)) {
			console.log('📅 Meal plan days structure:', {
				daysLength: mealPlanData.days.length,
				firstDayStructure: mealPlanData.days[0]
					? Object.keys(mealPlanData.days[0])
					: 'No days',
				firstDayRecipeId: mealPlanData.days[0]?.recipeId,
				firstDayHasRecipe: !!mealPlanData.days[0]?.recipe,
			});

			const dateCounts: Record<string, number> = {};
			mealPlanData.days.forEach((day: any) => {
				if (day.date) {
					const dateKey = new Date(day.date).toISOString().split('T')[0];
					dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
				}
			});
			const datesWithMultipleMeals = Object.entries(dateCounts).filter(
				([, count]) => count > 1
			);
			if (datesWithMultipleMeals.length > 0) {
				console.warn(
					'⚠️ External API generated multiple meals per day:',
					datesWithMultipleMeals
				);
			} else {
				console.log('✅ External API generated one meal per day as requested');
			}
		}

		console.log('✅ Meal plan generation successful via meal plan service');
		return NextResponse.json(mealPlanData);
	} catch (error) {
		console.error('💥 Unexpected error in meal plan generation:', error);

		// Provide more detailed error information
		let errorMessage = 'Internal server error';
		let errorDetails = 'An unexpected error occurred';

		if (error instanceof Error) {
			errorMessage = error.message;
			errorDetails = error.stack || 'No stack trace available';
		}

		console.error('📋 Error details:', {
			message: errorMessage,
			details: errorDetails,
			timestamp: new Date().toISOString(),
		});

		return NextResponse.json(
			{
				error: errorMessage,
				details: errorDetails,
				type: 'INTERNAL_SERVER_ERROR',
				timestamp: new Date().toISOString(),
			},
			{ status: 500 }
		);
	}
}
