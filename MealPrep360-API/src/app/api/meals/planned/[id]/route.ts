import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { User, MealPlan, Recipe } from '@/lib/mongodb/schemas';
import { MEALPLAN_SERVICE_URL, MEALPLAN_SERVICE_API_KEY } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		// Get or create the user in our database
		let user = await User.findOne({ clerkId: userId });
		if (!user) {
			user = await User.create({ clerkId: userId, email: '', name: '' });
		}

		// First check if the meal plan exists and belongs to the user
		const mealPlan = await MealPlan.findOne({
			_id: params.id,
			userId: user._id,
		});

		if (!mealPlan) {
			return new NextResponse('Meal plan not found', { status: 404 });
		}

		// Forward delete request to the meal plan service
		const response = await fetch(
			`${MEALPLAN_SERVICE_URL}/api/meal-plans/${params.id}`,
			{
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${MEALPLAN_SERVICE_API_KEY}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					userId: user._id.toString(),
				}),
			}
		);

		if (!response.ok) {
			const errorText = await response.text();
			console.error('Service error:', errorText);
			return new NextResponse('Failed to delete meal plan', {
				status: response.status,
			});
		}

		return new NextResponse(null, { status: 204 });
	} catch (error) {
		console.error('Error deleting meal plan:', error);
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get or create the user in our database
		let user = await User.findOne({ clerkId: userId });
		if (!user) {
			user = await User.create({ clerkId: userId, email: '', name: '' });
		}

		const { status } = await request.json();

		if (!status) {
			return NextResponse.json(
				{ error: 'Status is required' },
				{ status: 400 }
			);
		}

		// Forward update request to the meal plan service
		const response = await fetch(
			`${MEALPLAN_SERVICE_URL}/api/meal-plans/${params.id}`,
			{
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${MEALPLAN_SERVICE_API_KEY}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					userId: user._id.toString(),
					status: status,
				}),
			}
		);

		if (!response.ok) {
			const errorText = await response.text();
			console.error('Service error:', errorText);
			return NextResponse.json(
				{ error: 'Failed to update meal plan' },
				{ status: response.status }
			);
		}

		const updatedMealPlan = await response.json();
		return NextResponse.json(updatedMealPlan);
	} catch (error) {
		console.error('Error updating meal plan:', error);
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get or create the user in our database
		let user = await User.findOne({ clerkId: userId });
		if (!user) {
			user = await User.create({ clerkId: userId, email: '', name: '' });
		}

		// Get the meal plan
		const mealPlan = (await MealPlan.findOne({
			_id: params.id,
			userId: user._id,
		}).lean()) as {
			_id: string;
			recipeId: string;
			userId: string;
			status: string;
		} | null;

		if (!mealPlan) {
			return NextResponse.json(
				{ error: 'Meal plan not found' },
				{ status: 404 }
			);
		}

		// Populate recipe if needed
		if (mealPlan.recipeId) {
			const recipe = await Recipe.findById(mealPlan.recipeId).lean();
			(mealPlan as any).recipe = recipe;
		}

		return NextResponse.json(mealPlan);
	} catch (error) {
		console.error('Error fetching meal plan:', error);
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
