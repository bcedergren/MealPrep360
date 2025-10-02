import { IMealPlanService } from '../interfaces/IMealPlanService';
import { ExternalMealPlanService } from '../services/ExternalMealPlanService';

export class MealPlanServiceFactory {
	private static instance: MealPlanServiceFactory;
	private mealPlanService: IMealPlanService | null = null;

	private constructor() {}

	static getInstance(): MealPlanServiceFactory {
		if (!MealPlanServiceFactory.instance) {
			MealPlanServiceFactory.instance = new MealPlanServiceFactory();
		}
		return MealPlanServiceFactory.instance;
	}

	getMealPlanService(): IMealPlanService {
		if (!this.mealPlanService) {
			this.mealPlanService = new ExternalMealPlanService();
		}
		return this.mealPlanService;
	}

	// For testing purposes
	setMealPlanService(service: IMealPlanService): void {
		this.mealPlanService = service;
	}
}
