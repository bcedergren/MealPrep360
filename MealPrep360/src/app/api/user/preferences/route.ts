import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

// Default user preferences
const defaultPreferences = {
	settings: {
		settings: {
			preferences: {
				dietaryPreferences: [],
				allergies: [],
				cookingSkill: 'Intermediate',
				cookingTime: 'Moderate (30-60 min)',
				cuisines: [],
				kidFriendly: false,
				quickMeals: false,
				healthy: false,
			},
			mealPlanning: {
				weeklyPlanningEnabled: true,
				shoppingListEnabled: true,
				nutritionTrackingEnabled: true,
				defaultDuration: '14',
				defaultServings: 4,
			},
		},
	},
};

// GET /api/user/preferences - Get user preferences
export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Return default preferences for now
		// In a real implementation, you would fetch from your database
		return NextResponse.json(defaultPreferences);
	} catch (error) {
		console.error('Error fetching user preferences:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch user preferences' },
			{ status: 500 }
		);
	}
}

export async function PUT(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();

		// In a real implementation, you would save to your database

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error updating user preferences:', error);
		return NextResponse.json(
			{ error: 'Failed to update user preferences' },
			{ status: 500 }
		);
	}
}
