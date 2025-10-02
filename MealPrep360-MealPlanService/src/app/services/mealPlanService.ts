import { IMealPlanService } from '../domain/interfaces/IMealPlanService';
import { MealPlan, MealPlanPreferences } from '../domain/models/MealPlan';
import { IMealPlanRepository } from '../domain/interfaces/IMealPlanRepository';
import { IMealPlanGenerator } from '../domain/interfaces/IMealPlanGenerator';
import { IDateService } from '../domain/interfaces/IDateService';

export class MealPlanService implements IMealPlanService {
	constructor(
		private readonly mealPlanRepository: IMealPlanRepository,
		private readonly mealPlanGenerator: IMealPlanGenerator,
		private readonly dateService: IDateService
	) {}

	async generateMealPlan(
		userId: string,
		preferences: MealPlanPreferences
	): Promise<MealPlan> {
		try {
			const mealPlan = await this.mealPlanGenerator.generatePlan(
				userId,
				preferences
			);
			return this.mealPlanRepository.saveMealPlan(mealPlan);
		} catch (error) {
			console.error('Error in generateMealPlan:', error);
			throw error;
		}
	}

	async getMealPlan(id: string): Promise<MealPlan | null> {
		return this.mealPlanRepository.getMealPlan(id);
	}

	async getMealPlansByDateRange(
		startDate: Date,
		endDate: Date
	): Promise<MealPlan[]> {
		return this.mealPlanRepository.getMealPlansByDateRange(startDate, endDate);
	}

	async deleteMealPlan(id: string): Promise<void> {
		await this.mealPlanRepository.deleteMealPlan(id);
	}

	async updateMealPlanDay(
		mealPlanId: string,
		dayIndex: number,
		updates: {
			recipeId?: string | null;
			status?: 'planned' | 'completed' | 'skipped';
		}
	): Promise<MealPlan> {
		const mealPlan = await this.mealPlanRepository.getMealPlan(mealPlanId);
		if (!mealPlan) {
			throw new Error('Meal plan not found');
		}

		if (dayIndex < 0 || dayIndex >= mealPlan.days.length) {
			throw new Error('Invalid day index');
		}

		const updatedDay = {
			...mealPlan.days[dayIndex],
			...updates,
		};

		if (updates.status === 'skipped') {
			updatedDay.recipeId = null;
		}

		mealPlan.days[dayIndex] = updatedDay;
		mealPlan.updatedAt = this.dateService.toISOString(new Date());

		return this.mealPlanRepository.saveMealPlan(mealPlan);
	}

	async skipDate(userId: string, date: Date): Promise<MealPlan> {
		const targetDate = this.dateService.normalizeToStartOfDay(date);
		const mealPlans = await this.mealPlanRepository.getMealPlansByDateRange(
			targetDate,
			targetDate
		);

		const mealPlan = mealPlans.find((plan) => plan.userId === userId);
		if (!mealPlan) {
			throw new Error('No meal plan found for the specified date');
		}

		const dayIndex = mealPlan.days.findIndex((_, index) => {
			const dayDate = this.dateService.addDays(
				new Date(mealPlan.startDate),
				index
			);
			return this.dateService.isSameDay(dayDate, targetDate);
		});

		if (dayIndex === -1) {
			throw new Error('Date not found in meal plan');
		}

		return this.updateMealPlanDay(mealPlan.id, dayIndex, {
			recipeId: null,
			status: 'skipped',
		});
	}

	async skipMealPlanDay(
		mealPlanId: string,
		dayIndex: number,
		userId: string
	): Promise<MealPlan> {
		return this.updateMealPlanDay(mealPlanId, dayIndex, {
			recipeId: null,
			status: 'skipped',
		});
	}

	async completeMealPlanDay(
		mealPlanId: string,
		dayIndex: number
	): Promise<MealPlan> {
		return this.updateMealPlanDay(mealPlanId, dayIndex, {
			status: 'completed',
		});
	}

	async unskipMealPlanDay(
		mealPlanId: string,
		dayIndex: number,
		userId: string
	): Promise<MealPlan> {
		const mealPlan = await this.mealPlanRepository.getMealPlan(mealPlanId);
		if (!mealPlan) {
			throw new Error('Meal plan not found');
		}

		// Generate a new meal plan for a single day to get a recipe
		const singleDayPlan = await this.mealPlanGenerator.generatePlan(userId, {
			startDate: mealPlan.startDate,
			duration: 1,
			skippedDays: [],
		});

		return this.updateMealPlanDay(mealPlanId, dayIndex, {
			recipeId: singleDayPlan.days[0].recipeId,
			status: 'planned',
		});
	}
}
