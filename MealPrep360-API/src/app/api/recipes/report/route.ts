import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { User, Recipe, RecipeReport } from '@/lib/mongodb/schemas';
import connectDB from '@/lib/mongodb/connection';

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		const body = await request.json();
		const { recipeId, reason } = body;

		if (!recipeId) {
			return NextResponse.json(
				{ error: 'Recipe ID is required' },
				{ status: 400 }
			);
		}

		// Get user
		const user = await User.findOne({ clerkId: userId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Verify recipe exists
		const recipe = await Recipe.findById(recipeId);
		if (!recipe) {
			return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
		}

		// Use findOneAndUpdate with upsert to either create a new report or update existing one
		const report = await RecipeReport.findOneAndUpdate(
			{
				userId: user._id,
				recipeId: recipe._id,
			},
			{
				reason,
				status: 'pending',
				updatedAt: new Date(),
			},
			{
				upsert: true,
				new: true,
				setDefaultsOnInsert: true,
			}
		);

		return NextResponse.json(report, { status: 201 });
	} catch (error) {
		console.error('Error creating recipe report:', error);
		return NextResponse.json(
			{ error: 'Failed to create report' },
			{ status: 500 }
		);
	}
}
