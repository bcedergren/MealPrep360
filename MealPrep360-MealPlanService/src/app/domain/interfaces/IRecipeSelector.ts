import { Recipe } from '../models/Recipe';

export interface IRecipeSelector {
	selectRecipe(
		availableRecipes: Recipe[],
		previousRecipes: Recipe[]
	): Recipe | undefined;
	getMainIngredient(recipe: Recipe): string | null;
}
