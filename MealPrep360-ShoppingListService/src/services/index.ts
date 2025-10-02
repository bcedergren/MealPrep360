import { Container } from '../di/container';
import { ShoppingListGenerator } from './shoppingListGenerator';
import {
	Recipe,
	MealPlanItem,
	NormalizedIngredient,
} from '../types/ingredients';

// Initialize the dependency injection container
const container = Container.getInstance();

// Create the shopping list generator with its dependencies
const shoppingListGenerator = new ShoppingListGenerator(
	container.getIngredientParser(),
	container.getUnitConverter(),
	container.getNameNormalizer(),
	container.getCategoryManager(),
	container.getQuantityCalculator()
);

// Export the main function
export async function generateShoppingList(
	recipes: Recipe[],
	mealPlan: MealPlanItem[],
	pantryExclusions: string[] = []
): Promise<NormalizedIngredient[]> {
	return shoppingListGenerator.generateShoppingList(
		recipes,
		mealPlan,
		pantryExclusions
	);
}

// Export types and interfaces
export * from '../types/ingredients';
export * from '../types/units';
export * from '../types/categories';

// Export service interfaces
export { IIngredientParser } from './ingredientParser';
export { IUnitConverter } from './unitConverter';
export { INameNormalizer } from './nameNormalizer';
export { ICategoryManager } from './categoryManager';
export { IQuantityCalculator } from './quantityCalculator';
export { IShoppingListGenerator } from './shoppingListGenerator';
