import { Unit } from './units';
import { Category } from './categories';

export interface Recipe {
	_id: string;
	title: string;
	ingredients: Array<{
		name: string;
		amount?: number;
		unit?: string;
		category?: Category;
	}>;
}

export interface MealPlanItem {
	recipeId: string;
	servings: number;
	dayOfWeek?: number;
	mealType?: string;
}

export interface BaseIngredient {
	name: string;
	category: Category;
}

export interface QuantifiableIngredient extends BaseIngredient {
	amount: number | null;
	unit: Unit | null;
}

export interface NormalizedIngredient extends QuantifiableIngredient {
	normalizedAmount: number;
	normalizedUnit: Unit;
}

export interface IIngredientReference {
	name: string;
	displayName: string;
	category: Category;
	defaultUnit: Unit;
	defaultAmount: number;
	alternateNames: string[];
	isCommonPantryItem: boolean;
}

// Re-export Category type
export { Category } from './categories';
