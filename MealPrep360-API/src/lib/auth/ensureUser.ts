import { auth, currentUser } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/schemas';

/**
 * Ensures that a Clerk user exists in our MongoDB database.
 * Creates the user if they don't exist.
 * Returns the user document or null if authentication fails.
 */
export async function ensureUser(): Promise<any | null> {
	try {
		// Get the current user from Clerk
		const { userId } = await auth();

		if (!userId) {
			console.log('No userId from Clerk auth');
			return null;
		}

		// Connect to database
		await connectDB();

		// Check if user exists in database
		let dbUser = await User.findOne({ clerkId: userId });

		if (!dbUser) {
			console.log(`User ${userId} not found in database, creating...`);

			// Get user details from Clerk
			const clerkUser = await currentUser();

			if (!clerkUser) {
				console.error('Could not fetch user details from Clerk');
				return null;
			}

			// Create user in database
			dbUser = await User.create({
				clerkId: userId,
				email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
				name: clerkUser.firstName
					? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim()
					: clerkUser.username || 'User',
				image: clerkUser.imageUrl || '',
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			console.log(`Created user ${userId} in database`);
		}

		return dbUser;
	} catch (error) {
		console.error('Error in ensureUser:', error);
		return null;
	}
}

/**
 * Authentication wrapper that ensures user exists in database
 * Use this instead of auth() when you need to ensure database consistency
 */
export async function authWithUser(): Promise<{
	userId: string | null;
	user: any | null;
	sessionId: string | null;
	sessionClaims: any;
}> {
	const { userId, sessionId, sessionClaims } = await auth();

	if (!userId) {
		return { userId: null, user: null, sessionId, sessionClaims };
	}

	const user = await ensureUser();

	return {
		userId,
		user,
		sessionId,
		sessionClaims,
	};
}
