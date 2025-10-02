import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { Recipe } from '@/lib/mongodb/schemas';
import { analyzeRecipe } from '@/lib/openai';

export async function POST(request: NextRequest) {
	try {
		const { userId } = getAuth(request);
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { recipeId } = await request.json();

		if (!recipeId) {
			return NextResponse.json(
				{ error: 'Recipe ID is required' },
				{ status: 400 }
			);
		}

		// Get the recipe
		const recipe = await Recipe.findOne({
			_id: recipeId,
			userId: userId,
		});

		if (!recipe) {
			return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
		}

		// Analyze the recipe using OpenAI
		const analysis = await analyzeRecipe(recipe);

		// Update the recipe with the analysis
		const updatedRecipe = await Recipe.findOneAndUpdate(
			{
				_id: recipeId,
				userId: userId,
			},
			{
				$set: {
					description: analysis,
				},
			},
			{ new: true }
		);

		return NextResponse.json(updatedRecipe);
	} catch (error) {
		console.error('Error analyzing recipe:', error);
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
