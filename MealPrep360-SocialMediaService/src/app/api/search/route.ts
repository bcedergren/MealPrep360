import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { Recipe } from '@/models/Recipe';
import { Post } from '@/models/Post';

interface SearchResult {
	recipes: Array<{
		_id: string;
		title: string;
		description: string;
		authorId: string;
		createdAt: Date;
		updatedAt: Date;
	}>;
	posts: Array<{
		_id: string;
		content: string;
		authorId: string;
		createdAt: Date;
		updatedAt: Date;
	}>;
}

/**
 * @swagger
 * /api/search:
 *   get:
 *     description: Search for recipes and posts
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         required: false
 *         schema:
 *           type: string
 *           enum: [all, users, posts]
 *     responses:
 *       200:
 *         description: Search results
 */
export async function GET(request: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();
		const { searchParams } = new URL(request.url);
		const query = searchParams.get('q');
		const type = searchParams.get('type') || 'all'; // 'users', 'posts', or 'all'
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '10');

		if (!query) {
			return NextResponse.json(
				{ error: 'Search query is required' },
				{ status: 400 }
			);
		}

		const searchRegex = new RegExp(query, 'i');
		const results: SearchResult = {
			recipes: [],
			posts: [],
		};

		if (type === 'all' || type === 'recipes') {
			results.recipes = await Recipe.find({
				$and: [
					{
						$or: [
							{ title: searchRegex },
							{ description: searchRegex },
							{ tags: searchRegex },
						],
					},
					{
						$or: [
							{ isPublic: true },
							{ authorId: userId },
							{ 'collaborators.userId': userId },
						],
					},
				],
			})
				.sort({ createdAt: -1 })
				.skip((page - 1) * limit)
				.limit(limit)
				.select('-__v');
		}

		if (type === 'all' || type === 'posts') {
			results.posts = await Post.find({
				$and: [
					{
						$or: [{ content: searchRegex }, { tags: searchRegex }],
					},
					{
						$or: [
							{ isPublic: true },
							{ authorId: userId },
							{ 'mentions.userId': userId },
						],
					},
				],
			})
				.sort({ createdAt: -1 })
				.skip((page - 1) * limit)
				.limit(limit)
				.select('-__v');
		}

		return NextResponse.json(results);
	} catch (error) {
		console.error('Error performing search:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
