export interface Ingredient {
	name: string;
	amount: number;
	unit: string;
}

export interface NutritionalInfo {
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
}

export interface Recipe {
	id: string;
	userId: string;
	name: string;
	description: string;
	ingredients: Ingredient[];
	instructions: string[];
	prepTime: number;
	cookTime: number;
	servings: number;
	nutritionalInfo: NutritionalInfo;
	tags: string[];
	dietaryPreferences: string[];
	restrictions: string[];
}
