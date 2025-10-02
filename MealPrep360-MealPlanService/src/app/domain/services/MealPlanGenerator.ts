import { IMealPlanGenerator } from '../interfaces/IMealPlanGenerator';
import { MealPlan, MealPlanPreferences, MealPlanDay } from '../models/MealPlan';
import { IRecipeSelector } from '../interfaces/IRecipeSelector';
import { IRecipeRepository } from '../interfaces/IRecipeRepository';
import { IDateService } from '../interfaces/IDateService';
import { Recipe } from '../models/Recipe';

export class DefaultMealPlanGenerator implements IMealPlanGenerator {
	constructor(
		private readonly recipeSelector: IRecipeSelector,
		private readonly recipeRepository: IRecipeRepository,
		private readonly dateService: IDateService
	) {}

	async generatePlan(
		userId: string,
		preferences: MealPlanPreferences
	): Promise<MealPlan> {
		const startDate = this.dateService.normalizeToStartOfDay(
			new Date(preferences.startDate)
		);
		const endDate = this.dateService.normalizeToEndOfDay(
			this.dateService.addDays(startDate, preferences.duration - 1)
		);

		// Get user's saved recipes only
		const recipes = await this.recipeRepository.getUserSavedRecipes(userId);

		// Log saved recipe IDs for visibility
		console.log(
			'Saved recipe IDs for user',
			userId,
			recipes.map((r) => r.id)
		);

		// If no saved recipes, surface a consistent error the API layer can map
		if (recipes.length === 0) {
			throw new Error('No saved recipes found');
		}

		const skippedDays = preferences.skippedDays || [];
		const days: MealPlanDay[] = Array.from(
			{ length: preferences.duration },
			(_, i) => ({
				recipeId: null,
				status: skippedDays[i] ? 'skipped' : 'planned',
			})
		);

		const selectedRecipes: Recipe[] = [];
		for (let i = 0; i < preferences.duration; i++) {
			if (skippedDays[i]) continue;

			const recipe = this.recipeSelector.selectRecipe(recipes, selectedRecipes);
			if (!recipe) {
				throw new Error('No suitable recipe found for meal plan');
			}

			selectedRecipes.push(recipe);
			const day: MealPlanDay = {
				recipeId: recipe.id,
				status: 'planned',
			};
			days[i] = day;
		}

		const mealPlan: MealPlan = {
			id: crypto.randomUUID(),
			userId,
			startDate: this.dateService.toISOString(startDate),
			endDate: this.dateService.toISOString(endDate),
			days,
			createdAt: this.dateService.toISOString(new Date()),
			updatedAt: this.dateService.toISOString(new Date()),
		};

		return mealPlan;
	}
}
