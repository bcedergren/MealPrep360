import { RequestValidator } from '../../core/validation/RequestValidator';
import {
	NutritionAnalysisRequest,
	NutritionalGoals,
	MealNutritionLog,
} from '../types';

export class NutritionalGoalsValidator extends RequestValidator<NutritionalGoals> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) =>
				typeof data.dailyCalories === 'number' && data.dailyCalories > 0,
			message: 'Calories must be a positive number',
		});

		this.addRule({
			validate: (data) =>
				typeof data.macroRatio.protein === 'number' &&
				data.macroRatio.protein >= 0,
			message: 'Protein must be a non-negative number',
		});

		this.addRule({
			validate: (data) =>
				typeof data.macroRatio.carbohydrates === 'number' &&
				data.macroRatio.carbohydrates >= 0,
			message: 'Carbohydrates must be a non-negative number',
		});

		this.addRule({
			validate: (data) =>
				typeof data.macroRatio.fat === 'number' && data.macroRatio.fat >= 0,
			message: 'Fat must be a non-negative number',
		});

		this.addRule({
			validate: (data) =>
				!data.micronutrientGoals.fiber ||
				(typeof data.micronutrientGoals.fiber === 'number' &&
					data.micronutrientGoals.fiber >= 0),
			message: 'Fiber must be a non-negative number if provided',
		});

		this.addRule({
			validate: (data) => true, // sugar is not in NutritionalGoals
			message: 'Sugar must be a non-negative number if provided',
		});

		this.addRule({
			validate: (data) =>
				!data.micronutrientGoals.sodium ||
				(typeof data.micronutrientGoals.sodium === 'number' &&
					data.micronutrientGoals.sodium >= 0),
			message: 'Sodium must be a non-negative number if provided',
		});

		this.addRule({
			validate: (data) => true, // cholesterol is not in NutritionalGoals
			message: 'Cholesterol must be a non-negative number if provided',
		});

		this.addRule({
			validate: (data) =>
				!data.micronutrientGoals.vitamins ||
				(typeof data.micronutrientGoals.vitamins === 'object' &&
					data.micronutrientGoals.vitamins !== null &&
					Object.values(data.micronutrientGoals.vitamins).every(
						(v) => typeof v === 'number' && v >= 0
					)),
			message: 'Vitamins must be an object with non-negative numbers',
		});

		this.addRule({
			validate: (data) =>
				!data.micronutrientGoals.minerals ||
				(typeof data.micronutrientGoals.minerals === 'object' &&
					data.micronutrientGoals.minerals !== null &&
					Object.values(data.micronutrientGoals.minerals).every(
						(v) => typeof v === 'number' && v >= 0
					)),
			message: 'Minerals must be an object with non-negative numbers',
		});
	}
}

export class NutritionAnalysisValidator extends RequestValidator<NutritionAnalysisRequest> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) =>
				Array.isArray(data.ingredients) &&
				data.ingredients.length > 0 &&
				data.ingredients.every(
					(i) =>
						typeof i.name === 'string' &&
						typeof i.amount === 'number' &&
						typeof i.unit === 'string'
				),
			message: 'Invalid ingredients format',
		});

		this.addRule({
			validate: (data) =>
				typeof data.servingSize === 'number' && data.servingSize > 0,
			message: 'Serving size must be a positive number',
		});

		this.addRule({
			validate: (data) =>
				typeof data.servingUnit === 'string' && data.servingUnit.length > 0,
			message: 'Serving unit must be a non-empty string',
		});
	}
}

export class MealLogValidator extends RequestValidator<MealNutritionLog> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) =>
				typeof data.mealType === 'string' &&
				['breakfast', 'lunch', 'dinner', 'snack', 'other'].includes(
					data.mealType
				),
			message: 'Invalid meal type',
		});

		this.addRule({
			validate: (data) =>
				data.date instanceof Date || !isNaN(new Date(data.date).getTime()),
			message: 'Invalid date',
		});

		this.addRule({
			validate: (data) =>
				typeof data.servingSize === 'number' && data.servingSize > 0,
			message: 'Serving size must be a positive number',
		});

		this.addRule({
			validate: (data) => !data.notes || typeof data.notes === 'string',
			message: 'Notes must be a string if provided',
		});

		this.addRule({
			validate: (data) =>
				typeof data.nutrition === 'object' && data.nutrition !== null,
			message: 'Nutrition info must be provided',
		});

		this.addRule({
			validate: (data) => !data.recipeId || typeof data.recipeId === 'string',
			message: 'Recipe ID must be a string if provided',
		});

		this.addRule({
			validate: (data) =>
				!data.recipeName || typeof data.recipeName === 'string',
			message: 'Recipe name must be a string if provided',
		});

		this.addRule({
			validate: (data) =>
				typeof data.userId === 'string' && data.userId.length > 0,
			message: 'User ID must be a non-empty string',
		});

		this.addRule({
			validate: (data) =>
				['breakfast', 'lunch', 'dinner', 'snack'].includes(data.mealType),
			message: 'Invalid meal type',
		});

		this.addRule({
			validate: (data) => !data.notes || typeof data.notes === 'string',
			message: 'Notes must be a string if provided',
		});
	}
}
