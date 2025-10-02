import { NextResponse } from 'next/server';
import { MONITORING_CONFIG } from '@/lib/vercelConfig';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { Metric } from '@/models/Metric';
import type { NextRequest } from 'next/server';

// In-memory metrics store (replace with a proper metrics service in production)
const metrics = {
	requests: {
		total: 0,
		byEndpoint: {} as Record<string, number>,
	},
	errors: {
		total: 0,
		byType: {} as Record<string, number>,
	},
	performance: {
		avgResponseTime: 0,
		responseTimes: [] as number[],
	},
};

// Helper function to collect metrics
async function collectMetrics(
	request: NextRequest,
	response: Response,
	startTime: number
) {
	try {
		const { userId } = await auth();
		if (!userId) return;

		const endTime = Date.now();
		const duration = endTime - startTime;

		await connectDB();

		await Metric.create({
			userId,
			endpoint: request.url,
			method: request.method,
			duration,
			statusCode: response.status,
			timestamp: new Date(),
		});

		// Update in-memory metrics
		metrics.requests.total++;
		metrics.requests.byEndpoint[request.url] =
			(metrics.requests.byEndpoint[request.url] || 0) + 1;

		if (!response.ok) {
			metrics.errors.total++;
			const errorType = response.status >= 500 ? 'server' : 'client';
			metrics.errors.byType[errorType] =
				(metrics.errors.byType[errorType] || 0) + 1;
		}

		metrics.performance.responseTimes.push(duration);
		if (metrics.performance.responseTimes.length > 1000) {
			metrics.performance.responseTimes.shift();
		}
	} catch (error) {
		console.error('Error collecting metrics:', error);
	}
}

// API route handler
export async function GET(request: NextRequest) {
	if (!MONITORING_CONFIG.enabled) {
		return NextResponse.json(
			{ error: 'Metrics collection is disabled' },
			{ status: 403 }
		);
	}

	const startTime = Date.now();
	const response = NextResponse.json({
		message: 'Metrics endpoint',
		metrics: {
			requests: metrics.requests,
			errors: metrics.errors,
			performance: {
				avgResponseTime: metrics.performance.responseTimes.length
					? metrics.performance.responseTimes.reduce((a, b) => a + b, 0) /
					  metrics.performance.responseTimes.length
					: 0,
			},
		},
	});

	// Collect metrics after response is created
	await collectMetrics(request, response, startTime);

	return response;
}
