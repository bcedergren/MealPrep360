export interface DietaryPreferences {
	isVegetarian: boolean;
	isVegan: boolean;
	isPescatarian: boolean;
	isKeto: boolean;
	isGlutenFree: boolean;
	isDairyFree: boolean;
	isNutFree: boolean;
	isHalal: boolean;
	isKosher: boolean;
	customRestrictions: string[];
}

export interface CookingPreferences {
	skillLevel: 'beginner' | 'intermediate' | 'advanced';
	maxPrepTime: number; // in minutes
	preferredCuisines: string[];
	servingSize: number;
	mealPrepFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
	preferredCookingMethods: string[];
}

export interface NotificationPreferences {
	emailNotifications: boolean;
	pushNotifications: boolean;
	mealPlanReminders: boolean;
	shoppingListReminders: boolean;
	weeklyNewsletter: boolean;
	mealPrepReminders: boolean;
}

export interface UserCreateDTO {
	clerkId: string;
	email: string;
	name?: string;
	dietaryPreferences?: Partial<DietaryPreferences>;
	cookingPreferences?: Partial<CookingPreferences>;
	notificationPreferences?: Partial<NotificationPreferences>;
	timezone?: string;
}

export interface UserUpdateDTO {
	name?: string;
	dietaryPreferences?: Partial<DietaryPreferences>;
	cookingPreferences?: Partial<CookingPreferences>;
	notificationPreferences?: Partial<NotificationPreferences>;
	timezone?: string;
	isOnboarded?: boolean;
}

export interface UserFilterDTO {
	clerkId?: string;
	email?: string;
	isOnboarded?: boolean;
	hasActiveMealPlan?: boolean;
	dietaryPreferences?: Partial<DietaryPreferences>;
}
