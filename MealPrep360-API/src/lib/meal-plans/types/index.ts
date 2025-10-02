import { IRecipeDocument } from '../../recipes/types/recipe';

export interface MealPlanPreferences {
	servingSize: number;
	mealPreference: 'vegetarian' | 'vegan' | 'omnivore';
	cookingSkillLevel: 'beginner' | 'intermediate' | 'advanced';
	prepTimePreference: 'quick' | 'medium' | 'long';
	cuisinePreferences?: string[];
}

export interface MealPlanDay {
	date: Date;
	meals: {
		recipe: IRecipeDocument;
		mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
		servings: number;
		notes?: string;
	}[];
	isSkipped: boolean;
	notes?: string;
}

export interface MealPlanCreateDTO {
	userId: string;
	startDate: string | Date;
	endDate: string | Date;
	days: MealPlanDay[];
	preferences?: MealPlanPreferences;
	dietaryRestrictions?: string[];
	excludedIngredients?: string[];
	notes?: string;
}

export interface MealPlanFilterDTO {
	userId: string;
	startDate?: Date;
	endDate?: Date;
	isActive?: boolean;
	includeSkipped?: boolean;
}

export interface MealPlanUpdateDTO {
	preferences?: Partial<MealPlanPreferences>;
	dietaryRestrictions?: string[];
	excludedIngredients?: string[];
	notes?: string;
}
