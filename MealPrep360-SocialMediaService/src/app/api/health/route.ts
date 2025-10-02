import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ENV_CONFIG } from '@/lib/vercelConfig';

/**
 * @swagger
 * /api/health:
 *   get:
 *     description: Health check endpoint
 *     responses:
 *       200:
 *         description: Returns status ok
 */

export async function GET() {
	try {
		const startTime = Date.now();

		// Check database connection
		await connectDB();
		const dbLatency = Date.now() - startTime;

		// Basic system info
		const systemInfo = {
			status: 'healthy',
			environment: process.env.NODE_ENV,
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			memory: process.memoryUsage(),
			dbLatency: `${dbLatency}ms`,
		};

		// Add more detailed info in development
		if (ENV_CONFIG.isDevelopment) {
			Object.assign(systemInfo, {
				nodeVersion: process.version,
				platform: process.platform,
				arch: process.arch,
			});
		}

		return NextResponse.json(systemInfo);
	} catch (error) {
		console.error('Health check failed:', error);
		return NextResponse.json(
			{
				status: 'unhealthy',
				error: 'Service check failed',
				timestamp: new Date().toISOString(),
			},
			{ status: 503 }
		);
	}
}
