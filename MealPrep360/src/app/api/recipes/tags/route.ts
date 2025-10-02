import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { Recipe, User } from '@/lib/mongodb/schemas';

export const dynamic = 'force-dynamic';
// GET /api/recipes/tags - Get all available recipe tags
export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		try {
			await connectDB();

			// Find user by Clerk ID to get the ObjectId
			const user = await User.findOne({ clerkId: userId });
			if (!user) {
				return NextResponse.json([], { status: 200 });
			}

			// Get all unique tags from user's recipes
			const tags = await Recipe.distinct('tags', { clerkId: userId });

			// Filter out empty/null tags and sort
			const filteredTags = tags.filter((tag) => tag && tag.trim()).sort();

			return NextResponse.json(filteredTags);
		} catch (dbError) {
			console.error('Database fallback failed:', dbError);
			return NextResponse.json([], { status: 200 });
		}
	} catch (error) {
		console.error('Error fetching recipe tags:', error);
		// Return empty array instead of 500 error
		return NextResponse.json([], { status: 200 });
	}
}
