import { MealPlanModel } from '../models/MealPlan';
import { MealPlan } from '../types';

export class MealPlanService {
	async getMealPlan(
		mealPlanId: string,
		userId: string
	): Promise<MealPlan | null> {
		try {
			const mealPlan = await MealPlanModel.findOne({ _id: mealPlanId, userId });
			if (!mealPlan) {
				return null;
			}
			return mealPlan.toObject();
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Failed to fetch meal plan: ${error.message}`);
			}
			throw new Error('Failed to fetch meal plan: Unknown error');
		}
	}
}
