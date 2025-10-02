import mongoose from 'mongoose';
import { MealPlan } from '../types';

const mealPlanSchema = new mongoose.Schema<MealPlan>({
	userId: { type: String, required: true },
	startDate: { type: Date, required: false },
	endDate: { type: Date, required: false },
	items: [
		{
			recipeId: { type: String, required: true },
			servings: { type: Number, required: true },
			dayOfWeek: { type: String, required: false },
			mealType: { type: String, required: false },
		},
	],
	// Frontend days format
	days: [
		{
			date: { type: Date, required: false },
			recipeId: { type: String, required: false },
			recipe: { type: mongoose.Schema.Types.Mixed, required: false },
			mealType: { type: String, required: false },
			status: { type: String, required: false },
			dayIndex: { type: Number, required: false },
		},
	],
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

export const MealPlanModel = mongoose.model<MealPlan>(
	'MealPlan',
	mealPlanSchema
);
