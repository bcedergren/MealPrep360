import { BaseService } from '../../core/services/BaseService';
import { IRecipeRepository } from '../interfaces/IRecipeRepository';
import { RecipeCreateDTO, RecipeFilterDTO } from '../types';
import { IRecipeDocument } from '../types/recipe';

export class RecipeService extends BaseService<
	IRecipeDocument,
	RecipeCreateDTO,
	RecipeFilterDTO
> {
	constructor(private readonly recipeRepository: IRecipeRepository) {
		super(recipeRepository);
	}

	async findByUserId(userId: string): Promise<IRecipeDocument[]> {
		return await this.recipeRepository.findByUserId(userId);
	}

	async findPublicRecipes(
		filter: Partial<RecipeFilterDTO>
	): Promise<IRecipeDocument[]> {
		return await this.recipeRepository.findPublicRecipes(filter);
	}

	async saveRecipe(
		recipeId: string,
		userId: string
	): Promise<IRecipeDocument | null> {
		return await this.recipeRepository.markAsSaved(recipeId, userId);
	}

	async unsaveRecipe(
		recipeId: string,
		userId: string
	): Promise<IRecipeDocument | null> {
		return await this.recipeRepository.unmarkAsSaved(recipeId, userId);
	}

	async createRecipe(data: RecipeCreateDTO): Promise<IRecipeDocument> {
		// Add any business logic/validation here
		return await this.recipeRepository.create(data);
	}

	async searchRecipes(
		filter: Partial<RecipeFilterDTO>
	): Promise<IRecipeDocument[]> {
		// Add search logic with proper filtering
		return await this.recipeRepository.find(filter);
	}
}
