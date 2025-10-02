import { IRecipe } from '../../models/recipe';

export interface RecipeGenerationParams {
  season?: string;
  dietary?: string[];
  excludeIngredients?: string[];
  preferredCuisine?: string[];
  servingSize?: number;
}

export interface IRecipeService {
  generateRecipe(params: RecipeGenerationParams): Promise<IRecipe>;
  validateRecipe(recipe: IRecipe): Promise<boolean>;
  saveRecipe(recipe: IRecipe): Promise<IRecipe>;
  getRecipe(id: string): Promise<IRecipe | null>;
  listRecipes(filter: Partial<IRecipe>): Promise<IRecipe[]>;
  updateRecipe(id: string, updates: Partial<IRecipe>): Promise<IRecipe>;
  deleteRecipe(id: string): Promise<boolean>;
  generateRecipeEmbedding(recipe: IRecipe): Promise<number[]>;
  findSimilarRecipes(recipeId: string, limit?: number): Promise<IRecipe[]>;
}