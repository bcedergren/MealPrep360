import { Recipe } from '../types/recipe';
import { getMongoClient } from '../lib/mongodb.js';
import { ObjectId } from 'mongodb';

export class RecipeRepository {
	private recipesCollectionName = 'recipes';
	private userRecipesCollectionName = 'userrecipes';

	async saveRecipe(recipe: Recipe): Promise<Recipe> {
		const client = await getMongoClient();
		const collection = client.db().collection(this.userRecipesCollectionName);

		await collection.updateOne(
			{ _id: new ObjectId(recipe.id) },
			{ $set: recipe },
			{ upsert: true }
		);

		return recipe;
	}

	async getRecipe(id: string): Promise<Recipe | null> {
		const client = await getMongoClient();
		const collection = client.db().collection(this.recipesCollectionName);

		const recipe = await collection.findOne({ _id: new ObjectId(id) });
		if (!recipe) return null;

		const { _id, ...recipeData } = recipe;
		return {
			...recipeData,
			id: _id.toString(),
		} as Recipe;
	}

	async getAllRecipes(): Promise<Recipe[]> {
		const client = await getMongoClient();
		const collection = client.db().collection(this.recipesCollectionName);

		const recipes = await collection.find({}).toArray();
		return recipes.map((recipe) => {
			const { _id, ...recipeData } = recipe;
			return {
				...recipeData,
				id: _id.toString(),
			} as Recipe;
		});
	}

	async getUserRecipes(userId: string): Promise<Recipe[]> {
		const client = await getMongoClient();
		const collection = client.db().collection(this.userRecipesCollectionName);

		const recipes = await collection.find({ userId }).toArray();
		return recipes.map((recipe) => {
			const { _id, ...recipeData } = recipe;
			return {
				...recipeData,
				id: _id.toString(),
			} as Recipe;
		});
	}

	async deleteRecipe(id: string): Promise<void> {
		const client = await getMongoClient();
		const collection = client.db().collection(this.userRecipesCollectionName);

		await collection.deleteOne({ _id: new ObjectId(id) });
	}
}
