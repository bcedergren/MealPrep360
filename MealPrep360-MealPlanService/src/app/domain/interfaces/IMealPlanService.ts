import { MealPlan, MealPlanPreferences } from '../models/MealPlan';

export interface IMealPlanService {
	generateMealPlan(
		userId: string,
		preferences: MealPlanPreferences
	): Promise<MealPlan>;
	getMealPlan(id: string): Promise<MealPlan | null>;
	getMealPlansByDateRange(startDate: Date, endDate: Date): Promise<MealPlan[]>;
	deleteMealPlan(id: string): Promise<void>;
	updateMealPlanDay(
		mealPlanId: string,
		dayIndex: number,
		updates: {
			recipeId?: string | null;
			status?: 'planned' | 'completed' | 'skipped';
		}
	): Promise<MealPlan>;
	skipDate(userId: string, date: Date): Promise<MealPlan>;
	skipMealPlanDay(
		mealPlanId: string,
		dayIndex: number,
		userId: string
	): Promise<MealPlan>;
	completeMealPlanDay(mealPlanId: string, dayIndex: number): Promise<MealPlan>;
	unskipMealPlanDay(
		mealPlanId: string,
		dayIndex: number,
		userId: string
	): Promise<MealPlan>;
}
