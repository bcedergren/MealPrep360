import { BaseExternalService } from '../../core/services/BaseExternalService';
import { IMealPlanService } from '../interfaces/IMealPlanService';
import { IMealPlanDocument } from '../types/meal-plan';
import { MealPlanCreateDTO, MealPlanUpdateDTO } from '../types';
import {
	NotFoundError,
	UnauthorizedError,
} from '../../core/errors/ServiceError';

export class ExternalMealPlanService
	extends BaseExternalService
	implements IMealPlanService
{
	constructor() {
		super('mealplan-service');
	}

	async createMealPlan(
		data: MealPlanCreateDTO & { userId: string }
	): Promise<IMealPlanDocument> {
		return await this.resilientClient.post<IMealPlanDocument>(
			'/api/meal-plans',
			data
		);
	}

	async getMealPlan(id: string, userId: string): Promise<IMealPlanDocument> {
		const mealPlan = await this.resilientClient.get<IMealPlanDocument>(
			`/api/meal-plans/${id}`
		);

		if (mealPlan.userId !== userId) {
			throw new UnauthorizedError('Not authorized to access this meal plan');
		}

		return mealPlan;
	}

	async updateMealPlan(
		id: string,
		userId: string,
		data: MealPlanUpdateDTO
	): Promise<IMealPlanDocument> {
		await this.validateOwnership(id, userId);
		return await this.resilientClient.put<IMealPlanDocument>(
			`/api/meal-plans/${id}`,
			data
		);
	}

	async deleteMealPlan(id: string, userId: string): Promise<boolean> {
		await this.validateOwnership(id, userId);
		await this.resilientClient.delete(`/api/meal-plans/${id}`);
		return true;
	}

	async getActiveMealPlan(userId: string): Promise<IMealPlanDocument | null> {
		return await this.resilientClient.get<IMealPlanDocument | null>(
			`/api/meal-plans/active?userId=${userId}`
		);
	}

	async getMealPlansByDateRange(
		userId: string,
		startDate: Date,
		endDate: Date
	): Promise<IMealPlanDocument[]> {
		return await this.resilientClient.get<IMealPlanDocument[]>(
			`/api/meal-plans?userId=${userId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
		);
	}

	async skipDay(
		planId: string,
		userId: string,
		date: Date,
		notes?: string
	): Promise<IMealPlanDocument> {
		await this.validateOwnership(planId, userId);
		return await this.resilientClient.post<IMealPlanDocument>(
			`/api/meal-plans/${planId}/days/${date.toISOString()}/skip`,
			{ notes }
		);
	}

	async unskipDay(
		planId: string,
		userId: string,
		date: Date
	): Promise<IMealPlanDocument> {
		await this.validateOwnership(planId, userId);
		return await this.resilientClient.post<IMealPlanDocument>(
			`/api/meal-plans/${planId}/days/${date.toISOString()}/unskip`
		);
	}

	async updateDayMeals(
		planId: string,
		userId: string,
		date: Date,
		meals: IMealPlanDocument['days'][0]['meals']
	): Promise<IMealPlanDocument> {
		await this.validateOwnership(planId, userId);
		return await this.resilientClient.put<IMealPlanDocument>(
			`/api/meal-plans/${planId}/days/${date.toISOString()}/meals`,
			{ meals }
		);
	}

	async optimizeMealPlan(
		planId: string,
		userId: string,
		options?: {
			minimizeWaste?: boolean;
			balanceNutrition?: boolean;
			reduceCost?: boolean;
		}
	): Promise<IMealPlanDocument> {
		await this.validateOwnership(planId, userId);
		return await this.resilientClient.post<IMealPlanDocument>(
			`/api/meal-plans/${planId}/optimize`,
			options
		);
	}

	private async validateOwnership(
		planId: string,
		userId: string
	): Promise<void> {
		const mealPlan = await this.getMealPlan(planId, userId);
		if (!mealPlan) {
			throw new NotFoundError(`Meal plan ${planId} not found`);
		}
		if (mealPlan.userId !== userId) {
			throw new UnauthorizedError('Not authorized to access this meal plan');
		}
	}
}
