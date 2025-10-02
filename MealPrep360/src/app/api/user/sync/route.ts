import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { serverApiClient } from '@/lib/api-client-server';
import { API_CONFIG } from '@/lib/api-config';
import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/schemas';
import jwt from 'jsonwebtoken';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';


// POST /api/user/sync - Manually sync user with external API
export async function POST(request: NextRequest) {
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

		// Get user details from Clerk
		const user = await currentUser();
		if (!user) {
			return NextResponse.json(
				{ error: 'User not found in Clerk' },
				{ status: 404 }
			);
		}

		console.log('Syncing user with external API:', userId);

		// Try to create user on external API with full user data
		const userData = {
			clerkId: userId,
			email: user.emailAddresses[0]?.emailAddress || `${userId}@temp.com`,
			name:
				user.firstName && user.lastName
					? `${user.firstName} ${user.lastName}`
					: user.firstName || user.lastName || 'User',
			role: 'USER',
		};

		console.log(
			'External API endpoint:',
			API_CONFIG.endpoints.user,
			'Body:',
			userData
		);
		const response = await serverApiClient.post(
			API_CONFIG.endpoints.user,
			userData
		);
		if (!response.success) {
			console.error('API error message:', response.error);
		}

		if (response.success) {
			console.log('✅ User synced successfully');
			return NextResponse.json({
				success: true,
				message: 'User synchronized successfully',
				data: response.data,
			});
		} else {
			// If user already exists, that's also a success
			if (
				response.error?.includes('already exists') ||
				response.error?.includes('duplicate')
			) {
				console.log('✅ User already exists on external API');
				return NextResponse.json({
					success: true,
					message: 'User already exists and is synchronized',
				});
			}

			// Handle method not allowed (405) or other API limitations gracefully
			if (
				response.status === 405 ||
				response.error?.includes('Method Not Allowed')
			) {
				console.log(
					'⚠️ External API user sync not supported, continuing with local auth'
				);
				return NextResponse.json({
					success: true,
					message: 'User authenticated locally (external sync not required)',
					warning: 'External API user sync not available',
				});
			}

			// Handle external API failures by falling back to local database
			console.error(
				'External user sync API failed, falling back to local database'
			);

			try {
				await connectDB();

				// Create or update user in local database
				const existingUser = await User.findOne({ clerkId: userId });

				if (existingUser) {
					// Update existing user
					existingUser.email = userData.email;
					existingUser.name = userData.name;
					existingUser.lastLogin = new Date();
					existingUser.updatedAt = new Date();
					await existingUser.save();

					return NextResponse.json({
						success: true,
						message: 'User updated in local database',
						data: {
							id: existingUser._id.toString(),
							clerkId: existingUser.clerkId,
							email: existingUser.email,
							name: existingUser.name,
							role: existingUser.role,
						},
					});
				} else {
					// Create new user in local database
					const newUser = new User({
						...userData,
						lastLogin: new Date(),
						createdAt: new Date(),
						updatedAt: new Date(),
					});

					await newUser.save();

					return NextResponse.json({
						success: true,
						message: 'User created in local database',
						data: {
							id: newUser._id.toString(),
							clerkId: newUser.clerkId,
							email: newUser.email,
							name: newUser.name,
							role: newUser.role,
						},
					});
				}
			} catch (dbError) {
				console.error('Database fallback failed:', dbError);
				return NextResponse.json({
					success: true,
					message: 'User authenticated locally (database unavailable)',
					warning: 'User sync failed but authentication successful',
				});
			}
		}
	} catch (error) {
		console.error('Error syncing user:', error);
		// Return success instead of error to prevent blocking authentication
		return NextResponse.json({
			success: true,
			message: 'User authenticated locally (sync error occurred)',
			warning: 'User sync failed but authentication successful',
		});
	}
}
