import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import connectDB from '@/lib/mongodb/connection';

export const dynamic = 'force-dynamic';

interface ServiceConfig {
	name: string;
	url: string;
	apiKey: string;
	healthEndpoint?: string;
}

interface ServiceError {
	code: string;
	message: string;
	details?: string;
	timestamp: string;
}

interface ServiceHealthResponse {
	name: string;
	status: 'healthy' | 'unhealthy' | 'loading' | 'not_configured';
	lastChecked: string;
	errors?: ServiceError[];
	metrics?: {
		responseTime: number;
		uptime?: number;
		lastSuccessfulCheck?: string;
	};
}

const services: ServiceConfig[] = [
	{
		name: 'Recipe Generation Service',
		url: process.env.RECIPE_SERVICE_URL || '',
		apiKey: process.env.RECIPE_SERVICE_API_KEY || '',
		healthEndpoint: '/api/health',
	},
	{
		name: 'Shopping Service',
		url: process.env.SHOPPING_SERVICE_URL || '',
		apiKey: process.env.SHOPPING_SERVICE_API_KEY || '',
		healthEndpoint: '/api/health',
	},
	{
		name: 'Meal Plan Service',
		url: process.env.MEALPLAN_SERVICE_URL || '',
		apiKey: process.env.MEALPLAN_SERVICE_API_KEY || '',
		healthEndpoint: '/api/health',
	},
	{
		name: 'Blog Service',
		url: process.env.BLOG_SERVICE_URL || '',
		apiKey: process.env.BLOG_SERVICE_API_KEY || '',
		healthEndpoint: '/api/health',
	},
	{
		name: 'Social Media Service',
		url: process.env.SOCIAL_SERVICE_URL || '',
		apiKey: process.env.SOCIAL_SERVICE_API_KEY || '',
		healthEndpoint: '/api/health',
	},
];

async function checkServiceHealth(
	service: ServiceConfig
): Promise<ServiceHealthResponse> {
	const startTime = Date.now();
	const errors: ServiceError[] = [];

	// Check if service is configured
	if (!service.url || !service.apiKey) {
		return {
			name: service.name,
			status: 'not_configured',
			lastChecked: new Date().toISOString(),
			errors: [
				{
					code: 'NOT_CONFIGURED',
					message: 'Service URL or API key not configured',
					details: `Missing ${!service.url ? 'URL' : 'API key'} for ${
						service.name
					}`,
					timestamp: new Date().toISOString(),
				},
			],
			metrics: {
				responseTime: 0,
			},
		};
	}

	try {
		const healthEndpoint = service.healthEndpoint || '/health';
		const healthUrl = `${service.url.replace(/\/$/, '')}${healthEndpoint}`;

		const response = await fetch(healthUrl, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'x-api-key': service.apiKey,
			},
			signal: AbortSignal.timeout(10000), // 10 second timeout
		});

		const responseTime = Date.now() - startTime;

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			errors.push({
				code: `HTTP_${response.status}`,
				message: `Service returned status ${response.status}`,
				details:
					errorData.message ||
					errorData.error ||
					'No additional details available',
				timestamp: new Date().toISOString(),
			});
		}

		const healthData = await response.json().catch(() => ({}));

		// Check for specific health indicators in the response
		if (healthData.status === 'degraded') {
			errors.push({
				code: 'DEGRADED_PERFORMANCE',
				message: 'Service is experiencing degraded performance',
				details:
					healthData.details ||
					'Service is responding but not at optimal performance',
				timestamp: new Date().toISOString(),
			});
		}

		if (healthData.dependencies) {
			for (const [dep, status] of Object.entries(healthData.dependencies)) {
				if (status !== 'healthy') {
					errors.push({
						code: 'DEPENDENCY_ERROR',
						message: `Dependency ${dep} is not healthy`,
						details:
							typeof status === 'object'
								? JSON.stringify(status)
								: String(status),
						timestamp: new Date().toISOString(),
					});
				}
			}
		}

		return {
			name: service.name,
			status: errors.length > 0 ? 'unhealthy' : 'healthy',
			lastChecked: new Date().toISOString(),
			errors: errors.length > 0 ? errors : undefined,
			metrics: {
				responseTime,
				uptime: healthData.uptime || 0,
				lastSuccessfulCheck: healthData.lastSuccessfulCheck,
			},
		};
	} catch (error) {
		const responseTime = Date.now() - startTime;

		let errorCode = 'CONNECTION_ERROR';
		let errorMessage = 'Failed to connect to service';
		let errorDetails =
			error instanceof Error ? error.message : 'Unknown error occurred';

		if (error instanceof Error) {
			if (error.name === 'AbortError') {
				errorCode = 'TIMEOUT_ERROR';
				errorMessage = 'Service health check timed out';
				errorDetails = 'Service did not respond within 10 seconds';
			} else if (error.message.includes('ENOTFOUND')) {
				errorCode = 'DNS_ERROR';
				errorMessage = 'Service hostname could not be resolved';
				errorDetails = 'Check if the service URL is correct';
			} else if (error.message.includes('ECONNREFUSED')) {
				errorCode = 'CONNECTION_REFUSED';
				errorMessage = 'Connection to service was refused';
				errorDetails = 'Service may be down or not accepting connections';
			}
		}

		errors.push({
			code: errorCode,
			message: errorMessage,
			details: errorDetails,
			timestamp: new Date().toISOString(),
		});

		return {
			name: service.name,
			status: 'unhealthy',
			lastChecked: new Date().toISOString(),
			errors,
			metrics: {
				responseTime,
				uptime: 0,
			},
		};
	}
}

/**
 * @swagger
 * /api/admin/services/health:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Check system services health (Admin only)
 *     description: Performs health checks on all configured external services
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Health check results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 services:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [healthy, unhealthy, loading, not_configured]
 *                       lastChecked:
 *                         type: string
 *                         format: date-time
 *                       errors:
 *                         type: array
 *                         items:
 *                           type: object
 *                       metrics:
 *                         type: object
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalServices:
 *                       type: number
 *                     healthyServices:
 *                       type: number
 *                     unhealthyServices:
 *                       type: number
 *                     notConfiguredServices:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function GET() {
	const authCheck = await adminAuth('canViewAnalytics');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		console.log('[Admin] Starting system health checks...');
		const healthChecks = await Promise.all(services.map(checkServiceHealth));

		// Calculate summary statistics
		const summary = {
			totalServices: healthChecks.length,
			healthyServices: healthChecks.filter((h) => h.status === 'healthy')
				.length,
			unhealthyServices: healthChecks.filter((h) => h.status === 'unhealthy')
				.length,
			notConfiguredServices: healthChecks.filter(
				(h) => h.status === 'not_configured'
			).length,
		};

		console.log('[Admin] System health check completed:', summary);

		return NextResponse.json({
			services: healthChecks,
			summary,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error('Error checking service health:', error);
		return NextResponse.json(
			{ error: 'Failed to check service health' },
			{ status: 500 }
		);
	}
}
