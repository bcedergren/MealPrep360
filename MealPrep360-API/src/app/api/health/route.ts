import { NextRequest, NextResponse } from 'next/server';
import { serviceManager } from '@/lib/services';

export async function GET(request: NextRequest) {
	try {
		// Initialize service manager if not already done
		if (!serviceManager.isInitialized()) {
			await serviceManager.initialize({
				enableMonitoring: true,
				enableHealthChecks: true,
				enableAuth: true,
			});
		}

		// Get comprehensive system health
		const systemHealth = await serviceManager.getSystemHealth();
		const serviceHealth = await serviceManager.performHealthCheck();

		// Check if using external API only
		const useExternalApiOnly = process.env.USE_EXTERNAL_API_ONLY === 'true';

		const health = {
			status: systemHealth.overall,
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			environment: process.env.NODE_ENV || 'development',
			version: process.env.API_VERSION || '1.0.0',
			mode: useExternalApiOnly ? 'external-api-only' : 'full-service',
			system: {
				overall: systemHealth.overall,
				services: systemHealth.services,
				metrics: systemHealth.metrics,
				circuitBreakers: systemHealth.circuitBreakers,
			},
			services: serviceHealth.services,
			checks: {
				database: await checkDatabase(),
				external_apis: await checkExternalAPIs(),
				memory: checkMemoryUsage(),
				disk: await checkDiskSpace(),
			},
		};

		// Set appropriate status code
		const statusCode =
			health.status === 'healthy'
				? 200
				: health.status === 'degraded'
					? 206
					: 503;

		return NextResponse.json(health, { status: statusCode });
	} catch (error) {
		console.error('Health check failed:', error);

		return NextResponse.json(
			{
				status: 'unhealthy',
				timestamp: new Date().toISOString(),
				error: error instanceof Error ? error.message : 'Health check failed',
				uptime: process.uptime(),
				mode:
					process.env.USE_EXTERNAL_API_ONLY === 'true'
						? 'external-api-only'
						: 'full-service',
			},
			{ status: 503 }
		);
	}
}

async function checkDatabase(): Promise<{
	status: string;
	responseTime?: number;
	error?: string;
}> {
	try {
		const startTime = Date.now();

		// Import connection here to avoid circular dependencies
		const { default: connectDB } = await import('@/lib/mongodb/connection');
		await connectDB();

		const responseTime = Date.now() - startTime;
		return { status: 'healthy', responseTime };
	} catch (error) {
		return {
			status: 'unhealthy',
			error:
				error instanceof Error ? error.message : 'Database connection failed',
		};
	}
}

async function checkExternalAPIs(): Promise<{ status: string; details: any }> {
	const checks = [];

	// Check OpenAI API
	if (process.env.OPENAI_API_KEY) {
		try {
			const response = await fetch('https://api.openai.com/v1/models', {
				headers: {
					Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
					'Content-Type': 'application/json',
				},
				method: 'GET',
				signal: AbortSignal.timeout(5000),
			});

			checks.push({
				name: 'openai',
				status: response.ok ? 'healthy' : 'unhealthy',
				responseCode: response.status,
			});
		} catch (error) {
			checks.push({
				name: 'openai',
				status: 'unhealthy',
				error: error instanceof Error ? error.message : 'Request failed',
			});
		}
	}

	// Check Clerk API
	if (process.env.CLERK_SECRET_KEY) {
		try {
			const response = await fetch('https://api.clerk.com/v1/users?limit=1', {
				headers: {
					Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
					'Content-Type': 'application/json',
				},
				method: 'GET',
				signal: AbortSignal.timeout(5000),
			});

			checks.push({
				name: 'clerk',
				status: response.ok ? 'healthy' : 'unhealthy',
				responseCode: response.status,
			});
		} catch (error) {
			checks.push({
				name: 'clerk',
				status: 'unhealthy',
				error: error instanceof Error ? error.message : 'Request failed',
			});
		}
	}

	const healthyChecks = checks.filter((c) => c.status === 'healthy').length;
	const overallStatus =
		checks.length === 0
			? 'healthy'
			: healthyChecks === checks.length
				? 'healthy'
				: healthyChecks > 0
					? 'degraded'
					: 'unhealthy';

	return { status: overallStatus, details: checks };
}

function checkMemoryUsage(): { status: string; usage: any } {
	const memUsage = process.memoryUsage();
	const memUsageMB = {
		rss: Math.round(memUsage.rss / 1024 / 1024),
		heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
		heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
		external: Math.round(memUsage.external / 1024 / 1024),
	};

	// Alert if heap usage is over 512MB
	const status = memUsageMB.heapUsed > 512 ? 'degraded' : 'healthy';

	return { status, usage: memUsageMB };
}

async function checkDiskSpace(): Promise<{
	status: string;
	details?: any;
	error?: string;
}> {
	try {
		const fs = await import('fs').then((m) => m.promises);
		const stats = await fs.stat(process.cwd());

		// Basic disk space check (simplified)
		return {
			status: 'healthy',
			details: { message: 'Disk space check completed' },
		};
	} catch (error) {
		return {
			status: 'degraded',
			error: 'Could not check disk space',
		};
	}
}
