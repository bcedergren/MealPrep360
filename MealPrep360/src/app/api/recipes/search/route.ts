import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { Recipe, User } from '@/lib/mongodb/schemas';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/recipes/search - Search recipes with advanced filters
export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const params = Object.fromEntries(searchParams.entries());

		try {
			await connectDB();

			// Find user by Clerk ID to get the ObjectId
			const user = await User.findOne({ clerkId: userId });
			if (!user) {
				return NextResponse.json({ recipes: [], total: 0 }, { status: 200 });
			}

			// Parse pagination parameters
			const page = parseInt(params.page || '1');
			const limit = parseInt(params.limit || '10');
			const skip = (page - 1) * limit;

			// Build query based on search parameters
			const query: any = { clerkId: userId };

			if (params.search) {
				query.$text = { $search: params.search };
			}

			if (params.tags) {
				const tags = params.tags.split(',');
				query.tags = { $in: tags };
			}

			if (params.prepTime && params.prepTime !== 'all') {
				const prepTime = parseInt(params.prepTime);
				query.prepTime = { $lte: prepTime };
			}

			// Sort options
			const sortBy = params.sortBy || 'createdAt';
			const sortOrder = params.sortOrder === 'asc' ? 1 : -1;
			const sort: any = { [sortBy]: sortOrder };

			// Get recipes with pagination
			const [recipes, total] = await Promise.all([
				Recipe.find(query).sort(sort).skip(skip).limit(limit).lean(),
				Recipe.countDocuments(query),
			]);

			// Transform to expected format
			const transformedRecipes = recipes.map((recipe: any) => ({
				id: recipe._id.toString(),
				title: recipe.title,
				description: recipe.description,
				ingredients: recipe.ingredients,
				instructions: recipe.instructions,
				prepTime: recipe.prepTime,
				cookTime: recipe.cookTime,
				servings: recipe.servings,
				imageUrl: recipe.imageUrl,
				mealType: recipe.mealType,
				createdAt: recipe.createdAt,
				updatedAt: recipe.updatedAt,
			}));

			return NextResponse.json({
				recipes: transformedRecipes,
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			});
		} catch (dbError) {
			console.error('Database search failed:', dbError);
			return NextResponse.json({ recipes: [], total: 0 }, { status: 200 });
		}
	} catch (error) {
		console.error('Error searching recipes:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
