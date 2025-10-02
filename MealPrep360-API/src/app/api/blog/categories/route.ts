import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/connection';
import { BlogPost } from '@/lib/mongodb/schemas';

export async function GET() {
	try {
		await connectDB();
		const categories = await BlogPost.aggregate([
			{ $match: { published: true } },
			{
				$group: {
					_id: '$category',
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

		return NextResponse.json(categories);
	} catch (error) {
		console.error('Error fetching categories:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch categories' },
			{ status: 500 }
		);
	}
}
