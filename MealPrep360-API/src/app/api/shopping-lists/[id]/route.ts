import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User, ShoppingList } from '@/lib/mongodb/schemas';

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId: clerkId } = await auth();
		if (!clerkId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		const user = await User.findOne({ clerkId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const shoppingList = await ShoppingList.findOne({
			_id: params.id,
			userId: user._id,
		});

		if (!shoppingList) {
			return NextResponse.json(
				{ error: 'Shopping list not found' },
				{ status: 404 }
			);
		}

		return NextResponse.json(shoppingList);
	} catch (error) {
		console.error('Error fetching shopping list:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch shopping list' },
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId: clerkId } = await auth();
		if (!clerkId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		const user = await User.findOne({ clerkId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const body = await request.json();
		const { name, items } = body;

		const updatedList = await ShoppingList.findOneAndUpdate(
			{
				_id: params.id,
				userId: user._id,
			},
			{
				name,
				items: items.map((item: any) => ({
					name: item.name,
					quantity: item.quantity,
					unit: item.unit || 'piece', // Ensure unit is never empty
					category: item.category || 'Other', // Ensure category is never empty
					status: item.status,
				})),
			},
			{ new: true }
		);

		if (!updatedList) {
			return NextResponse.json(
				{ error: 'Shopping list not found' },
				{ status: 404 }
			);
		}

		return NextResponse.json(updatedList);
	} catch (error) {
		console.error('Error updating shopping list:', error);
		return NextResponse.json(
			{ error: 'Failed to update shopping list' },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId: clerkId } = await auth();
		if (!clerkId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		const user = await User.findOne({ clerkId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const result = await ShoppingList.findOneAndDelete({
			_id: params.id,
			userId: user._id,
		});

		if (!result) {
			return NextResponse.json(
				{ error: 'Shopping list not found' },
				{ status: 404 }
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error deleting shopping list:', error);
		return NextResponse.json(
			{ error: 'Failed to delete shopping list' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
