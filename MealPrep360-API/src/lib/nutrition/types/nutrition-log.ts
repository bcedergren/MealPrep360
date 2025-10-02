import { Document } from 'mongoose';
import { NutritionInfo, NutritionalGoals } from './index';

export interface INutritionLogDocument extends Document {
	userId: string;
	date: Date;
	mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
	recipeId?: string;
	recipeName?: string;
	servingSize: number;
	nutrition: NutritionInfo;
	notes?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface INutritionGoalsDocument extends Document {
	userId: string;
	goals: NutritionalGoals;
	startDate: Date;
	endDate?: Date;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}
