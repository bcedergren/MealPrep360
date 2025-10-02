import { Recipe } from '../models/Recipe';
import { Recipe as RecipeType, Unit, Category } from '../types';

export class RecipeService {
	async getRecipe(recipeId: string): Promise<RecipeType> {
		try {
			const recipe = await Recipe.findOne({ id: recipeId });
			if (!recipe) {
				throw new Error(`Recipe not found: ${recipeId}`);
			}
			const recipeObj = recipe.toObject();
			return {
				_id: recipeObj._id.toString(),
				title: recipeObj.title,
				ingredients: recipeObj.ingredients.map((ing) => ({
					name: ing.name,
					amount: ing.amount,
					unit: ing.unit as Unit,
					category: ing.category as Category,
				})),
			};
		} catch (error) {
			throw new Error(
				`Failed to fetch recipe: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`
			);
		}
	}

	async getRecipes(recipeIds: string[]): Promise<RecipeType[]> {
		try {
			const recipes = await Recipe.find({ id: { $in: recipeIds } });
			if (recipes.length !== recipeIds.length) {
				const foundIds = recipes.map((r) => r.id);
				const missingIds = recipeIds.filter((id) => !foundIds.includes(id));
				throw new Error(`Recipes not found: ${missingIds.join(', ')}`);
			}
			return recipes.map((recipe) => {
				const recipeObj = recipe.toObject();
				return {
					_id: recipeObj._id.toString(),
					title: recipeObj.title,
					ingredients: recipeObj.ingredients.map((ing) => ({
						name: ing.name,
						amount: ing.amount,
						unit: ing.unit as Unit,
						category: ing.category as Category,
					})),
				};
			});
		} catch (error) {
			throw new Error(
				`Failed to fetch recipes: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`
			);
		}
	}

	async getRecipesByIds(recipeIds: string[]): Promise<RecipeType[]> {
		try {
			const recipes = await Recipe.find({ _id: { $in: recipeIds } });
			return recipes.map((recipe) => {
				const recipeObj = recipe.toObject();
				return {
					_id: recipeObj._id.toString(),
					title: recipeObj.title,
					ingredients: recipeObj.ingredients.map((ing) => ({
						name: ing.name,
						amount: ing.amount,
						unit: ing.unit as Unit,
						category: ing.category as Category,
					})),
				};
			});
		} catch (error) {
			console.error('Error fetching recipes:', error);
			throw new Error('Failed to fetch recipes');
		}
	}
}
