import { Document } from 'mongodb';
import { MealPlan, MealPlanDay } from '../../domain/models/MealPlan';
import { Recipe } from '../../domain/models/Recipe';

export interface MongoMealPlan
	extends Document,
		Omit<MealPlan, 'id' | 'startDate' | 'endDate' | 'createdAt' | 'updatedAt'> {
	_id: string;
	id: string;
	userId: string;
	startDate: Date;
	endDate: Date;
	days: MealPlanDay[];
	createdAt: Date;
	updatedAt: Date;
}

export interface MongoRecipe extends Document, Omit<Recipe, 'id'> {
	_id: string;
}

export interface MongoSavedRecipe extends Document {
	_id: string;
	userId: string;
	savedRecipes: Array<{
		_id: string;
		recipeId: string;
		savedAt: Date;
	}>;
	createdAt: Date;
	updatedAt: Date;
}
