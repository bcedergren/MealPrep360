import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/schemas';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import { UserSettings } from '@/types/settings';

export async function GET(request: NextRequest) {
	try {
		const { userId } = getAuth(request);
		if (!userId) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		await connectDB();

		const user = await User.findOne({ clerkId: userId });

		// Return the settings directly if they exist, otherwise return default settings
		return NextResponse.json(user?.settings || DEFAULT_SETTINGS);
	} catch (error) {
		console.error('Error fetching settings:', error);
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}

export async function PUT(request: NextRequest) {
	try {
		const { userId } = getAuth(request);
		if (!userId) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		const body = await request.json();

		// Validate the settings structure
		if (!body || typeof body !== 'object') {
			return new NextResponse('Invalid settings format', { status: 400 });
		}

		await connectDB();

		// Find or create user
		let user = await User.findOne({ clerkId: userId });
		if (!user) {
			user = await User.create({
				clerkId: userId,
				email: `${userId}@clerk.com`, // Temporary email since we don't have access to the actual email here
				name: 'User',
				settings: DEFAULT_SETTINGS,
			});
		}

		// Merge current settings with new ones
		const mergedSettings = {
			...(user.settings || DEFAULT_SETTINGS),
			...body,
		} as UserSettings;

		// Update user settings
		user = await User.findByIdAndUpdate(
			user._id,
			{ $set: { settings: mergedSettings } },
			{ new: true }
		);

		// Return the updated settings
		return NextResponse.json(user.settings);
	} catch (error) {
		console.error('Error updating settings:', error);
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}

export const dynamic = 'force-dynamic';
