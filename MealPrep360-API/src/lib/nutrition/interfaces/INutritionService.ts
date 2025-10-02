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

export interface INutritionService {
	// Nutritional Analysis
	analyzeIngredients(request: NutritionAnalysisRequest): Promise<NutritionInfo>;
	analyzeRecipe(recipeId: string): Promise<NutritionInfo>;
	analyzeMealPlan(
		mealPlanId: string,
		date: Date
	): Promise<{
		total: NutritionInfo;
		meals: { [key: string]: NutritionInfo };
	}>;

	// Nutritional Goals
	setNutritionalGoals(
		userId: string,
		goals: NutritionalGoals
	): Promise<INutritionGoalsDocument>;
	getNutritionalGoals(userId: string): Promise<INutritionGoalsDocument | null>;
	updateNutritionalGoals(
		userId: string,
		goals: Partial<NutritionalGoals>
	): Promise<INutritionGoalsDocument>;

	// Nutrition Logging
	logMeal(
		userId: string,
		log: Omit<MealNutritionLog, 'userId'>
	): Promise<INutritionLogDocument>;
	updateMealLog(
		logId: string,
		userId: string,
		updates: Partial<MealNutritionLog>
	): Promise<INutritionLogDocument>;
	deleteMealLog(logId: string, userId: string): Promise<boolean>;
	getMealLogs(filter: NutritionFilterDTO): Promise<INutritionLogDocument[]>;

	// Analysis and Recommendations
	getDailySummary(userId: string, date: Date): Promise<NutritionSummary>;
	getWeeklySummary(
		userId: string,
		startDate: Date
	): Promise<NutritionSummary[]>;
	getMonthlySummary(
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
	}>;
	getRecommendations(userId: string): Promise<NutritionRecommendation[]>;

	// Meal Planning Integration
	suggestMealPlanAdjustments(
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
	}>;

	// Recipe Recommendations
	findNutritionallyBalancedRecipes(
		userId: string,
		targetNutrition: Partial<NutritionInfo>
	): Promise<
		Array<{
			recipeId: string;
			recipeName: string;
			nutrition: NutritionInfo;
			matchScore: number;
		}>
	>;
}
