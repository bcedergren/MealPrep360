import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/schemas';
import { OAuth2Client } from 'google-auth-library';

// Initialize OAuth2 client
const oauth2Client = new OAuth2Client(
	process.env.GOOGLE_CLIENT_ID,
	process.env.GOOGLE_CLIENT_SECRET,
	process.env.GOOGLE_REDIRECT_URI
);

export async function POST(request: NextRequest) {
	try {
		const session = await auth();
		if (!session?.userId) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		await connectDB();

		const { provider, code } = await request.json();

		// Get the user
		const user = await User.findOne({ clerkId: session.userId });
		if (!user) {
			return new NextResponse('User not found', { status: 404 });
		}

		switch (provider) {
			case 'google':
				const { tokens } = await oauth2Client.getToken(code);
				if (
					!tokens.access_token ||
					!tokens.refresh_token ||
					!tokens.expiry_date
				) {
					return new NextResponse('Invalid token response from Google', {
						status: 400,
					});
				}

				await User.findByIdAndUpdate(
					user._id,
					{
						$set: {
							'calendarIntegration.provider': 'google',
							'calendarIntegration.accessToken': tokens.access_token,
							'calendarIntegration.refreshToken': tokens.refresh_token,
							'calendarIntegration.expiryDate': new Date(tokens.expiry_date),
						},
					},
					{ new: true }
				);
				break;

			case 'outlook':
				// Implement Outlook OAuth flow
				break;

			case 'apple':
				// Implement Apple Calendar integration
				break;

			default:
				return new NextResponse('Invalid provider', { status: 400 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error setting up calendar integration:', error);
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}

export async function DELETE() {
	try {
		const session = await auth();
		if (!session?.userId) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		await connectDB();

		// Get the user
		const user = await User.findOne({ clerkId: session.userId });
		if (!user) {
			return new NextResponse('User not found', { status: 404 });
		}

		await User.findByIdAndUpdate(
			user._id,
			{
				$unset: {
					'calendarIntegration.provider': 1,
					'calendarIntegration.accessToken': 1,
					'calendarIntegration.refreshToken': 1,
					'calendarIntegration.expiryDate': 1,
				},
			},
			{ new: true }
		);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error removing calendar integration:', error);
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}
