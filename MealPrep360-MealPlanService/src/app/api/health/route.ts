import { NextResponse } from 'next/server';
import { getMongoClient } from '@/app/lib/mongodb';
import { headers } from 'next/headers';

// Use Node.js runtime instead of Edge
export const runtime = 'nodejs';

interface HealthData {
	status: 'healthy' | 'unhealthy';
	timestamp: string;
	services: {
		database: {
			status: 'unknown' | 'connected' | 'error';
			error: string | null;
			collections: {
				mealPlans: {
					count: number | null;
				};
			};
		};
	};
}

export async function GET() {
	// Check API token
	const headersList = headers();
	const authHeader = headersList.get('authorization');

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return NextResponse.json(
			{ error: 'Missing or invalid authorization header' },
			{ status: 401 }
		);
	}

	const token = authHeader.split(' ')[1];
	if (token !== process.env.API_TOKEN) {
		return NextResponse.json({ error: 'Invalid API token' }, { status: 401 });
	}

	const healthData: HealthData = {
		status: 'healthy',
		timestamp: new Date().toISOString(),
		services: {
			database: {
				status: 'unknown',
				error: null,
				collections: {
					mealPlans: {
						count: null,
					},
				},
			},
		},
	};

	try {
		// Check if MongoDB URI is configured
		if (!process.env.MONGODB_URI) {
			throw new Error('MONGODB_URI is not configured');
		}

		// Check MongoDB connection
		const client = await getMongoClient();

		// Verify connection by pinging the database
		await client.db().command({ ping: 1 });

		// Get collection count
		const mealPlansCollection = client.db().collection('mealPlans');
		const mealPlansCount = await mealPlansCollection.countDocuments();

		healthData.services.database.status = 'connected';
		healthData.services.database.collections.mealPlans.count = mealPlansCount;
	} catch (error) {
		healthData.status = 'unhealthy';
		healthData.services.database.status = 'error';

		// Provide more detailed error information
		if (error instanceof Error) {
			if (error.message.includes('MONGODB_URI is not configured')) {
				healthData.services.database.error =
					'Database connection string is not configured';
			} else if (error.message.includes('ECONNREFUSED')) {
				healthData.services.database.error =
					'Could not connect to database server';
			} else if (error.message.includes('Authentication failed')) {
				healthData.services.database.error = 'Database authentication failed';
			} else {
				healthData.services.database.error = `Database error: ${error.message}`;
			}
		} else {
			healthData.services.database.error = 'Unknown database error';
		}

		console.error('Health check failed:', error);
		return NextResponse.json(healthData, { status: 500 });
	}

	return NextResponse.json(healthData);
}
