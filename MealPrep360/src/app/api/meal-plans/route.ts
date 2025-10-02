import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serverApiClient } from '@/lib/api-client-server';
import { API_CONFIG } from '@/lib/api-config';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
import jwt from 'jsonwebtoken';

// GET /api/meal-plans - Get user's meal plans
export async function GET(request: NextRequest) {
	try {
		const { userId, getToken } = await auth();
		const token = await getToken();

		console.log('🔍 Meal Plans API - Starting request');
		console.log('👤 User ID:', userId ? 'present' : 'missing');
		console.log('🔑 Token available:', !!token);
		console.log('🔑 Token length:', token?.length || 0);
		console.log(
			'🔑 Token preview:',
			token ? `${token.substring(0, 20)}...` : 'no token'
		);
		console.log('🌐 API Base URL:', API_CONFIG.baseURL);
		console.log(
			'🌐 Environment NEXT_PUBLIC_API_URL:',
			process.env.NEXT_PUBLIC_API_URL || 'not set'
		);

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

		const { searchParams } = new URL(request.url);
		const params = Object.fromEntries(searchParams.entries());

		// Normalize date params to YYYY-MM-DD to avoid timezone-related issues with external API
		const normalizeDateParam = (value?: string) => {
			if (!value) return undefined;
			// If ISO string with time, trim to date part
			if (value.includes('T')) return value.split('T')[0];
			return value;
		};

		const normalizedStartDate = normalizeDateParam(params.startDate as string);
		const normalizedEndDate = normalizeDateParam(params.endDate as string);

		// Log the full URL with query string for debugging
		const url = new URL(API_CONFIG.endpoints.mealPlans, API_CONFIG.baseURL);
		Object.entries(params).forEach(([key, value]) =>
			url.searchParams.append(key, value)
		);
		console.log('External API FULL URL:', url.toString());
		console.log(
			'External API endpoint:',
			API_CONFIG.endpoints.mealPlans,
			'Params:',
			params
		);

		// Add includeRecipes parameter to get recipe data in a single request
		// and use normalized date params expected by the external API
		const apiParams = {
			...params,
			...(normalizedStartDate && { startDate: normalizedStartDate }),
			...(normalizedEndDate && { endDate: normalizedEndDate }),
			includeRecipes: 'true',
		} as Record<string, string>;

		console.log('🚀 Making request to external API with params:', apiParams);
		console.log(
			'🔗 Full external API URL:',
			`${API_CONFIG.baseURL}${API_CONFIG.endpoints.mealPlans}`
		);
		console.log('⏱️ Request timeout: 30 seconds');

		let response = await serverApiClient.get(
			API_CONFIG.endpoints.mealPlans,
			apiParams,
			{ requestContext: request }
		);

		console.log('📥 External API response:', {
			success: response.success,
			status: response.status,
			hasData: !!response.data,
			dataType: typeof response.data,
			isArray: Array.isArray(response.data),
			error: response.error,
		});

		// If the response succeeded but returned an empty array, the external API
		// may be expecting different parameter combinations. Retry without
		// includeRecipes first, then alternative param names.
		if (
			response.success &&
			Array.isArray(response.data) &&
			response.data.length === 0 &&
			(normalizedStartDate || normalizedEndDate)
		) {
			try {
				// Retry without includeRecipes (some APIs treat this as a filter)
				if (apiParams.includeRecipes === 'true') {
					const retryNoInc: Record<string, string> = {
						...(normalizedStartDate && { startDate: normalizedStartDate }),
						...(normalizedEndDate && { endDate: normalizedEndDate }),
					};
					console.warn(
						'⚠️ Empty result with includeRecipes. Retrying without includeRecipes. Params:',
						retryNoInc
					);
					const noIncResponse = await serverApiClient.get(
						API_CONFIG.endpoints.mealPlans,
						retryNoInc,
						{ requestContext: request }
					);
					if (
						noIncResponse.success &&
						Array.isArray(noIncResponse.data) &&
						noIncResponse.data.length > 0
					) {
						console.log(
							'✅ Retry without includeRecipes returned data. Using fallback response.'
						);
						response = noIncResponse;
					}
				}

				// First retry with from/to
				const altParamsFT: Record<string, string> = {};
				if (normalizedStartDate) altParamsFT.from = normalizedStartDate;
				if (normalizedEndDate) altParamsFT.to = normalizedEndDate;
				// Do not include includeRecipes on fallback to reduce filtering issues
				console.warn(
					'⚠️ Empty result with startDate/endDate. Retrying with alternative param names (from/to):',
					altParamsFT
				);
				const altFTResponse = await serverApiClient.get(
					API_CONFIG.endpoints.mealPlans,
					altParamsFT,
					{ requestContext: request }
				);
				if (
					altFTResponse.success &&
					Array.isArray(altFTResponse.data) &&
					altFTResponse.data.length > 0
				) {
					console.log(
						'✅ Alt (from/to) returned data. Using fallback response.'
					);
					response = altFTResponse;
				} else {
					// Second retry with start/end
					const altParamsSE: Record<string, string> = {};
					if (normalizedStartDate) altParamsSE.start = normalizedStartDate;
					if (normalizedEndDate) altParamsSE.end = normalizedEndDate;
					// Do not include includeRecipes on fallback
					console.warn(
						'⚠️ Empty result persists. Retrying with alternative param names (start/end):',
						altParamsSE
					);
					const altSEResponse = await serverApiClient.get(
						API_CONFIG.endpoints.mealPlans,
						altParamsSE,
						{ requestContext: request }
					);
					if (
						altSEResponse.success &&
						Array.isArray(altSEResponse.data) &&
						altSEResponse.data.length > 0
					) {
						console.log(
							'✅ Alt (start/end) returned data. Using fallback response.'
						);
						response = altSEResponse;
					}
				}
			} catch (altErr) {
				console.warn('⚠️ Alternative param retry failed:', altErr);
			}
		}

		// Normalize response data shape to always return an array to the client
		let normalizedData: any[] | undefined = undefined;
		if (Array.isArray(response.data)) {
			normalizedData = response.data as any[];
		} else if (response.data && typeof response.data === 'object') {
			const obj: any = response.data;
			if (Array.isArray(obj.data)) normalizedData = obj.data;
			else if (Array.isArray(obj.items)) normalizedData = obj.items;
			else if (Array.isArray(obj.plans)) normalizedData = obj.plans;
			else if (Array.isArray(obj.results)) normalizedData = obj.results;
			else normalizedData = [obj];
		} else if (!response.data) {
			normalizedData = [];
		}

		// If external API fails with a 500 that mentions a nested 404, retry without includeRecipes
		if (
			!response.success &&
			(response.status === 500 || response.status === 502) &&
			(response.error?.includes('404') ||
				response.error?.includes('Internal server error')) &&
			apiParams.includeRecipes === 'true'
		) {
			const retryParams = { ...apiParams } as Record<string, string>;
			delete retryParams.includeRecipes;
			console.warn(
				'⚠️ External API failed with includeRecipes. Retrying without includeRecipes. Params:',
				retryParams
			);
			const retryResponse = await serverApiClient.get(
				API_CONFIG.endpoints.mealPlans,
				retryParams,
				{ requestContext: request }
			);
			console.log('🔁 Retry response:', {
				success: retryResponse.success,
				status: retryResponse.status,
				hasData: !!retryResponse.data,
				isArray: Array.isArray(retryResponse.data),
				error: retryResponse.error,
			});

			if (retryResponse.success) {
				response = retryResponse;
			}
		}

		// If still failing, try alternate param names (from/to) without includeRecipes
		if (
			!response.success &&
			(response.status === 500 || response.status === 404) &&
			(response.error?.includes('404') ||
				response.error?.toLowerCase().includes('not found'))
		) {
			const altParams: Record<string, string> = {};
			if (normalizedStartDate) altParams.from = normalizedStartDate;
			if (normalizedEndDate) altParams.to = normalizedEndDate;
			console.warn(
				'⚠️ Retrying with alternative param names (from/to):',
				altParams
			);
			const altResponse = await serverApiClient.get(
				API_CONFIG.endpoints.mealPlans,
				altParams,
				{ requestContext: request }
			);
			console.log('🔁 Alt params retry response:', {
				success: altResponse.success,
				status: altResponse.status,
				hasData: !!altResponse.data,
				isArray: Array.isArray(altResponse.data),
				error: altResponse.error,
			});
			if (altResponse.success) {
				response = altResponse;
			}
		}

		if (!response.success) {
			console.error('❌ External API error:', response.error);
			console.error('❌ External API status:', response.status);

			// Provide more specific error messages based on status code
			let errorMessage =
				response.error || 'Failed to fetch meal plans from external API';
			let errorType = 'EXTERNAL_API_ERROR';
			let statusCode = 500;

			if (response.status === 503) {
				errorMessage = 'External API service is temporarily unavailable';
				errorType = 'EXTERNAL_API_UNAVAILABLE';
				statusCode = 503;
			} else if (response.status === 404) {
				errorMessage = 'Meal plans endpoint not found on external API';
				errorType = 'EXTERNAL_API_NOT_FOUND';
				statusCode = 404;
			} else if (response.status === 401) {
				errorMessage =
					'Authentication failed with external API - the external API is not configured to accept Clerk JWT tokens';
				errorType = 'EXTERNAL_API_AUTH_ERROR';
				statusCode = 401;
			} else if (response.status === 403) {
				errorMessage =
					'Access forbidden to external API - insufficient permissions';
				errorType = 'EXTERNAL_API_FORBIDDEN';
				statusCode = 403;
			} else if (response.error && response.error.includes('HTML')) {
				errorMessage =
					'External API is returning HTML error pages instead of JSON responses';
				errorType = 'EXTERNAL_API_HTML_ERROR';
				statusCode = 500;
			}

			return NextResponse.json(
				{
					error: errorMessage,
					details: 'External API connection failed',
					type: errorType,
					status: response.status,
					externalApiUrl: API_CONFIG.baseURL + API_CONFIG.endpoints.mealPlans,
					timestamp: new Date().toISOString(),
					troubleshooting: {
						checkExternalApi:
							'Verify that https://api.mealprep360.com is accessible and responding with JSON',
						checkNetwork: 'Check network connectivity and firewall settings',
						testConnection:
							'Use /api/test-connection endpoint to test external API connectivity',
						...(statusCode === 401 && {
							authIssue:
								'The external API is not configured to accept Clerk JWT tokens',
							authSolution:
								'Contact the API administrator to configure Clerk JWT token acceptance',
							testAuth: 'Use /api/test-auth endpoint to verify authentication',
						}),
						...(response.error &&
							response.error.includes('HTML') && {
								htmlIssue:
									'The external API is returning HTML error pages instead of JSON',
								htmlSolution:
									'The external API server may be down or misconfigured',
								contactAdmin:
									'Contact the API administrator to check server status',
							}),
						contactSupport:
							'If the issue persists, contact support with the error details above',
					},
				},
				{ status: statusCode }
			);
		}

		console.log(
			'📦 Meal plans API normalized data length:',
			normalizedData?.length ?? 0
		);
		if (
			normalizedData &&
			Array.isArray(normalizedData) &&
			normalizedData.length > 0
		) {
			console.log('📋 First meal plan structure:', {
				id: (normalizedData as any[])[0].id,
				hasDays: !!(normalizedData as any[])[0].days,
				daysLength: (normalizedData as any[])[0].days?.length || 0,
				firstDayStructure: (normalizedData as any[])[0].days?.[0]
					? Object.keys((normalizedData as any[])[0].days[0])
					: 'No days',
			});

			// Server-side enrichment: attach recipe details when missing
			try {
				const allRecipeIds = new Set<string>();
				(normalizedData as any[]).forEach((plan: any) => {
					const items =
						plan.days && plan.days.length > 0
							? plan.days
							: plan.recipeItems || [];
					items.forEach((item: any) => {
						const rid =
							item?.recipeId && typeof item.recipeId === 'object'
								? item.recipeId._id || item.recipeId.id
								: typeof item?.recipeId === 'string'
									? item.recipeId
									: typeof item?.recipe === 'string'
										? item.recipe
										: undefined;
						if (rid && !item.recipe) allRecipeIds.add(String(rid));
					});
				});

				if (allRecipeIds.size > 0) {
					console.log(
						'🔎 Enriching recipes for meal plans. Unique IDs:',
						allRecipeIds.size
					);
					const entries = Array.from(allRecipeIds);
					const recipeMap = new Map<string, any>();
					await Promise.all(
						entries.map(async (id) => {
							try {
								const r = await serverApiClient.get(
									`${API_CONFIG.endpoints.recipes}/${id}`,
									{},
									{ requestContext: request }
								);
								if (r.success && r.data) {
									const rec: any = r.data as any;
									const key = String((rec && (rec.id || rec._id)) || id);
									recipeMap.set(key, rec);
								}
							} catch (e) {
								console.warn('⚠️ Failed to fetch external recipe', id, e);
							}
						})
					);

					// Attach fetched recipes to items
					normalizedData = (normalizedData as any[]).map((plan: any) => {
						const items =
							plan.days && plan.days.length > 0
								? plan.days
								: plan.recipeItems || [];
						const newItems = items.map((item: any) => {
							if (!item.recipe) {
								const rid =
									item?.recipeId && typeof item.recipeId === 'object'
										? item.recipeId._id || item.recipeId.id
										: typeof item?.recipeId === 'string'
											? item.recipeId
											: typeof item?.recipe === 'string'
												? item.recipe
												: undefined;
								if (rid && recipeMap.has(String(rid))) {
									return { ...item, recipe: recipeMap.get(String(rid)) };
								}
							}
							return item;
						});
						if (plan.days && plan.days.length > 0) {
							return { ...plan, days: newItems };
						}
						if (plan.recipeItems) {
							return { ...plan, recipeItems: newItems };
						}
						return plan;
					});
				}
			} catch (enrichError) {
				console.warn('⚠️ Server-side recipe enrichment failed:', enrichError);
			}
		}

		return NextResponse.json(normalizedData || []);
	} catch (error) {
		console.error('❌ Error fetching meal plans:', error);

		// Provide more detailed error information
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error occurred';
		const errorStack = error instanceof Error ? error.stack : undefined;

		console.error('❌ Error details:', {
			message: errorMessage,
			stack: errorStack,
			type: error instanceof Error ? error.constructor.name : typeof error,
		});

		// Determine specific error type and status code
		let errorType = 'INTERNAL_ERROR';
		let statusCode = 500;
		let details = errorMessage;

		if (error instanceof Error) {
			if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
				errorType = 'EXTERNAL_API_TIMEOUT';
				statusCode = 504;
				details = 'External API request timed out after 30 seconds';
			} else if (
				error.name === 'AbortError' ||
				error.message.includes('aborted')
			) {
				errorType = 'EXTERNAL_API_ABORTED';
				statusCode = 499;
				details = 'External API request was aborted';
			} else if (
				error.message.includes('fetch') ||
				error.message.includes('network') ||
				error.message.includes('ENOTFOUND') ||
				error.message.includes('DNS')
			) {
				errorType = 'EXTERNAL_API_NETWORK_ERROR';
				statusCode = 502;
				details =
					'Network error connecting to external API - check if api.mealprep360.com is accessible';
			} else if (
				error.message.includes('ECONNREFUSED') ||
				error.message.includes('connection refused')
			) {
				errorType = 'EXTERNAL_API_CONNECTION_REFUSED';
				statusCode = 502;
				details = 'External API connection refused - service may be down';
			} else if (
				error.message.includes('401') ||
				error.message.includes('Unauthorized') ||
				error.message.includes('authentication')
			) {
				errorType = 'EXTERNAL_API_AUTH_ERROR';
				statusCode = 401;
				details =
					'External API authentication failed - the API is not configured to accept Clerk JWT tokens';
			} else if (
				error.message.includes('HTML') ||
				error.message.includes('<!DOCTYPE') ||
				error.message.includes('<html')
			) {
				errorType = 'EXTERNAL_API_HTML_ERROR';
				statusCode = 500;
				details =
					'External API is returning HTML error pages instead of JSON responses';
			}
		}

		return NextResponse.json(
			{
				error: 'Internal server error while fetching meal plans',
				details: details,
				type: errorType,
				externalApiUrl: API_CONFIG.baseURL + API_CONFIG.endpoints.mealPlans,
				timestamp: new Date().toISOString(),
				troubleshooting: {
					checkExternalApi:
						'Verify that https://api.mealprep360.com is accessible and responding with JSON',
					checkNetwork: 'Check network connectivity and firewall settings',
					checkTimeout: 'The request timeout is set to 30 seconds',
					testConnection:
						'Use /api/test-connection endpoint to test external API connectivity',
					...(statusCode === 401 && {
						authIssue:
							'The external API is not configured to accept Clerk JWT tokens',
						authSolution:
							'Contact the API administrator to configure Clerk JWT token acceptance',
						testAuth: 'Use /api/test-auth endpoint to verify authentication',
					}),
					...(errorType === 'EXTERNAL_API_HTML_ERROR' && {
						htmlIssue:
							'The external API is returning HTML error pages instead of JSON',
						htmlSolution:
							'The external API server may be down or misconfigured',
						contactAdmin:
							'Contact the API administrator to check server status',
					}),
					contactSupport:
						'If the issue persists, contact support with the error details above',
				},
			},
			{ status: statusCode }
		);
	}
}

// POST /api/meal-plans - Create new meal plan
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
			'External API endpoint:',
			API_CONFIG.endpoints.mealPlans,
			'Body:',
			body
		);

		const response = await serverApiClient.post(
			API_CONFIG.endpoints.mealPlans,
			body
		);

		if (!response.success) {
			console.error('API error message:', response.error);
			return NextResponse.json(
				{ error: response.error || 'Failed to create meal plan' },
				{ status: 500 }
			);
		}

		console.log('✅ Meal plan created successfully via external API');
		return NextResponse.json(response.data);
	} catch (error) {
		console.error('Error creating meal plan:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
