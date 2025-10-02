import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User, Recipe } from '@/lib/mongodb/schemas';
import { parseIngredient } from '@/lib/ingredients';

export async function POST(request: NextRequest) {
	try {
		const { userId } = getAuth(request);

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		// Get the user
		const user = await User.findOne({ clerkId: userId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Get all recipes
		const recipes = await Recipe.find({
			$or: [{ ingredients: { $exists: false } }, { ingredients: null }],
		});

		let updatedCount = 0;
		for (const recipe of recipes) {
			// Check if recipe has no ingredients
			if (!recipe.ingredients) {
				continue;
			}

			const ingredientLines = recipe.ingredients
				.split('\n')
				.filter((line: string) => line.trim() !== '');

			const parsedIngredients = [];
			for (const line of ingredientLines) {
				try {
					const parsed = parseIngredient(line);
					if (parsed) {
						parsedIngredients.push(parsed);
					}
				} catch (error) {
					console.warn(`- Warning: Failed to parse ingredient: ${line}`);
				}
			}

			if (parsedIngredients.length > 0) {
				await Recipe.findByIdAndUpdate(recipe._id, {
					parsedIngredients: parsedIngredients,
				});
				updatedCount++;
			}
		}

		return NextResponse.json({
			message: 'Successfully fixed ingredients',
			recipesProcessed: recipes.length,
			updatedCount,
		});
	} catch (error) {
		console.error('Error fixing ingredients:', error);
		return NextResponse.json(
			{ error: 'Failed to fix ingredients' },
			{ status: 500 }
		);
	}
}
