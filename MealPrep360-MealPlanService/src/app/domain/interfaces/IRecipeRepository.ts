import { Recipe } from '../models/Recipe';

export interface IRecipeRepository {
	getAllRecipes(): Promise<Recipe[]>;
	getRecipesByTags(tags: string[]): Promise<Recipe[]>;
	getRecipeById(id: string): Promise<Recipe | null>;
	getUserSavedRecipes(userId: string): Promise<Recipe[]>;
	addRecipe(recipe: Omit<Recipe, 'id'>): Promise<string>;
	updateRecipe(id: string, recipe: Partial<Recipe>): Promise<void>;
	deleteRecipe(id: string): Promise<void>;
}
