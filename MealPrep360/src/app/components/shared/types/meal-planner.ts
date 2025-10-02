import { Recipe } from '@/types/recipe';

export type MealStatus =
	| 'planned'
	| 'completed'
	| 'skipped'
	| 'cooked'
	| 'frozen'
	| 'consumed';

export interface Day {
	date: Date;
	recipeId: string | null;
	recipe: Recipe | null;
	mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
	status?: MealStatus;
	dayIndex: number;
}

export interface DisplayMealPlan {
	_id: string;
	id: string;
	startDate: Date;
	endDate: Date;
	days: Day[];
	userId: string;
	createdAt: string;
	updatedAt: string;
}

export interface MealPlanItem {
	_id: string;
	id: string;
	startDate: Date;
	endDate: Date;
	date: Date;
	recipeId: string | null;
	recipe: Recipe | null;
	mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
	status: MealStatus;
	dayIndex: number;
}

export interface MealPlannerProps {
	onAddMeal?: (date: string, mealType: string) => void;
}

export interface UserPreferences {
	settings: {
		settings: {
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
			mealPlanning: {
				weeklyPlanningEnabled: boolean;
				shoppingListEnabled: boolean;
				nutritionTrackingEnabled: boolean;
				defaultDuration: string;
				defaultServings: number;
			};
		};
	};
}
