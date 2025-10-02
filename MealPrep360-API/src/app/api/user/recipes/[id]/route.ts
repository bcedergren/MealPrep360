import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { User, Recipe, UserRecipe } from '@/lib/mongodb/schemas';

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		// Get the user from the database
		const user = await User.findOne({ clerkId: userId });

		if (!user) {
			return new NextResponse('User not found', { status: 404 });
		}

		// First check if the recipe exists at all
		const recipeExists = await Recipe.findById(params.id);

		if (!recipeExists) {
			return new NextResponse('Recipe not found', { status: 404 });
		}

		// Check if the recipe is saved in the user's collection
		const userRecipeCollection = await UserRecipe.findOne({ userId: user._id });
		if (!userRecipeCollection) {
			return new NextResponse('Recipe not found in your saved recipes', {
				status: 404,
			});
		}

		const savedRecipe = userRecipeCollection.savedRecipes.find(
			(saved: any) => saved.recipeId.toString() === params.id
		);

		if (!savedRecipe) {
			return new NextResponse('Recipe not found in your saved recipes', {
				status: 404,
			});
		}

		return NextResponse.json(savedRecipe);
	} catch (error) {
		console.error('Error checking saved recipe:', error);
		return new NextResponse('Internal error', { status: 500 });
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId: clerkId } = await auth();

		if (!clerkId) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		if (!params.id) {
			return new NextResponse('Recipe ID is required', { status: 400 });
		}

		// Get the internal user ID
		const user = await User.findOne({ clerkId });

		if (!user) {
			return new NextResponse('User not found', { status: 404 });
		}

		const recipe = await Recipe.findById(params.id);

		if (!recipe) {
			return new NextResponse('Recipe not found', { status: 404 });
		}

		if (recipe.clerkId !== clerkId) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		await Recipe.deleteOne({ _id: params.id });

		return new NextResponse(null, { status: 204 });
	} catch (error) {
		console.error('[RECIPE_DELETE]', error);
		return new NextResponse('Internal error', { status: 500 });
	}
}

export const dynamic = 'force-dynamic';
