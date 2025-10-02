import { IRecipeRepository } from '../../domain/interfaces/IRecipeRepository';
import { Recipe } from '../../domain/models/Recipe';
import { IDatabase } from '../../domain/interfaces/IDatabase';
import { IDateService } from '../../domain/interfaces/IDateService';
import { MongoRecipe, MongoSavedRecipe } from '../database/MongoModels';
import { ObjectId } from 'mongodb';
import { withMongoRetry } from '@/app/lib/mongoRetry';

export class MongoRecipeRepository implements IRecipeRepository {
	private readonly recipesCollectionName = 'recipes';
	private readonly userRecipesCollectionName = 'userrecipes';

	constructor(
		private readonly database: IDatabase,
		private readonly dateService: IDateService
	) {}

	async getAllRecipes(): Promise<Recipe[]> {
		const collection = await this.database.getCollection<MongoRecipe>(
			this.recipesCollectionName
		);
		const recipes = await collection.find({});
		return recipes.map(this.mapToRecipe.bind(this));
	}

	async getRecipesByTags(tags: string[]): Promise<Recipe[]> {
		const collection = await this.database.getCollection<MongoRecipe>(
			this.recipesCollectionName
		);
		const recipes = await collection.find({ tags: { $in: tags } });
		return recipes.map(this.mapToRecipe.bind(this));
	}

	async getRecipeById(id: string): Promise<Recipe | null> {
		const collection = await this.database.getCollection<MongoRecipe>(
			this.recipesCollectionName
		);
		const recipe = await collection.findOne({ _id: id });
		return recipe ? this.mapToRecipe(recipe) : null;
	}

	async getUserSavedRecipes(userId: string): Promise<Recipe[]> {
		return withMongoRetry(async () => {
			const userRecipesCollection =
				await this.database.getCollection<MongoSavedRecipe>(
					this.userRecipesCollectionName
				);
			const recipesCollection = await this.database.getCollection<MongoRecipe>(
				this.recipesCollectionName
			);

			// 1) Find the user's saved doc robustly
			const userDoc = await this.findUserSavedDocByAnyId(
				userRecipesCollection,
				userId
			);

			if (!userDoc) {
				console.log(
					`No userrecipes doc found for ${userId} after type-agnostic match.`
				);
				return [];
			}

			// 2) Extract recipeIds from common shapes
			const recipeIds: any[] = [];
			if (Array.isArray((userDoc as any).savedRecipes)) {
				for (const sr of (userDoc as any).savedRecipes) {
					const id =
						(sr as any)?.recipeId ??
						(sr as any)?.recipeID ??
						(sr as any)?.recipe_id ??
						(sr as any)?.recipe;
					if (id) recipeIds.push(id);
				}
			}

			if (!recipeIds.length) {
				console.log(
					`userrecipes doc exists but no savedRecipes entries for ${userId}`
				);
				return [];
			}

			// 3) Fetch only present recipes; log any dangling refs
			const objIds = this.toObjectIds(recipeIds);
			const cursor: any = await recipesCollection.find({
				_id: { $in: objIds as any[] },
			});
			const docs: MongoRecipe[] = Array.isArray(cursor)
				? cursor
				: (cursor?.toArray ? await cursor.toArray() : cursor) || [];

			const presentIds = new Set(
				docs.map((d: any) => (d as any)._id?.toString?.() ?? (d as any)._id)
			);
			const missing = objIds
				.map((oid) => oid.toString())
				.filter((hex) => !presentIds.has(hex));
			console.log(
				`Saved refs for ${userId}: present=${presentIds.size}, missing=${missing.length}`
			);
			if (missing.length)
				console.warn(
					'Dangling saved recipe refs:',
					missing.slice(0, 10),
					missing.length > 10 ? '…' : ''
				);

			return docs.map(this.mapToRecipe.bind(this));
		});
	}

