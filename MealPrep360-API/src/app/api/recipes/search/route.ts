import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { User, Recipe } from '@/lib/mongodb/schemas';

export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const user = await User.findOne({ clerkId: userId });

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const searchParams = request.nextUrl.searchParams;
		const query = searchParams.get('query') || '';
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '10');
		const skip = (page - 1) * limit;

		const searchQuery = {
			$or: [
				{ title: { $regex: query, $options: 'i' } },
				{ description: { $regex: query, $options: 'i' } },
				{ tags: query },
			],
		};

		const [recipes, total] = await Promise.all([
			Recipe.find(searchQuery).skip(skip).limit(limit).sort({ createdAt: -1 }),
			Recipe.countDocuments(searchQuery),
		]);

		return NextResponse.json({
			recipes,
			pagination: {
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error('Error searching recipes:', error);
		return NextResponse.json(
			{ error: 'Failed to search recipes' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
