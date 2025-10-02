import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { User, Recipe, ImageReport } from '@/lib/mongodb/schemas';

export async function POST(req: NextRequest) {
	try {
		const { userId: clerkId } = await auth();
		if (!clerkId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await req.json();
		const { recipeId } = body;

		if (!recipeId) {
			return NextResponse.json({ error: 'Missing recipeId' }, { status: 400 });
		}

		// Get user from database
		const user = await User.findOne({ clerkId });
		if (!user) {
			throw new Error('User not found');
		}

		// Verify recipe exists
		const recipe = await Recipe.findById(recipeId);
		if (!recipe) {
			throw new Error('Recipe not found');
		}

		// Use findOneAndUpdate with upsert to either create a new report or update existing one
		const report = await ImageReport.findOneAndUpdate(
			{
				userId: user._id,
				recipeId: recipeId,
			},
			{
				$set: {
					status: 'pending',
					updatedAt: new Date(),
				},
				$setOnInsert: {
					reason: 'inaccurate',
				},
			},
			{
				upsert: true,
				new: true,
			}
		);

		return NextResponse.json({
			message: 'Image reported successfully',
			report,
		});
	} catch (error) {
		console.error('Error reporting image:', error);

		// Handle specific error cases
		if (error instanceof Error) {
			if (error.message === 'User not found') {
				return NextResponse.json({ error: 'User not found' }, { status: 404 });
			}
			if (error.message === 'Recipe not found') {
				return NextResponse.json(
					{ error: 'Recipe not found' },
					{ status: 404 }
				);
			}
		}

		return NextResponse.json(
			{ error: 'Failed to report image' },
			{ status: 500 }
		);
	}
}
