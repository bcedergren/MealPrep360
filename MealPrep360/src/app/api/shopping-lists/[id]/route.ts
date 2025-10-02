import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serverApiClient } from '@/lib/api-client-server';
import { API_CONFIG } from '@/lib/api-config';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
import jwt from 'jsonwebtoken';

// GET /api/shopping-lists/[id] - Get specific shopping list
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId, getToken } = await auth();
		const token = await getToken();
		if (token) {
			try {
				const decoded = jwt.decode(token, { complete: true });
				if (decoded && typeof decoded === 'object') {
					const redacted = { ...decoded };
					if (
						redacted.payload &&
						typeof redacted.payload === 'object' &&
						redacted.payload !== null
					) {
						if ('sub' in redacted.payload) redacted.payload.sub = '[REDACTED]';
						if ('email' in redacted.payload)
							redacted.payload.email = '[REDACTED]';
						if ('user_id' in redacted.payload)
							redacted.payload.user_id = '[REDACTED]';
					}
					console.log(
						'Decoded JWT (redacted):',
						JSON.stringify(redacted, null, 2)
					);
				} else {
					console.log('Decoded JWT (redacted):', '[Unable to decode]');
				}
			} catch (err) {
				console.log('Error decoding JWT:', err);
			}
		} else {
			console.log('No JWT token available to decode.');
		}
		console.log(
			'API authentication code: Using Bearer token in Authorization header.'
		);

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = params;

		console.log(
			'External API endpoint:',
			`${API_CONFIG.endpoints.shoppingLists}/${id}`
		);

		const response = await serverApiClient.get(
			`${API_CONFIG.endpoints.shoppingLists}/${id}`
		);

		if (!response.success) {
			console.error('External API error:', response.error);
			return NextResponse.json(
				{
					error: 'Failed to fetch shopping list from external API',
					details: response.error,
				},
				{ status: response.status || 500 }
			);
		}

		return NextResponse.json(response.data);
	} catch (error) {
		console.error('Error fetching shopping list:', error);
		return NextResponse.json(
			{
				error: 'Failed to connect to external API',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

// PUT /api/shopping-lists/[id] - Update shopping list
export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId, getToken } = await auth();
		const token = await getToken();
		if (token) {
			try {
				const decoded = jwt.decode(token, { complete: true });
				if (decoded && typeof decoded === 'object') {
					const redacted = { ...decoded };
					if (
						redacted.payload &&
						typeof redacted.payload === 'object' &&
						redacted.payload !== null
					) {
						if ('sub' in redacted.payload) redacted.payload.sub = '[REDACTED]';
						if ('email' in redacted.payload)
							redacted.payload.email = '[REDACTED]';
						if ('user_id' in redacted.payload)
							redacted.payload.user_id = '[REDACTED]';
					}
					console.log(
						'Decoded JWT (redacted):',
						JSON.stringify(redacted, null, 2)
					);
				} else {
					console.log('Decoded JWT (redacted):', '[Unable to decode]');
				}
			} catch (err) {
				console.log('Error decoding JWT:', err);
			}
		} else {
			console.log('No JWT token available to decode.');
		}
		console.log(
			'API authentication code: Using Bearer token in Authorization header.'
		);

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = params;
		const body = await request.json();

		console.log(
			'External API endpoint:',
			`${API_CONFIG.endpoints.shoppingLists}/${id}`,
			'Body:',
			body
		);

		const response = await serverApiClient.put(
			`${API_CONFIG.endpoints.shoppingLists}/${id}`,
			body
		);

		if (!response.success) {
			console.error('External API error:', response.error);
			return NextResponse.json(
				{
					error: 'Failed to update shopping list on external API',
					details: response.error,
				},
				{ status: response.status || 500 }
			);
		}

		return NextResponse.json(response.data);
	} catch (error) {
		console.error('Error updating shopping list:', error);
		return NextResponse.json(
			{
				error: 'Failed to connect to external API',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

// DELETE /api/shopping-lists/[id] - Delete shopping list
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId, getToken } = await auth();
		const token = await getToken();
		if (token) {
			try {
				const decoded = jwt.decode(token, { complete: true });
				if (decoded && typeof decoded === 'object') {
					const redacted = { ...decoded };
					if (
						redacted.payload &&
						typeof redacted.payload === 'object' &&
						redacted.payload !== null
					) {
						if ('sub' in redacted.payload) redacted.payload.sub = '[REDACTED]';
						if ('email' in redacted.payload)
							redacted.payload.email = '[REDACTED]';
						if ('user_id' in redacted.payload)
							redacted.payload.user_id = '[REDACTED]';
					}
					console.log(
						'Decoded JWT (redacted):',
						JSON.stringify(redacted, null, 2)
					);
				} else {
					console.log('Decoded JWT (redacted):', '[Unable to decode]');
				}
			} catch (err) {
				console.log('Error decoding JWT:', err);
			}
		} else {
			console.log('No JWT token available to decode.');
		}
		console.log(
			'API authentication code: Using Bearer token in Authorization header.'
		);

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = params;

		console.log('🛒 Using MongoDB to delete shopping list:', id);

		// Import MongoDB connection and models
		const { connectToDatabase } = require('@/lib/mongodb/connection');
		const { ShoppingList } = require('@/lib/mongodb/schemas');
		
		// Connect to database
		await connectToDatabase();
		
		// Delete the shopping list
		const deletedList = await ShoppingList.findOneAndDelete({
			_id: id,
			clerkId: userId
		});

		if (!deletedList) {
			return NextResponse.json(
				{ error: 'Shopping list not found' },
				{ status: 404 }
			);
		}

		console.log('✅ Deleted shopping list:', id);
		return NextResponse.json({ success: true, data: { deleted: true } });
	} catch (error) {
		console.error('Error deleting shopping list:', error);
		return NextResponse.json(
			{
				error: 'Failed to connect to external API',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
