import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/schemas';
import { clerkClient } from '@clerk/clerk-sdk-node';

export async function getOrCreateUser(clerkId: string) {
	await connectDB(); // Connect to database
	let user = await User.findOne({ clerkId });
	if (!user) {
		const clerkUser = await clerkClient.users.getUser(clerkId);

		user = await User.create({
			clerkId,
			email: clerkUser.emailAddresses[0]?.emailAddress || '',
			name: clerkUser.firstName || '',
			image: clerkUser.imageUrl || '',
			// Add other fields as needed
		});
	}
	return user;
}
