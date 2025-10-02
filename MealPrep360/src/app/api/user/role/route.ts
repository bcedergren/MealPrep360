import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/schemas';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	try {
		// Get the authenticated user's ID from Clerk
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Connect to database
		await connectDB();

		// Find the user by Clerk ID
		const user = await User.findOne({ clerkId: userId }).select('role');

		if (!user) {
			// User doesn't exist in our database yet, return default role
			return NextResponse.json({ role: 'USER' });
		}

		return NextResponse.json({
			role: user.role || 'USER',
		});
	} catch (error) {
		console.error('Error fetching user role:', error);
		return NextResponse.json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
