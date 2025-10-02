import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serverApiClient } from '@/lib/api-client-server';
import { API_CONFIG } from '@/lib/api-config';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
import jwt from 'jsonwebtoken';

// DELETE /api/shopping-lists/[id]/items/[itemId] - Delete shopping list item
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string; itemId: string } }
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

		const { id, itemId } = params;

		console.log('🛒 Using MongoDB to delete shopping list item:', itemId, 'from list:', id);

		// Import MongoDB connection and models
		const { connectToDatabase } = require('@/lib/mongodb/connection');
		const { ShoppingList } = require('@/lib/mongodb/schemas');
		
		// Connect to database
		await connectToDatabase();
		
		// Find and update the shopping list to remove the item
		const shoppingList = await ShoppingList.findOneAndUpdate(
			{ 
				_id: id,
				clerkId: userId
			},
			{
				$pull: { items: { _id: itemId } },
				updatedAt: new Date()
			},
			{ new: true }
		);

		if (!shoppingList) {
			return NextResponse.json(
				{ error: 'Shopping list not found' },
				{ status: 404 }
			);
		}

		console.log('✅ Deleted item from shopping list');
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error deleting shopping list item:', error);
		return NextResponse.json(
			{
				error: 'Failed to connect to external API',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

// PATCH /api/shopping-lists/[id]/items/[itemId] - Update shopping list item
export async function PATCH(
	request: NextRequest,
	{ params }: { params: { id: string; itemId: string } }
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

		const { id, itemId } = params;
		const body = await request.json();

		console.log('🛒 Using MongoDB to update shopping list item:', itemId, 'from list:', id, 'Body:', body);

		// Import MongoDB connection and models
		const { connectToDatabase } = require('@/lib/mongodb/connection');
		const { ShoppingList } = require('@/lib/mongodb/schemas');
		
		// Connect to database
		await connectToDatabase();
		
		// Build update object for the specific item
		const updateObject: any = { updatedAt: new Date() };
		
		if (body.status) {
			updateObject['items.$.status'] = body.status;
		}
		if (body.name) {
			updateObject['items.$.name'] = body.name;
		}
		if (body.quantity !== undefined) {
			updateObject['items.$.quantity'] = body.quantity;
		}
		if (body.unit) {
			updateObject['items.$.unit'] = body.unit;
		}
		if (body.category) {
			updateObject['items.$.category'] = body.category;
		}
		
		// Find and update the specific item in the shopping list
		const shoppingList = await ShoppingList.findOneAndUpdate(
			{ 
				_id: id,
				clerkId: userId,
				'items._id': itemId
			},
			{
				$set: updateObject
			},
			{ new: true }
		);

		if (!shoppingList) {
			return NextResponse.json(
				{ error: 'Shopping list or item not found' },
				{ status: 404 }
			);
		}

		console.log('✅ Updated item in shopping list');
		return NextResponse.json({ success: true, data: shoppingList });
	} catch (error) {
		console.error('Error updating shopping list item:', error);
		return NextResponse.json(
			{
				error: 'Failed to connect to external API',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
