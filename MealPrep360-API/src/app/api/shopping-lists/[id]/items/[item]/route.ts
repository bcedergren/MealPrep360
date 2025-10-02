import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { User, ShoppingList } from '@/lib/mongodb/schemas';
import connectDB from '@/lib/mongodb/connection';

interface ShoppingListItem {
	_id: string;
	name: string;
	quantity: number;
	unit: string;
	category: string;
	status: string;
	additionalQuantities?: any;
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; item: string }> }
) {
	const resolvedParams = await params;
	try {
		const { userId: clerkId } = getAuth(request);
		if (!clerkId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		// Get user from database
		const user = await User.findOne({ clerkId });

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const body = await request.json();
		const { status } = body;

		// Find the shopping list and update the specific item
		const shoppingList = await ShoppingList.findOne({
			_id: resolvedParams.id,
			userId: user._id,
		});

		if (!shoppingList) {
			return NextResponse.json(
				{ error: 'Shopping list not found' },
				{ status: 404 }
			);
		}

		const itemIndex = shoppingList.items.findIndex(
			(item: ShoppingListItem) => item._id.toString() === resolvedParams.item
		);

		if (itemIndex === -1) {
			return NextResponse.json({ error: 'Item not found' }, { status: 404 });
		}

		shoppingList.items[itemIndex].status = status;
		await shoppingList.save();

		return NextResponse.json(shoppingList.items[itemIndex]);
	} catch (error) {
		console.error('Error updating shopping list item:', error);
		return NextResponse.json(
			{ error: 'Failed to update shopping list item' },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; item: string }> }
) {
	const resolvedParams = await params;
	try {
		const { userId: clerkId } = getAuth(request);
		if (!clerkId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		// Get user from database
		const user = await User.findOne({ clerkId });

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Find the shopping list and remove the specific item
		const shoppingList = await ShoppingList.findOne({
			_id: resolvedParams.id,
			userId: user._id,
		});

		if (!shoppingList) {
			return NextResponse.json(
				{ error: 'Shopping list not found' },
				{ status: 404 }
			);
		}

		shoppingList.items = shoppingList.items.filter(
			(item: ShoppingListItem) => item._id.toString() !== resolvedParams.item
		);

		await shoppingList.save();

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error deleting shopping list item:', error);
		return NextResponse.json(
			{ error: 'Failed to delete shopping list item' },
			{ status: 500 }
		);
	}
}
