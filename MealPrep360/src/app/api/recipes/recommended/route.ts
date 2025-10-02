import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { Recipe, User } from '@/lib/mongodb/schemas';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/recipes/recommended - Get recommended recipes for user
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
				return NextResponse.json({
					recipes: [],
					total: 0,
					page: 1,
					limit: 20,
					message: 'No recommended recipes available (user not in database)',
				});
			}

			// Parse pagination parameters
			const page = parseInt(params.page || '1');
			const limit = parseInt(params.limit || '20');
			const skip = (page - 1) * limit;

			// Get recommended recipes from local database
			// For now, return recent recipes as "recommended"
			const allRecipes = await Recipe.find({})
				.select('clerkId title images')
				.lean();

			const [recipes, total] = await Promise.all([
				Recipe.find({})
					.select(
						'title description ingredients instructions prepTime cookTime servings images mealType createdAt updatedAt'
					)
					.sort({ createdAt: -1 })
					.skip(skip)
					.limit(limit)
					.lean(),
				Recipe.countDocuments({}),
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
				images: recipe.images || { main: '', thumbnail: '' },
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
				message: 'Recommended recipes from local database',
			});
		} catch (dbError) {
			console.error('Database recommended recipes failed:', dbError);
			return NextResponse.json({
				recipes: [],
				total: 0,
				page: 1,
				limit: 20,
				message: 'Recommended recipes temporarily unavailable',
			});
		}
	} catch (error) {
		console.error('Error fetching recommended recipes:', error);
		// Return empty array instead of 500 error
		return NextResponse.json({
			recipes: [],
			total: 0,
			page: 1,
			limit: 20,
			message: 'Recommended recipes temporarily unavailable',
		});
	}
}
