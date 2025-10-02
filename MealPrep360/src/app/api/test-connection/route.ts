import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serverApiClient } from '@/lib/api-client-server';
import { API_CONFIG } from '@/lib/api-config';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	try {
		const { userId, getToken } = await auth();
		const token = await getToken();

		return NextResponse.json({
			status: 'ok',
			authenticated: !!userId,
			userId: userId || 'not authenticated',
			hasToken: !!token,
			tokenLength: token?.length || 0,
			tokenPreview: token ? `${token.substring(0, 30)}...` : 'no token',
			baseUrl: process.env.NEXT_PUBLIC_API_URL || 'not set',
			apiConfigBaseUrl: API_CONFIG.baseURL,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error('Test connection error:', error);
		return NextResponse.json(
			{
				status: 'error',
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString(),
			},
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const { userId, getToken } = await auth();
		const token = await getToken();
		const body = await request.json();

		if (!userId) {
			return NextResponse.json(
				{
					status: 'error',
					message: 'Unauthorized - no user ID',
					timestamp: new Date().toISOString(),
					handledBy: 'local-api',
				},
				{ status: 401 }
			);
		}

		// Test the external API connection
		try {
			// Test a simple GET request to the meal plans endpoint
			const testResponse = await serverApiClient.get(
				API_CONFIG.endpoints.mealPlans,
				{ limit: '1' } // Just get 1 record to test connection
			);

			// Test with the exact parameters that are failing in the meal planner
			const today = new Date();
			const startOfWeek = new Date(today);
			startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
			startOfWeek.setHours(0, 0, 0, 0); // Start of day
			const endOfWeek = new Date(startOfWeek);
			endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
			endOfWeek.setHours(23, 59, 59, 999); // End of day

			const mealPlannerParams = {
				startDate: startOfWeek.toISOString(),
				endDate: endOfWeek.toISOString(),
				includeRecipes: 'true',
			};

			const mealPlannerTestResponse = await serverApiClient.get(
				API_CONFIG.endpoints.mealPlans,
				mealPlannerParams
			);

			return NextResponse.json({
				status: 'success',
				message: 'External API test completed',
				timestamp: new Date().toISOString(),
				handledBy: 'local-api',
				externalApiTest: {
					success: testResponse.success,
					status: testResponse.status,
					hasData: !!testResponse.data,
					error: testResponse.error,
				},
				mealPlannerTest: {
					success: mealPlannerTestResponse.success,
					status: mealPlannerTestResponse.status,
					hasData: !!mealPlannerTestResponse.data,
					error: mealPlannerTestResponse.error,
					params: mealPlannerParams,
				},
				receivedData: body,
			});
		} catch (apiError) {
			console.error('❌ External API test failed:', apiError);
			return NextResponse.json(
				{
					status: 'error',
					message: 'External API test failed',
					timestamp: new Date().toISOString(),
					handledBy: 'local-api',
					externalApiError:
						apiError instanceof Error ? apiError.message : 'Unknown API error',
				},
				{ status: 500 }
			);
		}
	} catch (error) {
		return NextResponse.json(
			{
				status: 'error',
				message: 'Failed to parse request body',
				timestamp: new Date().toISOString(),
				handledBy: 'local-api',
			},
			{ status: 400 }
		);
	}
}
