import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serverApiClient } from '@/lib/api-client-server';
import { API_CONFIG } from '@/lib/api-config';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	console.log('🧪 Test Shopping Lists API - GET request started');

	try {
		// Test authentication
		const { userId, getToken } = await auth();
		const token = await getToken();

		console.log('🧪 Auth test:', {
			hasUserId: !!userId,
			hasToken: !!token,
			userId: userId ? `${userId.substring(0, 8)}...` : 'null',
		});

		if (!userId) {
			return NextResponse.json(
				{
					error: 'Unauthorized - no userId',
					test: 'auth-failed',
				},
				{ status: 401 }
			);
		}

		// Test 1: Simple GET request without parameters
		console.log('🧪 Test 1: Simple GET request');
		const test1Response = await serverApiClient.get(
			API_CONFIG.endpoints.shoppingLists
		);

		// Test 2: GET request with basic parameters
		console.log('🧪 Test 2: GET request with parameters');
		const test2Response = await serverApiClient.get(
			API_CONFIG.endpoints.shoppingLists,
			{ limit: '5' }
		);

		// Test 3: Direct fetch to see raw response
		console.log('🧪 Test 3: Direct fetch test');
		let directTestResult = null;
		try {
			const directResponse = await fetch(
				`${API_CONFIG.baseURL}${API_CONFIG.endpoints.shoppingLists}`,
				{
					method: 'GET',
					headers: {
						Authorization: `Bearer ${token}`,
						'X-User-Id': userId,
						'Content-Type': 'application/json',
						Accept: 'application/json',
					},
					signal: AbortSignal.timeout(10000),
				}
			);

			directTestResult = {
				status: directResponse.status,
				statusText: directResponse.statusText,
				ok: directResponse.ok,
				headers: Object.fromEntries(directResponse.headers.entries()),
			};
		} catch (directError) {
			directTestResult = {
				error:
					directError instanceof Error ? directError.message : 'Unknown error',
				name: directError instanceof Error ? directError.name : 'Unknown',
			};
		}

		return NextResponse.json({
			status: 'test-completed',
			timestamp: new Date().toISOString(),
			apiConfig: {
				baseURL: API_CONFIG.baseURL,
				endpoint: API_CONFIG.endpoints.shoppingLists,
				fullURL: `${API_CONFIG.baseURL}${API_CONFIG.endpoints.shoppingLists}`,
			},
			auth: {
				hasUserId: !!userId,
				hasToken: !!token,
				userId: userId ? `${userId.substring(0, 8)}...` : 'null',
			},
			test1: {
				success: test1Response.success,
				status: test1Response.status,
				error: test1Response.error,
				hasData: !!test1Response.data,
			},
			test2: {
				success: test2Response.success,
				status: test2Response.status,
				error: test2Response.error,
				hasData: !!test2Response.data,
			},
			test3: {
				directFetch: directTestResult,
			},
		});
	} catch (error) {
		console.error('🧪 Test error:', error);
		return NextResponse.json(
			{
				status: 'test-error',
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString(),
			},
			{ status: 500 }
		);
	}
}
