import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatabaseStatus } from '../src/utils/database';

export default async function handler(req: VercelRequest, res: VercelResponse) {
	console.log('Health check requested:', {
		method: req.method,
		url: req.url,
		headers: req.headers,
		query: req.query,
	});

	// Add CORS headers
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}

	if (req.method !== 'GET') {
		console.log('Method not allowed:', req.method);
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		const dbStatus = await getDatabaseStatus();

		const health = {
			status: dbStatus.status === 'connected' ? 'healthy' : 'unhealthy',
			service: 'shopping-list-service',
			timestamp: new Date().toISOString(),
			version: process.env.npm_package_version || '1.0.0',
			capabilities: [
				'shopping-list-generation',
				'ingredient-normalization',
				'unit-conversion',
				'category-classification',
				'meal-plan-processing',
			],
			services: {
				database: dbStatus,
				server: {
					status: 'running',
					uptime: process.uptime(),
					memory: {
						used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
						total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
					},
					nodeEnv: process.env.NODE_ENV,
				},
			},
		};

		console.log('Health check response:', health);

		// Return appropriate status code based on database connection
		if (dbStatus.status !== 'connected') {
			return res.status(503).json(health);
		}

		res.json(health);
	} catch (error) {
		console.error('Health check error:', error);
		res.status(500).json({
			status: 'unhealthy',
			error: 'Internal server error during health check',
			details: error instanceof Error ? error.message : 'Unknown error',
		});
	}
}
