import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User, MealPlan } from '@/lib/mongodb/schemas';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const status = searchParams.get('status') || 'planned';

		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		// Find user in our database
		const user = await User.findOne({ clerkId: userId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const mealCount = await MealPlan.countDocuments({ userId: user._id });

		// Find meal plans for the user with the specified status
		const meals = await MealPlan.find({
			userId: user._id,
			'recipeItems.status': status,
		})
			.populate('recipeItems.recipeId')
			.sort({ createdAt: -1 })
			.limit(50);

		return NextResponse.json({
			meals,
			totalCount: mealCount,
		});
	} catch (error) {
		console.error('Error fetching meals:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch meals' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
