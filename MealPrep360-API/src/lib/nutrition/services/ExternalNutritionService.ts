import { BaseExternalService } from '../../core/services/BaseExternalService';
import { INutritionService } from '../interfaces/INutritionService';
import {
	NutritionAnalysisRequest,
	NutritionInfo,
	NutritionalGoals,
	NutritionRecommendation,
	NutritionSummary,
	MealNutritionLog,
	NutritionFilterDTO,
} from '../types';
import {
	INutritionLogDocument,
	INutritionGoalsDocument,
} from '../types/nutrition-log';
import { NotFoundError } from '../../core/errors/ServiceError';

export class ExternalNutritionService
	extends BaseExternalService
	implements INutritionService
{
	constructor() {
		super('nutrition');
	}

	async analyzeIngredients(
		request: NutritionAnalysisRequest
	): Promise<NutritionInfo> {
		return await this.resilientClient.post<NutritionInfo>(
			'/analyze/ingredients',
			request
		);
	}

	async analyzeRecipe(recipeId: string): Promise<NutritionInfo> {
		return await this.resilientClient.get<NutritionInfo>(
			`/analyze/recipe/${recipeId}`
		);
	}

	async analyzeMealPlan(
		mealPlanId: string,
		date: Date
	): Promise<{
		total: NutritionInfo;
		meals: { [key: string]: NutritionInfo };
	}> {
		return await this.resilientClient.get<{
			total: NutritionInfo;
			meals: { [key: string]: NutritionInfo };
		}>(`/analyze/meal-plan/${mealPlanId}?date=${date.toISOString()}`);
	}

	async setNutritionalGoals(
		userId: string,
		goals: NutritionalGoals
	): Promise<INutritionGoalsDocument> {
		return await this.resilientClient.post<INutritionGoalsDocument>(
			`/users/${userId}/goals`,
			goals
		);
	}

	async getNutritionalGoals(
		userId: string
	): Promise<INutritionGoalsDocument | null> {
		return await this.resilientClient.get<INutritionGoalsDocument | null>(
			`/users/${userId}/goals`
		);
	}

	async updateNutritionalGoals(
		userId: string,
		goals: Partial<NutritionalGoals>
	): Promise<INutritionGoalsDocument> {
		return await this.resilientClient.put<INutritionGoalsDocument>(
			`/users/${userId}/goals`,
			goals
		);
	}

	async logMeal(
		userId: string,
		log: Omit<MealNutritionLog, 'userId'>
	): Promise<INutritionLogDocument> {
		return await this.resilientClient.post<INutritionLogDocument>(
			`/users/${userId}/logs`,
			log
		);
	}

	async updateMealLog(
		logId: string,
		userId: string,
		updates: Partial<MealNutritionLog>
	): Promise<INutritionLogDocument> {
		const response =
			await this.resilientClient.put<INutritionLogDocument | null>(
				`/users/${userId}/logs/${logId}`,
				updates
			);
		if (!response) {
			throw new NotFoundError(`Meal log ${logId} not found`);
		}
		return response;
	}

	async deleteMealLog(logId: string, userId: string): Promise<boolean> {
		await this.resilientClient.delete(`/users/${userId}/logs/${logId}`);
		return true;
	}

	async getMealLogs(
		filter: NutritionFilterDTO
	): Promise<INutritionLogDocument[]> {
		const queryParams = new URLSearchParams();
		if (filter.startDate) {
			queryParams.set('startDate', filter.startDate.toISOString());
		}
		if (filter.endDate) {
			queryParams.set('endDate', filter.endDate.toISOString());
		}
		if (filter.mealType) {
			queryParams.set('mealType', filter.mealType);
		}
		if (filter.includeRecipes !== undefined) {
			queryParams.set('includeRecipes', filter.includeRecipes.toString());
		}

		return await this.resilientClient.get<INutritionLogDocument[]>(
			`/users/${filter.userId}/logs?${queryParams.toString()}`
		);
	}

	async getDailySummary(userId: string, date: Date): Promise<NutritionSummary> {
		return await this.resilientClient.get<NutritionSummary>(
			`/users/${userId}/summary/daily?date=${date.toISOString()}`
		);
	}

	async getWeeklySummary(
		userId: string,
		startDate: Date
	): Promise<NutritionSummary[]> {
		return await this.resilientClient.get<NutritionSummary[]>(
			`/users/${userId}/summary/weekly?startDate=${startDate.toISOString()}`
		);
	}

	async getMonthlySummary(
		userId: string,
		year: number,
		month: number
	): Promise<{
		summary: NutritionSummary;
		trends: {
			calories: number[];
			macros: {
				protein: number[];
				carbohydrates: number[];
				fat: number[];
			};
		};
	}> {
		return await this.resilientClient.get<{
			summary: NutritionSummary;
			trends: {
				calories: number[];
				macros: {
					protein: number[];
					carbohydrates: number[];
					fat: number[];
				};
			};
		}>(`/users/${userId}/summary/monthly?year=${year}&month=${month}`);
	}

	async getRecommendations(userId: string): Promise<NutritionRecommendation[]> {
		return await this.resilientClient.get<NutritionRecommendation[]>(
			`/users/${userId}/recommendations`
		);
	}

	async suggestMealPlanAdjustments(
		mealPlanId: string,
		userId: string
	): Promise<{
		currentNutrition: NutritionInfo;
		recommendations: NutritionRecommendation[];
		suggestedSwaps: Array<{
			currentRecipeId: string;
			suggestedRecipeId: string;
			nutritionalImpact: Partial<NutritionInfo>;
		}>;
	}> {
		return await this.resilientClient.get<{
			currentNutrition: NutritionInfo;
			recommendations: NutritionRecommendation[];
			suggestedSwaps: Array<{
				currentRecipeId: string;
				suggestedRecipeId: string;
				nutritionalImpact: Partial<NutritionInfo>;
			}>;
		}>(`/meal-plans/${mealPlanId}/suggestions?userId=${userId}`);
	}

	async findNutritionallyBalancedRecipes(
		userId: string,
		targetNutrition: Partial<NutritionInfo>
	): Promise<
		Array<{
			recipeId: string;
			recipeName: string;
			nutrition: NutritionInfo;
			matchScore: number;
		}>
	> {
		return await this.resilientClient.post<Array<{
			recipeId: string;
			recipeName: string;
			nutrition: NutritionInfo;
			matchScore: number;
		}>>(`/recipes/search/nutrition?userId=${userId}`, { targetNutrition });
	}
}
