export interface Recipe {
	_id: string;
	title: string;
	description?: string;
	servings: number;
	nutrition?: {
		calories?: number;
		protein?: number;
		carbs?: number;
		fat?: number;
	};
}

export interface RecipeItem {
	date: Date;
	recipeId: string;
	userId: string;
	servings: number;
	status: 'planned' | 'completed' | 'skipped';
	mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
	dayIndex: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface Day {
	date: Date;
	breakfast: Recipe | null;
	lunch: Recipe | null;
	dinner: Recipe | null;
	snacks: Recipe[];
}

export interface MealPlan {
	_id: string;
	id: string;
	startDate: Date;
	endDate: Date;
	days: Day[];
	recipes: Recipe[];
	recipeItems: RecipeItem[];
	dietaryPreferences: string[];
	restrictions: string[];
	totalCalories: number;
	userId: string;
	createdAt: Date;
	updatedAt: Date;
}

export type MealStatus = 'planned' | 'completed' | 'skipped';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';
