import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/schemas';

export async function GET() {
	try {
		await connectDB();
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const user = await User.findOne({ clerkId: userId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Add any additional stats logic here using Mongoose

		return NextResponse.json({ success: true, user });
	} catch (error) {
		console.error('Error fetching user stats:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch user stats' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