	private toObjectIds(ids: any[]): ObjectId[] {
		const out: ObjectId[] = [];
		for (const v of ids) {
			if (!v) continue;
			if ((v as any)?.constructor?.name === 'ObjectId') {
				out.push(v as any);
				continue;
			}
			try {
				out.push(new ObjectId(String(v)));
			} catch {}
		}
		return out;
	}

	private async toArray<T>(maybeCursorOrArray: any): Promise<T[]> {
		if (!maybeCursorOrArray) return [] as T[];
		if (Array.isArray(maybeCursorOrArray)) return maybeCursorOrArray as T[];
		if (typeof maybeCursorOrArray.toArray === 'function')
			return (await maybeCursorOrArray.toArray()) as T[];
		return (maybeCursorOrArray as T[]) || [];
	}

	private hexOrString(v: any): string | null {
		if (v == null) return null;
		try {
			if ((v as any)?.constructor?.name === 'ObjectId')
				return (v as ObjectId).toHexString();
			const s = String(v).trim();
			return s.length ? s : null;
		} catch {
			return null;
		}
	}

	private async findUserSavedDocByAnyId(
		userRecipesCollection: any,
		rawUserId: string
	) {
		const uid = (rawUserId ?? '').trim();

		// 1) Fast path: exact match with string userId
		const direct = await userRecipesCollection.findOne({ userId: uid });
		if (direct) return direct;

		// 2) Fast path: match with ObjectId(userId) if valid
		try {
			const asObj = new ObjectId(uid);
			const byObj = await userRecipesCollection.findOne({
				userId: asObj as any,
			});
			if (byObj) return byObj;
		} catch {}

		// 3) Fallback: read all and compare in JS (safe with small collections)
		const allDocs = await this.toArray<any>(
			await userRecipesCollection.find({})
		);
		for (const d of allDocs) {
			const docHex = this.hexOrString((d as any)?.userId);
			if (docHex && docHex === uid) return d;
			const altKeys = ['userID', 'user_id', 'uid', '_id'];
			for (const k of altKeys) {
				const hex = this.hexOrString((d as any)?.[k]);
				if (hex && hex === uid) return d;
			}
		}
		return null;
	}

	private async _debugSavedIdsVsRecipes(
		recipeIds: any[],
		database: IDatabase,
		recipesCollectionName: string
	) {
		try {
			// 1) What DB/collection are we actually hitting?
			const dbAny = database as any;
			const dbName = dbAny?.getDb?.()?.databaseName ?? '<unknown>';
			console.log(
				'[DEBUG] DB name:',
				dbName,
				'collection:',
				recipesCollectionName
			);

			// 2) Inspect the first few recipe docs to learn _id types
			const recipesColl = await database.getCollection<any>(
				recipesCollectionName
			);
			const sample = (await recipesColl.find({})).slice(0, 5);
			const idTypes = (sample || []).map(
				(d: any) =>
					typeof d?._id +
					(d?._id?.constructor?.name ? `(${d._id.constructor.name})` : '')
			);
			console.log('[DEBUG] Sample _id types in recipes:', idTypes);

			// 3) Convert IDs to both forms
			const strSet = new Set<string>();
			const objIds: ObjectId[] = [];
			for (const rid of recipeIds) {
				if (!rid) continue;
				if (typeof rid === 'string') {
					strSet.add(rid);
					try {
						objIds.push(new ObjectId(rid));
					} catch {}
				} else if (rid instanceof ObjectId) {
					objIds.push(rid);
					try {
						strSet.add(rid.toHexString());
					} catch {}
				} else {
					try {
						const s = String(rid);
						strSet.add(s);
						try {
							objIds.push(new ObjectId(s));
						} catch {}
					} catch {}
				}
			}

			const strArr = Array.from(strSet);
			// 4) Count matches by _id both ways
			const countStr = strArr.length
				? await recipesColl.countDocuments({ _id: { $in: strArr as any[] } })
				: 0;
			const countObj = objIds.length
				? await recipesColl.countDocuments({ _id: { $in: objIds as any[] } })
				: 0;
			console.log('[DEBUG] Match counts in recipes by _id:', {
				countStr,
				countObj,
				strTried: strArr.length,
				objTried: objIds.length,
			});

			// 5) If zero, test common alt key names inside recipes
			if (countStr === 0 && countObj === 0) {
				const altKeys = ['recipeId', 'legacyId', 'uuid', 'id'];
				for (const k of altKeys) {
					const cStr = strArr.length
						? await recipesColl.countDocuments({
								[k]: { $in: strArr as any[] },
							})
						: 0;
					const cObj = objIds.length
						? await recipesColl.countDocuments({
								[k]: { $in: objIds as any[] },
							})
						: 0;
					console.log(`[DEBUG] Match counts in recipes by ${k}:`, {
						cStr,
						cObj,
					});
				}
			}
		} catch (e) {
			console.log('[DEBUG] Diagnostics error:', (e as Error).message);
		}
	}

