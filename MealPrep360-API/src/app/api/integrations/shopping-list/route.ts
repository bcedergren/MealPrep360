import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/schemas';

export async function POST(request: NextRequest) {
	try {
		const { userId } = getAuth(request);
		if (!userId) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		await connectDB();

		const { provider, credentials } = await request.json();

		// Get the user
		const user = await User.findOne({ clerkId: userId });
		if (!user) {
			return new NextResponse('User not found', { status: 404 });
		}

		switch (provider) {
			case 'anylist':
			case 'walmart':
			case 'amazon':
				await User.findByIdAndUpdate(
					user._id,
					{
						$set: {
							'shoppingListIntegration.provider': provider,
							'shoppingListIntegration.credentials': credentials,
						},
					},
					{ new: true }
				);
				break;

			default:
				return new NextResponse('Invalid provider', { status: 400 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error setting up shopping list integration:', error);
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const { userId } = getAuth(request);
		if (!userId) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		await connectDB();

		// Get the user
		const user = await User.findOne({ clerkId: userId });
		if (!user) {
			return new NextResponse('User not found', { status: 404 });
		}

		await User.findByIdAndUpdate(
			user._id,
			{
				$unset: {
					'shoppingListIntegration.provider': 1,
					'shoppingListIntegration.credentials': 1,
				},
			},
			{ new: true }
		);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error removing shopping list integration:', error);
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}
