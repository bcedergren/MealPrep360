import { IRecipeSelector } from '../interfaces/IRecipeSelector';
import { Recipe } from '../models/Recipe';
import { PROTEIN_INGREDIENTS } from '../../constants/ingredients';

export class VarietyBasedRecipeSelector implements IRecipeSelector {
	selectRecipe(
		availableRecipes: Recipe[],
		previousRecipes: Recipe[] = []
	): Recipe | undefined {
		if (availableRecipes.length === 0) return undefined;

		// Filter out recipes that are too similar to recent ones
		const filteredRecipes = availableRecipes.filter((recipe) => {
			// Check if this recipe was used in the last 3 days
			const wasRecentlyUsed = previousRecipes.some(
				(prevRecipe) => prevRecipe.id === recipe.id
			);
			if (wasRecentlyUsed) return false;

			// Check if this recipe is too similar to recent ones (same main ingredient)
			const isTooSimilar = previousRecipes.some((prevRecipe) => {
				const prevMainIngredient = this.getMainIngredient(prevRecipe);
				const currentMainIngredient = this.getMainIngredient(recipe);
				return (
					prevMainIngredient &&
					currentMainIngredient &&
					prevMainIngredient === currentMainIngredient
				);
			});

			return !isTooSimilar;
		});

		// If no recipes pass the variety check, fall back to all recipes
		const recipesToUse =
			filteredRecipes.length > 0 ? filteredRecipes : availableRecipes;
		const randomIndex = Math.floor(Math.random() * recipesToUse.length);
		return recipesToUse[randomIndex];
	}

	getMainIngredient(recipe: Recipe): string | null {
		const matchingProtein = recipe.ingredients.find((ingredient) =>
			PROTEIN_INGREDIENTS.some((protein) =>
				ingredient.toLowerCase().includes(protein.toLowerCase())
			)
		);
		return matchingProtein ? matchingProtein.toLowerCase() : null;
	}
}
