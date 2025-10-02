import { z } from 'zod';
import { Document } from 'mongoose';

export type Category =
	| 'Produce'
	| 'Dairy'
	| 'Meat'
	| 'Seafood'
	| 'Pantry'
	| 'Spices'
	| 'Bakery'
	| 'Frozen'
	| 'Other';
export type Unit =
	| 'g'
	| 'kg'
	| 'oz'
	| 'lb'
	| 'ml'
	| 'l'
	| 'cup'
	| 'tbsp'
	| 'tsp'
	| 'piece'
	| 'whole'
	| 'pinch';

// Base interfaces
export interface Ingredient {
	name: string;
	amount: number;
	unit: Unit;
	category: Category;
}

export interface NormalizedIngredient extends Ingredient {
	normalizedAmount: number;
	normalizedUnit: Unit;
}

export interface Recipe {
	_id: string;
	title: string;
	ingredients: Ingredient[];
}

export interface MealPlanItem {
	recipeId: string;
	servings: number;
	dayOfWeek?: number | null;
	mealType?: string | null;
}

export interface MealPlan {
	_id: string;
	userId: string;
	items: MealPlanItem[];
	days?: Array<{
		date?: Date | null;
		recipeId?: string | null;
		recipe?: Recipe | null;
		mealType?: string | null;
		status?: string | null;
		dayIndex?: number | null;
		servings?: number | null;
	}>;
	startDate?: Date | null;
	endDate?: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

// Mongoose document interfaces
export interface IIngredientReference extends Document {
	name: string;
	displayName: string;
	category: Category;
	alternateNames: string[];
	defaultUnit: Unit;
	defaultAmount: number;
	isCommonPantryItem: boolean;
	createdAt: Date;
	updatedAt: Date;
}

// Zod schemas
export const CategorySchema = z.enum([
	'Produce',
	'Dairy',
	'Meat',
	'Seafood',
	'Pantry',
	'Spices',
	'Bakery',
	'Frozen',
	'Other',
]);
export const UnitSchema = z.enum([
	'g',
	'kg',
	'oz',
	'lb',
	'ml',
	'l',
	'cup',
	'tbsp',
	'tsp',
	'piece',
	'whole',
	'pinch',
]);

export const IngredientSchema = z.object({
	name: z.string(),
	amount: z.number(),
	unit: UnitSchema,
	category: CategorySchema,
});

export const RecipeSchema = z.object({
	_id: z.string(),
	title: z.string(),
	ingredients: z.array(IngredientSchema),
});

export const ShoppingListRequestSchema = z.object({
	userId: z.string(),
	mealPlanId: z.string().optional(),
	recipeIds: z.array(z.string()).optional(),
	recipes: z.array(RecipeSchema).optional(),
	pantryExclusions: z.array(z.string()).optional(),
});