	async addRecipe(recipe: Omit<Recipe, 'id'>): Promise<string> {
		const recipesCollection = await this.database.getCollection<MongoRecipe>(
			this.recipesCollectionName
		);
		const userRecipesCollection =
			await this.database.getCollection<MongoSavedRecipe>(
				this.userRecipesCollectionName
			);

		const recipeId = crypto.randomUUID();
		const mongoRecipe: MongoRecipe = {
			_id: recipeId,
			...recipe,
		};

		await recipesCollection.insertOne(mongoRecipe);

		await userRecipesCollection.updateOne(
			{ userId: recipe.userId },
			{
				$push: {
					savedRecipes: {
						_id: crypto.randomUUID(),
						recipeId,
						savedAt: new Date(),
					},
				},
			},
			{ upsert: true }
		);

		return recipeId;
	}

	async updateRecipe(id: string, recipe: Partial<Recipe>): Promise<void> {
		const collection = await this.database.getCollection<MongoRecipe>(
			this.recipesCollectionName
		);
		await collection.updateOne({ _id: id }, { $set: recipe });
	}

	async deleteRecipe(id: string): Promise<void> {
		const recipesCollection = await this.database.getCollection<MongoRecipe>(
			this.recipesCollectionName
		);
		const userRecipesCollection =
			await this.database.getCollection<MongoSavedRecipe>(
				this.userRecipesCollectionName
			);

		await recipesCollection.deleteOne({ _id: id });
		await userRecipesCollection.updateMany(
			{ 'savedRecipes.recipeId': id },
			{ $pull: { savedRecipes: { recipeId: id } } }
		);
	}

	private mapToRecipe(mongoRecipe: MongoRecipe): Recipe {
		return {
			id: (mongoRecipe as any)._id?.toString?.() ?? (mongoRecipe as any)._id,
			userId: mongoRecipe.userId,
			title: mongoRecipe.title,
			description: mongoRecipe.description,
			ingredients: mongoRecipe.ingredients,
			prepInstructions: mongoRecipe.prepInstructions,
			prepTime: mongoRecipe.prepTime,
			cookTime: mongoRecipe.cookTime,
			servings: mongoRecipe.servings,
			tags: mongoRecipe.tags,
			storageTime: mongoRecipe.storageTime,
			containerSuggestions: mongoRecipe.containerSuggestions,
			defrostInstructions: mongoRecipe.defrostInstructions,
			cookingInstructions: mongoRecipe.cookingInstructions,
			servingInstructions: mongoRecipe.servingInstructions,
			season: mongoRecipe.season,
			embedding: mongoRecipe.embedding,
			images: mongoRecipe.images,
			isPublic: mongoRecipe.isPublic,
			allergenInfo: mongoRecipe.allergenInfo,
			dietaryInfo: mongoRecipe.dietaryInfo,
			hasImage: mongoRecipe.hasImage,
			isPlaceholder: mongoRecipe.isPlaceholder,
			createdAt: this.dateService.toISOString(new Date(mongoRecipe.createdAt)),
			updatedAt: this.dateService.toISOString(new Date(mongoRecipe.updatedAt)),
		};
	}
}
