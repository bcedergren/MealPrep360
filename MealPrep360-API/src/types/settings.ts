export interface UserSettings {
	theme: {
		mode: 'light' | 'dark' | 'system';
		contrast: boolean;
		animations: boolean;
	};
	display: {
		recipeLayout: 'grid' | 'list';
		fontSize: 'small' | 'medium' | 'large';
		imageQuality: 'low' | 'medium' | 'high';
	};
	language: {
		preferred: 'en' | 'es';
		measurementSystem: 'metric' | 'imperial';
	};
	notifications: {
		email: boolean;
		push: boolean;
		mealPlanReminders: boolean;
		shoppingListReminders: boolean;
		quietHours: {
			enabled: boolean;
			start: string;
			end: string;
		};
	};
	privacy: {
		profileVisibility: 'public' | 'private';
		shareRecipes: boolean;
		showCookingHistory: boolean;
	};
	security: {
		twoFactorAuth: boolean;
	};
	mealPlanning: {
		weeklyPlanningEnabled: boolean;
		shoppingListEnabled: boolean;
		nutritionTrackingEnabled: boolean;
		defaultDuration: string;
		defaultServings: number;
	};
	integrations: {
		calendar: 'none' | 'google' | 'outlook' | 'apple';
		shoppingList: 'none' | 'anylist' | 'walmart' | 'amazon';
	};
	preferences: {
		dietaryPreferences: string[];
		allergies: string[];
		cookingSkill: string;
		cookingTime: string;
		cuisines: string[];
		kidFriendly: boolean;
		quickMeals: boolean;
		healthy: boolean;
	};
	onboarding: {
		tutorialCompleted: boolean;
	};
}
