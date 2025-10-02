import { IMealPlanRepository } from '../../domain/interfaces/IMealPlanRepository';
import { MealPlan } from '../../domain/models/MealPlan';
import { IDatabase } from '../../domain/interfaces/IDatabase';
import { IDateService } from '../../domain/interfaces/IDateService';
import { MongoMealPlan } from '../database/MongoModels';

export class MongoMealPlanRepository implements IMealPlanRepository {
	private readonly collectionName = 'mealPlans';

	constructor(
		private readonly database: IDatabase,
		private readonly dateService: IDateService
	) {}

	async saveMealPlan(mealPlan: MealPlan): Promise<MealPlan> {
		const collection = await this.database.getCollection<MongoMealPlan>(
			this.collectionName
		);

		const mongoMealPlan: MongoMealPlan = {
			_id: mealPlan.id,
			id: mealPlan.id,
			userId: mealPlan.userId,
			startDate: new Date(mealPlan.startDate),
			endDate: new Date(mealPlan.endDate),
			days: mealPlan.days,
			createdAt: new Date(mealPlan.createdAt),
			updatedAt: new Date(mealPlan.updatedAt),
		};

		const existingMealPlan = await collection.findOne({ id: mealPlan.id });

		if (existingMealPlan) {
			await collection.updateOne({ id: mealPlan.id }, { $set: mongoMealPlan });
		} else {
			await collection.insertOne(mongoMealPlan);
		}

		return mealPlan;
	}

	async getMealPlan(id: string): Promise<MealPlan | null> {
		const collection = await this.database.getCollection<MongoMealPlan>(
			this.collectionName
		);
		const mealPlan = await collection.findOne({ id });

		if (!mealPlan) return null;

		return this.mapToMealPlan(mealPlan);
	}

	async getMealPlansByDateRange(
		startDate: Date,
		endDate: Date
	): Promise<MealPlan[]> {
		const collection = await this.database.getCollection<MongoMealPlan>(
			this.collectionName
		);

		const mealPlans = await collection.find({
			startDate: { $gte: startDate },
			endDate: { $lte: endDate },
		});

		return mealPlans.map(this.mapToMealPlan.bind(this));
	}

	async deleteMealPlan(id: string): Promise<void> {
		const collection = await this.database.getCollection<MongoMealPlan>(
			this.collectionName
		);
		await collection.deleteOne({ id });
	}

	private mapToMealPlan(mongoMealPlan: MongoMealPlan): MealPlan {
		return {
			id: mongoMealPlan.id,
			userId: mongoMealPlan.userId,
			startDate: this.dateService.toISOString(mongoMealPlan.startDate),
			endDate: this.dateService.toISOString(mongoMealPlan.endDate),
			days: mongoMealPlan.days,
			createdAt: this.dateService.toISOString(mongoMealPlan.createdAt),
			updatedAt: this.dateService.toISOString(mongoMealPlan.updatedAt),
		};
	}
}
