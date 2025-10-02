import { BaseMongoRepository } from '../../core/repositories/BaseMongoRepository';
import { IMealPlanRepository } from '../interfaces/IMealPlanRepository';
import { MealPlan } from '@/lib/mongodb/schemas';
import { MealPlanCreateDTO, MealPlanFilterDTO } from '../types';
import { IMealPlanDocument } from '../types/meal-plan';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';

export class MongoMealPlanRepository
	extends BaseMongoRepository<
		IMealPlanDocument,
		MealPlanCreateDTO,
		MealPlanFilterDTO
	>
	implements IMealPlanRepository
{
	constructor(model: Model<IMealPlanDocument>) {
		super(model);
	}

	async updateMany(
		query: FilterQuery<IMealPlanDocument>,
		data: UpdateQuery<IMealPlanDocument>
	): Promise<number> {
		const result = await this.model.updateMany(query, data);
		return result.modifiedCount;
	}

	async deleteMany(query: FilterQuery<IMealPlanDocument>): Promise<number> {
		const result = await this.model.deleteMany(query);
		return result.deletedCount;
	}

	async count(query: FilterQuery<IMealPlanDocument>): Promise<number> {
		return await this.model.countDocuments(query);
	}

	async findByDateRange(
		userId: string,
		startDate: Date,
		endDate: Date
	): Promise<IMealPlanDocument[]> {
		return await this.model.find({
			userId,
			$or: [
				{
					startDate: { $lte: endDate },
					endDate: { $gte: startDate },
				},
				{
					'days.date': {
						$gte: startDate,
						$lte: endDate,
					},
				},
			],
		});
	}

	async findActiveByUserId(userId: string): Promise<IMealPlanDocument | null> {
		const currentDate = new Date();
		return await this.model.findOne({
			userId,
			startDate: { $lte: currentDate },
			endDate: { $gte: currentDate },
		});
	}

	async skipDay(
		mealPlanId: string,
		date: Date
	): Promise<IMealPlanDocument | null> {
		return await this.model.findOneAndUpdate(
			{
				_id: mealPlanId,
				'days.date': date,
			},
			{
				$set: {
					'days.$.isSkipped': true,
				},
			},
			{ new: true }
		);
	}

	async unskipDay(
		mealPlanId: string,
		date: Date
	): Promise<IMealPlanDocument | null> {
		return await this.model.findOneAndUpdate(
			{
				_id: mealPlanId,
				'days.date': date,
			},
			{
				$set: {
					'days.$.isSkipped': false,
				},
			},
			{ new: true }
		);
	}

	async updateDayMeals(
		mealPlanId: string,
		date: Date,
		meals: IMealPlanDocument['days'][0]['meals']
	): Promise<IMealPlanDocument | null> {
		return await this.model.findOneAndUpdate(
			{
				_id: mealPlanId,
				'days.date': date,
			},
			{
				$set: {
					'days.$.meals': meals,
				},
			},
			{ new: true }
		);
	}

	async findOverlappingPlans(
		userId: string,
		startDate: Date,
		endDate: Date
	): Promise<IMealPlanDocument[]> {
		return await this.model.find({
			userId,
			$or: [
				{
					startDate: { $lte: endDate },
					endDate: { $gte: startDate },
				},
			],
		});
	}
}
