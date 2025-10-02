import { Document } from 'mongoose';
import { MealPlanDay, MealPlanPreferences } from './index';

export interface IMealPlanDocument extends Document {
	userId: string;
	startDate: Date;
	endDate: Date;
	days: MealPlanDay[];
	preferences?: MealPlanPreferences;
	dietaryRestrictions: string[];
	excludedIngredients: string[];
	isActive: boolean;
	notes?: string;
	createdAt: Date;
	updatedAt: Date;
}
