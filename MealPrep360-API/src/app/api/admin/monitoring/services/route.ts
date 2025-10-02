import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';

/**
 * @swagger
 * /api/admin/monitoring/services:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Monitor external services health (Admin only)
 *     description: Checks the health status of all external services and APIs
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: includeDetails
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include detailed response information
 *       - in: query
 *         name: timeout
 *         schema:
 *           type: number
 *           default: 5000
 *         description: Timeout in milliseconds for service checks
 *     responses:
 *       200:
 *         description: Service health status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 overall:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, degraded, unhealthy]
 *                     healthyServices:
 *                       type: number
 *                     totalServices:
 *                       type: number
 *                 services:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                       responseTime:
 *                         type: number
 *                       error:
 *                         type: string
 *                       lastChecked:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request) {
	const authCheck = await adminAuth('canViewAnalytics');
	if (authCheck) return authCheck;

	try {
		const { searchParams } = new URL(request.url);
		const includeDetails = searchParams.get('includeDetails') === 'true';
		const timeout = parseInt(searchParams.get('timeout') || '5000');

		const timestamp = new Date().toISOString();
		const services: Record<string, any> = {};

		// Define services to check
		const serviceChecks = [
			{
				name: 'recipeService',
				url: process.env.RECIPE_SERVICE_URL,
				healthPath: '/health',
				apiKey: process.env.RECIPE_SERVICE_API_KEY,
			},
			{
				name: 'blogService',
				url: process.env.BLOG_SERVICE_URL,
				healthPath: '/health',
				apiKey: process.env.BLOG_SERVICE_API_KEY,
			},
			{
				name: 'mealPlanService',
				url: process.env.MEAL_PLAN_SERVICE_URL,
				healthPath: '/health',
				apiKey: process.env.MEAL_PLAN_SERVICE_API_KEY,
			},
			{
				name: 'socialService',
				url: process.env.SOCIAL_SERVICE_URL,
				healthPath: '/health',
				apiKey: process.env.SOCIAL_SERVICE_API_KEY,
			},
			{
				name: 'shoppingListService',
				url: process.env.SHOPPING_LIST_SERVICE_URL,
				healthPath: '/health',
				apiKey: process.env.SHOPPING_LIST_SERVICE_API_KEY,
			},
			{
				name: 'messagingService',
				url: process.env.MESSAGING_SERVICE_URL,
				healthPath: '/health',
				apiKey: process.env.MESSAGING_SERVICE_API_KEY,
			},
		];

		// Check each service
		const servicePromises = serviceChecks.map(async (service) => {
			const startTime = Date.now();
			let status = 'unknown';
			let error = null;
			let responseTime = 0;
			let details = null;

			try {
				if (!service.url) {
					status = 'not_configured';
					error = 'Service URL not configured';
				} else {
					const healthUrl = `${service.url.replace(/\/$/, '')}${
						service.healthPath
					}`;
					const headers: Record<string, string> = {
						'Content-Type': 'application/json',
					};

					if (service.apiKey) {
						headers['x-api-key'] = service.apiKey;
					}

					const response = await fetch(healthUrl, {
						method: 'GET',
						headers,
						signal: AbortSignal.timeout(timeout),
					});

					responseTime = Date.now() - startTime;

					if (response.ok) {
						status = 'healthy';
						if (includeDetails) {
							try {
								details = await response.json();
							} catch (e) {
								details = {
									message: 'Health check passed but no JSON response',
								};
							}
						}
					} else {
						status = 'unhealthy';
						error = `HTTP ${response.status}: ${response.statusText}`;
						if (includeDetails) {
							try {
								const errorData = await response.text();
								details = { error: errorData };
							} catch (e) {
								details = { error: 'Could not parse error response' };
							}
						}
					}
				}
			} catch (err) {
				responseTime = Date.now() - startTime;
				status = 'unhealthy';
				if (err instanceof Error) {
					if (err.name === 'AbortError') {
						error = `Timeout after ${timeout}ms`;
					} else {
						error = err.message;
					}
				} else {
					error = 'Unknown error occurred';
				}
			}

			return {
				name: service.name,
				result: {
					status,
					responseTime,
					error,
					lastChecked: new Date().toISOString(),
					...(includeDetails && details ? { details } : {}),
				},
			};
		});

		// Wait for all service checks to complete
		const serviceResults = await Promise.all(servicePromises);

		// Build services object
		for (const { name, result } of serviceResults) {
			services[name] = result;
		}

		// Calculate overall health
		const totalServices = serviceResults.length;
		const healthyServices = serviceResults.filter(
			({ result }) => result.status === 'healthy'
		).length;
		const notConfiguredServices = serviceResults.filter(
			({ result }) => result.status === 'not_configured'
		).length;

		let overallStatus = 'healthy';
		if (healthyServices === 0) {
			overallStatus = 'unhealthy';
		} else if (healthyServices < totalServices - notConfiguredServices) {
			overallStatus = 'degraded';
		}

		// Add external API checks
		const externalChecks = [
			{
				name: 'openai',
				check: async () => {
					if (!process.env.OPENAI_API_KEY) {
						return {
							status: 'not_configured',
							error: 'API key not configured',
						};
					}
					try {
						const response = await fetch('https://api.openai.com/v1/models', {
							headers: {
								Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
								'Content-Type': 'application/json',
							},
							signal: AbortSignal.timeout(timeout),
						});
						return {
							status: response.ok ? 'healthy' : 'unhealthy',
							responseTime: 0,
							error: response.ok ? null : `HTTP ${response.status}`,
						};
					} catch (err) {
						return {
							status: 'unhealthy',
							error: err instanceof Error ? err.message : 'Unknown error',
						};
					}
				},
			},
			{
				name: 'clerk',
				check: async () => {
					if (!process.env.CLERK_SECRET_KEY) {
						return {
							status: 'not_configured',
							error: 'Secret key not configured',
						};
					}
					try {
						const response = await fetch(
							'https://api.clerk.com/v1/users?limit=1',
							{
								headers: {
									Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
									'Content-Type': 'application/json',
								},
								signal: AbortSignal.timeout(timeout),
							}
						);
						return {
							status: response.ok ? 'healthy' : 'unhealthy',
							responseTime: 0,
							error: response.ok ? null : `HTTP ${response.status}`,
						};
					} catch (err) {
						return {
							status: 'unhealthy',
							error: err instanceof Error ? err.message : 'Unknown error',
						};
					}
				},
			},
		];

		// Check external APIs
		for (const { name, check } of externalChecks) {
			const startTime = Date.now();
			const result = await check();
			(result as any).responseTime = Date.now() - startTime;
			(result as any).lastChecked = new Date().toISOString();
			services[name] = result;
		}

		// Update overall status with external services
		const allServices = Object.values(services);
		const allHealthy = allServices.filter(
			(s: any) => s.status === 'healthy'
		).length;
		const allTotal = allServices.length;
		const allNotConfigured = allServices.filter(
			(s: any) => s.status === 'not_configured'
		).length;

		if (allHealthy === 0) {
			overallStatus = 'unhealthy';
		} else if (allHealthy < allTotal - allNotConfigured) {
			overallStatus = 'degraded';
		} else {
			overallStatus = 'healthy';
		}

		console.log(
			`[Admin] Service health check completed: ${overallStatus} (${allHealthy}/${allTotal})`
		);
		return NextResponse.json({
			timestamp,
			overall: {
				status: overallStatus,
				healthyServices: allHealthy,
				totalServices: allTotal,
				configuredServices: allTotal - allNotConfigured,
			},
			services,
		});
	} catch (error) {
		console.error('Error checking service health:', error);
		return NextResponse.json(
			{
				error: 'Failed to check service health',
				timestamp: new Date().toISOString(),
			},
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
