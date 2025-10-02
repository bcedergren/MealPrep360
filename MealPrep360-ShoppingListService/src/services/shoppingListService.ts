import { Container } from '../di/container';
import { Recipe, MealPlanItem, NormalizedIngredient } from '../types/ingredients';

// Initialize the dependency injection container
const container = Container.getInstance();

// Create the shopping list generator with its dependencies
const shoppingListGenerator = container.getShoppingListGenerator();

export async function generateShoppingList(
  recipes: Recipe[],
  mealPlan: MealPlanItem[],
  pantryExclusions: string[] = []
): Promise<NormalizedIngredient[]> {
  return shoppingListGenerator.generateShoppingList(recipes, mealPlan, pantryExclusions);
}