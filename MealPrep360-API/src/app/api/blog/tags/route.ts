import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/connection';
import { BlogPost } from '@/lib/mongodb/schemas';

export async function GET() {
	try {
		await connectDB();
		const tags = await BlogPost.aggregate([
			{ $match: { published: true } },
			{ $unwind: '$tags' },
			{
				$group: {
					_id: '$tags',
					count: { $sum: 1 },
				},
			},
			{
				$project: {
					name: '$_id',
					slug: { $toLower: '$_id' },
					_count: { posts: '$count' },
				},
			},
			{ $sort: { name: 1 } },
		]);

		return NextResponse.json(tags);
	} catch (error) {
		console.error('Error fetching tags:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch tags' },
			{ status: 500 }
		);
	}
}
