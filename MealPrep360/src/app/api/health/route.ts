import { NextRequest, NextResponse } from 'next/server';
import { serverApiClient } from '@/lib/api-client-server';
import { API_CONFIG } from '@/lib/api-config';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// This endpoint provides health status for local API services
export async function GET(request: NextRequest) {
	try {
		// Test external API connection
		let externalApiStatus = 'unknown';
		let externalApiError = null;
		let externalApiResponseTime = null;

		try {
			const startTime = Date.now();
			const externalResponse = await serverApiClient.get('/api/health');
			const responseTime = Date.now() - startTime;

			if (externalResponse.success) {
				externalApiStatus = 'healthy';
				externalApiResponseTime = responseTime;
			} else {
				externalApiStatus = 'unhealthy';
				externalApiError = externalResponse.error;
				externalApiResponseTime = responseTime;
			}
		} catch (error) {
			externalApiStatus = 'error';
			externalApiError =
				error instanceof Error ? error.message : 'Unknown error';
		}

		return NextResponse.json({
			status: 'healthy',
			service: 'MealPrep360 API',
			timestamp: new Date().toISOString(),
			version: '1.0.0',
			externalApi: {
				status: externalApiStatus,
				url: API_CONFIG.baseURL,
				responseTime: externalApiResponseTime,
				error: externalApiError,
			},
		});
	} catch (error) {
		console.error('Health check failed:', error);
		return NextResponse.json(
			{
				status: 'unhealthy',
				error: 'Health check failed',
				timestamp: new Date().toISOString(),
			},
			{ status: 503 }
		);
	}
}
