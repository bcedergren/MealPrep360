import { Recipe } from './recipe';

export interface MealPlanDay {
	dinner: string | null; // Recipe ID
}

export interface MealPlanItem {
	_id?: string;
	date: Date;
	recipeId: string;
	userId: string;
	servings: number;
	status: 'planned' | 'completed' | 'skipped';
	mealType: 'dinner';
	dayIndex: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface SimpleRecipe {
	id: string;
	name: string;
}

export interface Day {
	date: string;
	meals: {
		breakfast?: SimpleRecipe;
		lunch?: SimpleRecipe;
		dinner?: SimpleRecipe;
	};
}

export interface MealPlanPreferences {
	startDate: Date;
	duration: number;
	skippedDays?: boolean[];
}

export interface MealPlan {
	id: string;
	userId: string;
	startDate: string;
	endDate: string;
	days: {
		recipeId: string | null;
		status: 'planned' | 'completed' | 'skipped';
	}[];
	createdAt: string;
	updatedAt: string;
}
