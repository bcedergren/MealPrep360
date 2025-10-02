import { MealPlan } from '../models/MealPlan';

export interface IMealPlanRepository {
	saveMealPlan(mealPlan: MealPlan): Promise<MealPlan>;
	getMealPlan(id: string): Promise<MealPlan | null>;
	getMealPlansByDateRange(startDate: Date, endDate: Date): Promise<MealPlan[]>;
	deleteMealPlan(id: string): Promise<void>;
}
