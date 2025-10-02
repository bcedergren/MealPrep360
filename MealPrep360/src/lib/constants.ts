import { UserSettings } from '@/types/settings';

export const DEFAULT_SETTINGS: UserSettings = {
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
		push: false,
		mealPlanReminders: true,
		shoppingListReminders: true,
		quietHours: {
			enabled: false,
			start: '22:00',
			end: '08:00',
		},
	},
	privacy: {
		profileVisibility: 'private',
		shareRecipes: false,
		showCookingHistory: false,
	},
	security: {
		twoFactorAuth: false,
	},
	mealPlanning: {
		weeklyPlanningEnabled: true,
		shoppingListEnabled: true,
		nutritionTrackingEnabled: true,
		defaultDuration: '14',
		defaultServings: 4,
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
} as const;

export const COOKING_TIMES = {
	'Quick (15-30 min)': '30',
	'Moderate (30-60 min)': '60',
	'Long (60+ min)': '120',
} as const;

export const COOKING_SKILLS = {
	Beginner: 'beginner',
	Intermediate: 'intermediate',
	Advanced: 'advanced',
} as const;
