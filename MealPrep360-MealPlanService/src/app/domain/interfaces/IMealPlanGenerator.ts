import { MealPlan, MealPlanPreferences } from '../models/MealPlan';

export interface IMealPlanGenerator {
	generatePlan(
		userId: string,
		preferences: MealPlanPreferences
	): Promise<MealPlan>;
}
