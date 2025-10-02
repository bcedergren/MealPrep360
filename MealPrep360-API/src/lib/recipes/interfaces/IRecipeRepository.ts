import { IRepository } from '../../core/interfaces/IRepository';
import { RecipeCreateDTO, RecipeFilterDTO } from '../types';
import { IRecipeDocument } from '../types/recipe';

export interface IRecipeRepository
	extends IRepository<IRecipeDocument, RecipeCreateDTO, RecipeFilterDTO> {
	findByUserId(userId: string): Promise<IRecipeDocument[]>;
	findPublicRecipes(
		filter: Partial<RecipeFilterDTO>
	): Promise<IRecipeDocument[]>;
	markAsSaved(
		recipeId: string,
		userId: string
	): Promise<IRecipeDocument | null>;
	unmarkAsSaved(
		recipeId: string,
		userId: string
	): Promise<IRecipeDocument | null>;
}
