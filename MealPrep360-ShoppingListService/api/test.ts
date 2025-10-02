import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
	// Add CORS headers
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.setHeader(
		'Access-Control-Allow-Headers',
		'Content-Type, Authorization, X-User-Id'
	);

	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}

	if (req.method === 'GET') {
		// Simple ping endpoint
		return res.status(200).json({
			message: 'Shopping List Service Test Endpoint',
			timestamp: new Date().toISOString(),
			status: 'ok',
			endpoints: {
				health: '/api/health',
				shopping_list: '/api (POST)',
				alternative: '/api/shopping-lists/generate (POST)',
				status_page: '/api/status',
			},
		});
	}

	if (req.method === 'POST') {
		// Simple test endpoint that simulates shopping list generation without database
		console.log('Test endpoint called:', {
			headers: req.headers,
			body: req.body,
		});

		const { userId, mealPlanId } = req.body;

		if (!userId) {
			return res.status(400).json({
				error: 'Missing userId',
				message: 'userId is required for testing',
			});
		}

		// Return a mock shopping list
		const mockShoppingList = {
			message: 'Test shopping list generated successfully',
			shoppingList: {
				name: `Test Shopping List ${new Date().toLocaleDateString()}`,
				userId: userId,
				status: 'ACTIVE',
				items: [
					{
						name: 'chicken breast',
						quantity: 2,
						unit: 'pound',
						category: 'Meat',
						status: 'PENDING',
						_id: 'test-item-1',
					},
					{
						name: 'onion',
						quantity: 1,
						unit: 'piece',
						category: 'Produce',
						status: 'PENDING',
						_id: 'test-item-2',
					},
					{
						name: 'olive oil',
						quantity: 2,
						unit: 'tablespoon',
						category: 'Pantry',
						status: 'PENDING',
						_id: 'test-item-3',
					},
				],
				_id: 'test-shopping-list-' + Date.now(),
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				__v: 0,
			},
			mode: 'test',
			timestamp: new Date().toISOString(),
			source: 'fallback-service-test',
		};

		return res.status(201).json(mockShoppingList);
	}

	return res.status(405).json({ error: 'Method not allowed' });
}
