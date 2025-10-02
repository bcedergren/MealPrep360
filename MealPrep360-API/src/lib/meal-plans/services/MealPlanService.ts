import { BaseService } from '../../core/services/BaseService';
import { IMealPlanRepository } from '../interfaces/IMealPlanRepository';
import { MealPlanCreateDTO, MealPlanFilterDTO, MealPlanDay } from '../types';
import { IMealPlanDocument } from '../types/meal-plan';
import { RecipeService } from '../../recipes/services/RecipeService';
import { IRecipeDocument } from '../../recipes/types/recipe';

export class MealPlanService extends BaseService<
	IMealPlanDocument,
	MealPlanCreateDTO,
	MealPlanFilterDTO
> {
	constructor(
		private readonly mealPlanRepository: IMealPlanRepository,
		private readonly recipeService: RecipeService
	) {
		super(mealPlanRepository);
	}

	async createMealPlan(data: MealPlanCreateDTO): Promise<IMealPlanDocument> {
		// Check for overlapping meal plans
		const overlappingPlans = await this.mealPlanRepository.findOverlappingPlans(
			data.userId,
			new Date(data.startDate),
			new Date(data.endDate)
		);

		if (overlappingPlans.length > 0) {
			throw new Error('A meal plan already exists for this date range');
		}

		// Validate recipes exist
		const recipeIds = new Set<string>(
			data.days.flatMap((day: MealPlanDay) =>
				day.meals.map((meal) => {
					const recipeDoc = meal.recipe as IRecipeDocument & {
						_id: { toString(): string };
					};
					return recipeDoc._id.toString();
				})
			)
		);

		for (const recipeId of recipeIds) {
			const recipe = await this.recipeService.findById(recipeId);
			if (!recipe) {
				throw new Error(`Recipe with ID ${recipeId} not found`);
			}
		}

		return await this.mealPlanRepository.create(data);
	}

	async findByDateRange(
		userId: string,
		startDate: Date,
		endDate: Date
	): Promise<IMealPlanDocument[]> {
		return await this.mealPlanRepository.findByDateRange(
			userId,
			startDate,
			endDate
		);
	}

	async findActiveByUserId(userId: string): Promise<IMealPlanDocument | null> {
		return await this.mealPlanRepository.findActiveByUserId(userId);
	}

	async skipDay(
		mealPlanId: string,
		date: Date
	): Promise<IMealPlanDocument | null> {
		return await this.mealPlanRepository.skipDay(mealPlanId, date);
	}

	async unskipDay(
		mealPlanId: string,
		date: Date
	): Promise<IMealPlanDocument | null> {
		return await this.mealPlanRepository.unskipDay(mealPlanId, date);
	}

	async updateDayMeals(
		mealPlanId: string,
		date: Date,
		meals: IMealPlanDocument['days'][0]['meals']
	): Promise<IMealPlanDocument | null> {
		// Validate recipes exist
		const recipeIds = meals.map((meal) => {
			const recipeDoc = meal.recipe as IRecipeDocument & {
				_id: { toString(): string };
			};
			return recipeDoc._id.toString();
		});
		for (const recipeId of recipeIds) {
			const recipe = await this.recipeService.findById(recipeId);
			if (!recipe) {
				throw new Error(`Recipe with ID ${recipeId} not found`);
			}
		}

		return await this.mealPlanRepository.updateDayMeals(
			mealPlanId,
			date,
			meals
		);
	}

	async optimizeMealPlan(
		mealPlanId: string
	): Promise<IMealPlanDocument | null> {
		const mealPlan = await this.findById(mealPlanId);
		if (!mealPlan) {
			throw new Error('Meal plan not found');
		}

		// Here you would implement meal plan optimization logic
		// For example:
		// - Group similar ingredients across days
		// - Balance nutrition
		// - Minimize prep time
		// - Reuse leftovers

		return mealPlan;
	}
}
