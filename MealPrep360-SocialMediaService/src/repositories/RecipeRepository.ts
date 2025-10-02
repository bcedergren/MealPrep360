import { IRecipeRepository } from '../interfaces/repositories';
import { BaseRepository } from './BaseRepository';
import { IRecipe } from '../models/Recipe';

export class RecipeRepository
	extends BaseRepository<IRecipe>
	implements IRecipeRepository
{
	async findByTags(tags: string[]): Promise<IRecipe[]> {
		return this.model.find({ tags: { $in: tags } });
	}

	async incrementForks(recipeId: string): Promise<IRecipe | null> {
		return this.model.findByIdAndUpdate(
			recipeId,
			{ $inc: { forks: 1 } },
			{ new: true }
		);
	}

	async addCollaborator(
		recipeId: string,
		userId: string,
		role: string
	): Promise<IRecipe | null> {
		return this.model.findByIdAndUpdate(
			recipeId,
			{
				$push: {
					collaborators: { userId, role },
				},
			},
			{ new: true }
		);
	}
}
