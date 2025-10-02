import { IMealPlanDocument } from '../types/meal-plan';
import {
	MealPlanCreateDTO,
	MealPlanUpdateDTO,
	MealPlanFilterDTO,
} from '../types';

export interface IMealPlanService {
	createMealPlan(
		data: MealPlanCreateDTO & { userId: string }
	): Promise<IMealPlanDocument>;
	getMealPlan(id: string, userId: string): Promise<IMealPlanDocument>;
	updateMealPlan(
		id: string,
		userId: string,
		data: MealPlanUpdateDTO
	): Promise<IMealPlanDocument>;
	deleteMealPlan(id: string, userId: string): Promise<boolean>;
	getActiveMealPlan(userId: string): Promise<IMealPlanDocument | null>;
	getMealPlansByDateRange(
		userId: string,
		startDate: Date,
		endDate: Date
	): Promise<IMealPlanDocument[]>;
	skipDay(
		planId: string,
		userId: string,
		date: Date,
		notes?: string
	): Promise<IMealPlanDocument>;
	unskipDay(
		planId: string,
		userId: string,
		date: Date
	): Promise<IMealPlanDocument>;
	updateDayMeals(
		planId: string,
		userId: string,
		date: Date,
		meals: IMealPlanDocument['days'][0]['meals']
	): Promise<IMealPlanDocument>;
	optimizeMealPlan(
		planId: string,
		userId: string,
		options?: {
			minimizeWaste?: boolean;
			balanceNutrition?: boolean;
			reduceCost?: boolean;
		}
	): Promise<IMealPlanDocument>;
}
