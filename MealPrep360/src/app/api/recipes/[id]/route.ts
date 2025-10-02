import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { Recipe } from '@/lib/mongodb/schemas';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/recipes/[id] - Get specific recipe details
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		try {
			await connectDB();

			// Find recipe by ID in local database
			const recipe = (await Recipe.findById(params.id)
				.select(
					'title description ingredients instructions prepTime cookTime servings images mealType createdAt updatedAt tags prepInstructions cookingInstructions defrostInstructions servingInstructions storageTime containerSuggestions freezerPrep isPublic imageUrl imageStoragePath imageType hasImage'
				)
				.lean()) as any;
			if (!recipe) {
				// Fallback: fetch from external API
				try {
					const externalRes = await fetch(
						`${process.env.NEXT_PUBLIC_API_URL || 'https://api.mealprep360.com'}/recipes/${params.id}`,
						{ headers: { Accept: 'application/json' } }
					);
					if (externalRes.ok) {
						const ext = await externalRes.json();
						return NextResponse.json(ext);
					}
				} catch (e) {}
				return NextResponse.json(
					{ error: 'Recipe not found' },
					{ status: 404 }
				);
			}

			// Transform to expected format
			const transformedRecipe = {
				id: recipe._id.toString(),
				title: recipe.title,
				description: recipe.description,
				ingredients: recipe.ingredients,
				instructions: recipe.instructions,
				prepTime: recipe.prepTime,
				cookTime: recipe.cookTime,
				servings: recipe.servings,
				images: recipe.images || {
					main: recipe.imageUrl || recipe.imageStoragePath || '',
					thumbnail: recipe.imageUrl || recipe.imageStoragePath || '',
					additional: [],
				},
				mealType: recipe.mealType,
				createdAt: recipe.createdAt,
				updatedAt: recipe.updatedAt,
				tags: recipe.tags || [],
				prepInstructions: recipe.prepInstructions || [],
				cookingInstructions: recipe.cookingInstructions || [],
				defrostInstructions: recipe.defrostInstructions || [],
				servingInstructions: recipe.servingInstructions || [],
				storageTime: recipe.storageTime,
				containerSuggestions: recipe.containerSuggestions || [],
				freezerPrep: recipe.freezerPrep || [],
				isPublic: recipe.isPublic || false,
			};

			return NextResponse.json(transformedRecipe);
		} catch (dbError) {
			return NextResponse.json(
				{ error: 'Failed to fetch recipe' },
				{ status: 500 }
			);
		}
	} catch (error) {
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// PUT /api/recipes/[id] - Update recipe
export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();

		try {
			await connectDB();

			// Update recipe in local database
			const updatedRecipe = (await Recipe.findByIdAndUpdate(
				params.id,
				{ ...body, updatedAt: new Date() },
				{ new: true }
			).lean()) as any;

			if (!updatedRecipe) {
				return NextResponse.json(
					{ error: 'Recipe not found' },
					{ status: 404 }
				);
			}

			// Transform to expected format
			const transformedRecipe = {
				id: updatedRecipe._id.toString(),
				title: updatedRecipe.title,
				description: updatedRecipe.description,
				ingredients: updatedRecipe.ingredients,
				instructions: updatedRecipe.instructions,
				prepTime: updatedRecipe.prepTime,
				cookTime: updatedRecipe.cookTime,
				servings: updatedRecipe.servings,
				imageUrl: updatedRecipe.imageUrl,
				mealType: updatedRecipe.mealType,
				createdAt: updatedRecipe.createdAt,
				updatedAt: updatedRecipe.updatedAt,
			};

			return NextResponse.json(transformedRecipe);
		} catch (dbError) {
			return NextResponse.json(
				{ error: 'Failed to update recipe' },
				{ status: 500 }
			);
		}
	} catch (error) {
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// DELETE /api/recipes/[id] - Delete recipe
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		try {
			await connectDB();

			// Delete recipe from local database
			const deletedRecipe = await Recipe.findByIdAndDelete(params.id);

			if (!deletedRecipe) {
				return NextResponse.json(
					{ error: 'Recipe not found' },
					{ status: 404 }
				);
			}

			return NextResponse.json({ message: 'Recipe deleted successfully' });
		} catch (dbError) {
			return NextResponse.json(
				{ error: 'Failed to delete recipe' },
				{ status: 500 }
			);
		}
	} catch (error) {
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
