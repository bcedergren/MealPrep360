import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/schemas';

export const dynamic = 'force-dynamic';

// Default settings structure
const defaultSettings = {
	theme: {
		mode: 'light',
		contrast: false,
		animations: true,
	},
	display: {
		recipeLayout: 'grid',
		fontSize: 'medium',
		imageQuality: 'medium',
	},
	language: {
		preferred: 'en',
		measurementSystem: 'metric',
	},
	notifications: {
		email: true,
		push: true,
		mealPlanReminders: true,
		shoppingListReminders: true,
		quietHours: {
			enabled: false,
			start: '22:00',
			end: '08:00',
		},
	},
	privacy: {
		profileVisibility: 'public',
		shareRecipes: true,
		showCookingHistory: true,
	},
	security: {
		twoFactorAuth: false,
	},
	mealPlanning: {
		weeklyPlanningEnabled: true,
		shoppingListEnabled: true,
		nutritionTrackingEnabled: true,
		defaultDuration: '30 minutes',
		defaultServings: 2,
	},
	integrations: {
		calendar: 'none',
		shoppingList: 'none',
	},
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
	onboarding: {
		tutorialCompleted: false,
	},
};

export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		// Find or create user by Clerk ID
		let user = await User.findOne({ clerkId: userId });

		if (!user) {
			// Create new user with default settings
			user = new User({
				clerkId: userId,
				email: `${userId}@temp.com`, // Temporary email, will be updated later
				settings: defaultSettings,
			});
			await user.save();
		}

		// Merge user settings with defaults to ensure all fields are present
		const userSettings = {
			...defaultSettings,
			...user.settings,
		};

		return NextResponse.json(userSettings);
	} catch (error) {
		console.error('Error fetching settings:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch settings' },
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
		await connectDB();

		// Find or create user
		let user = await User.findOne({ clerkId: userId });

		if (!user) {
			// Create new user with default settings
			user = new User({
				clerkId: userId,
				email: `${userId}@temp.com`, // Temporary email, should be updated with real email
				settings: defaultSettings,
			});
		}

		// Deep merge function for nested objects
		const deepMerge = (target: any, source: any) => {
			for (const key in source) {
				if (source[key] instanceof Object && !Array.isArray(source[key])) {
					if (!target[key]) Object.assign(target, { [key]: {} });
					deepMerge(target[key], source[key]);
				} else {
					Object.assign(target, { [key]: source[key] });
				}
			}
			return target;
		};

		// Merge new settings with existing settings
		const updatedSettings = deepMerge(
			deepMerge({}, defaultSettings),
			deepMerge(user.settings || {}, body)
		);

		// Update user settings
		user.settings = updatedSettings;
		user.updatedAt = new Date();

		await user.save();

		return NextResponse.json(updatedSettings);
	} catch (error) {
		console.error('Error updating settings:', error);
		return NextResponse.json(
			{ error: 'Failed to update settings' },
			{ status: 500 }
		);
	}
}
