import { BaseMongoRepository } from '../../core/repositories/BaseMongoRepository';
import { IRecipeRepository } from '../interfaces/IRecipeRepository';
import { RecipeCreateDTO, RecipeFilterDTO } from '../types';
import { IRecipeDocument } from '../types/recipe';
import { Model } from 'mongoose';

export class MongoRecipeRepository
	extends BaseMongoRepository<IRecipeDocument, RecipeCreateDTO, RecipeFilterDTO>
	implements IRecipeRepository
{
	constructor(model: Model<IRecipeDocument>) {
		super(model);
	}

	async findByUserId(userId: string): Promise<IRecipeDocument[]> {
		return await this.model.find({ userId });
	}

	async findPublicRecipes(
		filter: Partial<RecipeFilterDTO>
	): Promise<IRecipeDocument[]> {
		return await this.model.find({ ...filter, isPublic: true });
	}

	async markAsSaved(
		recipeId: string,
		userId: string
	): Promise<IRecipeDocument | null> {
		return await this.model.findByIdAndUpdate(
			recipeId,
			{ $addToSet: { savedBy: userId } },
			{ new: true }
		);
	}

	async unmarkAsSaved(
		recipeId: string,
		userId: string
	): Promise<IRecipeDocument | null> {
		return await this.model.findByIdAndUpdate(
			recipeId,
			{ $pull: { savedBy: userId } },
			{ new: true }
		);
	}
}
