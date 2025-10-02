import { Collection } from 'mongodb';
import { getMongoClient } from '../lib/mongodb';
import { ObjectId } from 'mongodb';

interface SavedRecipe {
	_id: ObjectId;
	userId: string | ObjectId;
	savedRecipes: Array<{
		_id: ObjectId;
		recipeId: string;
		savedAt: Date;
	}>;
	createdAt: Date;
	updatedAt: Date;
	__v: number;
}

export interface Recipe {
	_id: ObjectId;
	userId: string;
	title: string;
	description: string;
	ingredients: string[];
	prepInstructions: string[];
	prepTime: number;
	cookTime: number;
	servings: number;
	tags: string[];
	storageTime: number;
	containerSuggestions: string[];
	defrostInstructions: string[];
	cookingInstructions: string[];
	servingInstructions: string[];
	season: string;
	createdAt: Date;
	updatedAt: Date;
	embedding: number[];
	images: Record<string, any>;
	__v: number;
	isPublic: boolean;
	allergenInfo: string[];
	dietaryInfo: string[];
	hasImage: boolean;
	isPlaceholder: boolean;
}

export interface IRecipeService {
	getAllRecipes(): Promise<Recipe[]>;
	getRecipesByTags(tags: string[]): Promise<Recipe[]>;
	getRecipeById(id: string): Promise<Recipe | null>;
	getUserSavedRecipes(userId: string): Promise<Recipe[]>;
	addRecipe(recipe: Omit<Recipe, '_id'>): Promise<string>;
	updateRecipe(id: string, recipe: Partial<Recipe>): Promise<void>;
	deleteRecipe(id: string): Promise<void>;
	getRecipe(id: string): Promise<Recipe | null>;
}

export class RecipeService implements IRecipeService {
	private recipesCollection: Collection<Recipe>;
	private userRecipesCollection: Collection<SavedRecipe>;

	constructor() {
		// Initialize collections in constructor but don't connect yet
		this.recipesCollection = null as any;
		this.userRecipesCollection = null as any;
	}

	private async getCollections(): Promise<{
		recipes: Collection<Recipe>;
		userRecipes: Collection<SavedRecipe>;
	}> {
		if (!this.recipesCollection || !this.userRecipesCollection) {
			const client = await getMongoClient();
			const db = client.db();

			// List all collections to verify
			const collections = await db.listCollections().toArray();

			this.recipesCollection = db.collection<Recipe>('recipes');
			this.userRecipesCollection = db.collection<SavedRecipe>('userrecipes');

			// Verify collections exist
			const userRecipesCount =
				await this.userRecipesCollection.countDocuments();
		}
		return {
			recipes: this.recipesCollection,
			userRecipes: this.userRecipesCollection,
		};
	}

	async getAllRecipes(): Promise<Recipe[]> {
		const { recipes } = await this.getCollections();
		return recipes.find().toArray();
	}

	async getRecipe(id: string): Promise<Recipe | null> {
		const { recipes } = await this.getCollections();
		return recipes.findOne({ _id: new ObjectId(id) });
	}

	async getRecipeById(id: string): Promise<Recipe | null> {
		return this.getRecipe(id);
	}

	async getRecipesByTags(tags: string[]): Promise<Recipe[]> {
		const { recipes } = await this.getCollections();
		return recipes.find({ tags: { $in: tags } }).toArray();
	}

	async getUserSavedRecipes(userId: string): Promise<Recipe[]> {
		const collections = await this.getCollections();
		console.log('Getting saved recipes for userId:', userId);

		// Check if userId is a valid ObjectId before converting
		let userObjectId;
		try {
			userObjectId = new ObjectId(userId);
			console.log('Valid ObjectId, using ObjectId query for userId:', userId);
		} catch (error) {
			console.log('Invalid ObjectId for userId:', userId, 'Treating as string');
			// If userId is not a valid ObjectId, try to find by string
			const userDoc = await collections.userRecipes.findOne({
				userId: userId,
			});

			if (
				!userDoc ||
				!userDoc.savedRecipes ||
				userDoc.savedRecipes.length === 0
			) {
				console.log('No saved recipes found for user (string userId):', userId);
				return [];
			}

			console.log(
				'Found user document with',
				userDoc.savedRecipes.length,
				'saved recipes'
			);
			// Get the recipe IDs from the savedRecipes array
			const recipeIds = userDoc.savedRecipes.map((sr) => sr.recipeId);
			console.log('Recipe IDs found:', recipeIds);

			// Fetch the actual recipes using _id field
			const recipes = await collections.recipes
				.find({
					_id: { $in: recipeIds.map((id) => new ObjectId(id)) },
				})
				.toArray();

			console.log(
				'Retrieved',
				recipes.length,
				'recipes from recipes collection'
			);
			return recipes;
		}

		// If userId is a valid ObjectId, proceed with ObjectId query
		const userDoc = await collections.userRecipes.findOne({
			userId: userObjectId,
		});

		if (
			!userDoc ||
			!userDoc.savedRecipes ||
			userDoc.savedRecipes.length === 0
		) {
			console.log('No saved recipes found for user (ObjectId userId):', userId);
			return [];
		}

		console.log(
			'Found user document with',
			userDoc.savedRecipes.length,
			'saved recipes'
		);
		// Get the recipe IDs from the savedRecipes array
		const recipeIds = userDoc.savedRecipes.map((sr) => sr.recipeId);
		console.log('Recipe IDs found:', recipeIds);

		// Fetch the actual recipes using _id field
		const recipes = await collections.recipes
			.find({
				_id: { $in: recipeIds.map((id) => new ObjectId(id)) },
			})
			.toArray();

		console.log('Retrieved', recipes.length, 'recipes from recipes collection');
		return recipes;
	}

	async addRecipe(recipe: Omit<Recipe, '_id'>): Promise<string> {
		const { userRecipes, recipes } = await this.getCollections();
		const recipeId = new ObjectId().toString();

		// First save the recipe in the recipes collection
		await recipes.insertOne({
			...recipe,
			_id: new ObjectId(recipeId),
		});

		// Then add it to the user's saved recipes
		await userRecipes.updateOne(
			{ userId: recipe.userId },
			{
				$push: {
					savedRecipes: {
						_id: new ObjectId(),
						recipeId: recipeId,
						savedAt: new Date(),
					},
				},
			},
			{ upsert: true }
		);

		return recipeId;
	}

	async updateRecipe(id: string, recipe: Partial<Recipe>): Promise<void> {
		const { recipes } = await this.getCollections();
		await recipes.updateOne({ _id: new ObjectId(id) }, { $set: recipe });
	}

	async deleteRecipe(id: string): Promise<void> {
		const { recipes, userRecipes } = await this.getCollections();
		// Delete from recipes collection
		await recipes.deleteOne({ _id: new ObjectId(id) });
		// Remove from all users' saved recipes
		await userRecipes.updateMany(
			{ 'savedRecipes.recipeId': id },
			{ $pull: { savedRecipes: { recipeId: id } } }
		);
	}
}
