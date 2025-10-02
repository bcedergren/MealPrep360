import { MealPlan } from '../types/mealPlan';
import { getMongoClient } from '../lib/mongodb';
import { ObjectId } from 'mongodb';

interface MongoMealPlan {
	_id: ObjectId;
	id: string;
	userId: ObjectId;
	startDate: Date;
	endDate: Date;
	days: {
		recipeId: string | null;
		status: 'planned' | 'completed' | 'skipped';
	}[];
	createdAt: Date;
	updatedAt: Date;
}

export class MealPlanRepository {
	private readonly collectionName = 'mealPlans';

	async saveMealPlan(mealPlan: MealPlan): Promise<MealPlan> {
		try {
			const client = await getMongoClient();
			const db = client.db();
			console.log('Using database:', db.databaseName);
			const collection = db.collection<MongoMealPlan>(this.collectionName);

			const mongoMealPlan: MongoMealPlan = {
				_id: new ObjectId(),
				id: mealPlan.id,
				userId: new ObjectId(mealPlan.userId),
				startDate: new Date(mealPlan.startDate),
				endDate: new Date(mealPlan.endDate),
				days: mealPlan.days,
				createdAt: new Date(mealPlan.createdAt),
				updatedAt: new Date(mealPlan.updatedAt),
			};

			try {
				// Check if meal plan exists
				const existingMealPlan = await collection.findOne({ id: mealPlan.id });

				if (existingMealPlan) {
					// Only update the fields that may have changed
					const updateFields: Partial<MongoMealPlan> = {
						id: mongoMealPlan.id,
						userId: mongoMealPlan.userId,
						startDate: mongoMealPlan.startDate,
						endDate: mongoMealPlan.endDate,
						days: mongoMealPlan.days,
						createdAt: mongoMealPlan.createdAt,
						updatedAt: mongoMealPlan.updatedAt,
					};
					await collection.updateOne(
						{ id: mealPlan.id },
						{ $set: updateFields }
					);
				} else {
					// Insert new meal plan
					await collection.insertOne(mongoMealPlan);
				}

				console.log('Save result:', {
					id: mealPlan.id,
					updated: !!existingMealPlan,
				});
			} catch (error) {
				console.error('Error saving meal plan:', error);
				throw error;
			}

			return mealPlan;
		} catch (error) {
			console.error('Error saving meal plan:', error);
			throw error;
		}
	}

	async getMealPlan(id: string): Promise<MealPlan | null> {
		const client = await getMongoClient();
		const collection = client
			.db()
			.collection<MongoMealPlan>(this.collectionName);

		const mealPlan = await collection.findOne(
			{ id },
			{
				projection: {
					id: 1,
					userId: 1,
					startDate: 1,
					endDate: 1,
					days: 1,
					createdAt: 1,
					updatedAt: 1,
					_id: 0,
				},
			}
		);

		if (!mealPlan) return null;

		return {
			id: mealPlan.id,
			userId: mealPlan.userId.toString(),
			startDate:
				mealPlan.startDate instanceof Date
					? mealPlan.startDate.toISOString()
					: mealPlan.startDate,
			endDate:
				mealPlan.endDate instanceof Date
					? mealPlan.endDate.toISOString()
					: mealPlan.endDate,
			days: mealPlan.days,
			createdAt: mealPlan.createdAt.toISOString(),
			updatedAt: mealPlan.updatedAt.toISOString(),
		};
	}

	async getMealPlansByDateRange(
		startDate: Date,
		endDate: Date
	): Promise<MealPlan[]> {
		const client = await getMongoClient();
		const db = client.db();
		const collection = db.collection<MongoMealPlan>(this.collectionName);

		const mealPlans = await collection
			.find(
				{
					startDate: { $gte: startDate },
					endDate: { $lte: endDate },
				},
				{
					projection: {
						id: 1,
						userId: 1,
						startDate: 1,
						endDate: 1,
						days: 1,
						createdAt: 1,
						updatedAt: 1,
						_id: 0,
					},
				}
			)
			.toArray();

		return mealPlans.map((mealPlan) => ({
			id: mealPlan.id,
			userId: mealPlan.userId.toString(),
			startDate:
				mealPlan.startDate instanceof Date
					? mealPlan.startDate.toISOString()
					: mealPlan.startDate,
			endDate:
				mealPlan.endDate instanceof Date
					? mealPlan.endDate.toISOString()
					: mealPlan.endDate,
			days: mealPlan.days,
			createdAt: mealPlan.createdAt.toISOString(),
			updatedAt: mealPlan.updatedAt.toISOString(),
		}));
	}

	async deleteMealPlan(id: string): Promise<void> {
		const client = await getMongoClient();
		const collection = client
			.db()
			.collection<MongoMealPlan>(this.collectionName);

		await collection.deleteOne({ id });
	}
}
