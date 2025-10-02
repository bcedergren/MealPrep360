import { IShoppingListService } from '../interfaces/IShoppingListService';
import { IShoppingListDocument } from '../types/shopping-list';
import {
	ShoppingListCreateDTO,
	ShoppingListUpdateDTO,
	ShoppingListOptimizeOptions,
	ShoppingListItem,
} from '../types';
import { ShoppingList, User } from '@/lib/mongodb/schemas';
import {
	NotFoundError,
	UnauthorizedError,
} from '../../core/errors/ServiceError';
import connectDB from '@/lib/mongodb/connection';
import mongoose from 'mongoose';

export class LocalShoppingListService implements IShoppingListService {
	private async resolveUserObjectId(
		userId: string
	): Promise<mongoose.Types.ObjectId> {
		// Accept either a Mongo ObjectId string or a Clerk user ID
		if (mongoose.isValidObjectId(userId)) {
			return new mongoose.Types.ObjectId(userId);
		}

		// Fallback: treat as Clerk ID and look up the corresponding user
		const user = await User.findOne({ clerkId: userId }).select('_id');
		if (!user) {
			throw new NotFoundError(`User not found for id ${userId}`);
		}
		return user._id as mongoose.Types.ObjectId;
	}
	async createShoppingList(
		data: ShoppingListCreateDTO & { userId: string }
	): Promise<IShoppingListDocument> {
		await connectDB();

		const shoppingList = new ShoppingList({
			...data,
			userId: new mongoose.Types.ObjectId(data.userId),
			items: [],
			status: 'ACTIVE',
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		return await shoppingList.save();
	}

	async getShoppingList(
		id: string,
		userId: string
	): Promise<IShoppingListDocument> {
		await connectDB();

		const shoppingList = await ShoppingList.findById(id);
		if (!shoppingList) {
			throw new NotFoundError(`Shopping list ${id} not found`);
		}

		if (shoppingList.userId !== userId) {
			throw new UnauthorizedError(
				'Not authorized to access this shopping list'
			);
		}

		return shoppingList;
	}

	async updateShoppingList(
		id: string,
		userId: string,
		data: ShoppingListUpdateDTO
	): Promise<IShoppingListDocument> {
		await connectDB();

		await this.validateOwnership(id, userId);

		const shoppingList = await ShoppingList.findByIdAndUpdate(
			id,
			{
				...data,
				updatedAt: new Date(),
			},
			{ new: true }
		);

		if (!shoppingList) {
			throw new NotFoundError(`Shopping list ${id} not found`);
		}

		return shoppingList;
	}

	async deleteShoppingList(id: string, userId: string): Promise<boolean> {
		await connectDB();

		await this.validateOwnership(id, userId);

		const result = await ShoppingList.findByIdAndDelete(id);
		return !!result;
	}

	async getActiveShoppingList(
		userId: string
	): Promise<IShoppingListDocument | null> {
		await connectDB();

		const mongoUserId = await this.resolveUserObjectId(userId);
		return await ShoppingList.findOne({
			userId: mongoUserId,
			status: 'ACTIVE',
		}).sort({ createdAt: -1 });
	}

	async getShoppingListsByDateRange(
		userId: string,
		startDate: Date,
		endDate: Date
	): Promise<IShoppingListDocument[]> {
		await connectDB();

		const mongoUserId = await this.resolveUserObjectId(userId);
		return await ShoppingList.find({
			userId: mongoUserId,
			createdAt: {
				$gte: startDate,
				$lte: endDate,
			},
		}).sort({ createdAt: -1 });
	}

	async markItemChecked(
		listId: string,
		userId: string,
		itemId: string,
		isChecked: boolean
	): Promise<IShoppingListDocument> {
		await connectDB();

		await this.validateOwnership(listId, userId);

		const shoppingList = await ShoppingList.findById(listId);
		if (!shoppingList) {
			throw new NotFoundError(`Shopping list ${listId} not found`);
		}

		const item = shoppingList.items.find((item: any) => item.id === itemId);
		if (!item) {
			throw new NotFoundError(`Item ${itemId} not found in shopping list`);
		}

		item.checked = isChecked;
		shoppingList.updatedAt = new Date();

		return await shoppingList.save();
	}

	async addItems(
		listId: string,
		userId: string,
		items: Partial<ShoppingListItem>[]
	): Promise<IShoppingListDocument> {
		await connectDB();

		await this.validateOwnership(listId, userId);

		const shoppingList = await ShoppingList.findById(listId);
		if (!shoppingList) {
			throw new NotFoundError(`Shopping list ${listId} not found`);
		}

		const newItems = items.map((item) => ({
			...item,
			id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			checked: false,
		}));

		shoppingList.items.push(...newItems);
		shoppingList.updatedAt = new Date();

		return await shoppingList.save();
	}

	async removeItems(
		listId: string,
		userId: string,
		itemIds: string[]
	): Promise<IShoppingListDocument> {
		await connectDB();

		await this.validateOwnership(listId, userId);

		const shoppingList = await ShoppingList.findById(listId);
		if (!shoppingList) {
			throw new NotFoundError(`Shopping list ${listId} not found`);
		}

		shoppingList.items = shoppingList.items.filter(
			(item: any) => !itemIds.includes(item.id)
		);
		shoppingList.updatedAt = new Date();

		return await shoppingList.save();
	}

	async generateFromMealPlan(
		mealPlanId: string,
		userId: string,
		options?: {
			excludeItems?: string[];
			preferences?: ShoppingListCreateDTO['preferences'];
		}
	): Promise<IShoppingListDocument> {
		await connectDB();

		// For now, create a basic shopping list
		// In a full implementation, this would analyze the meal plan and extract ingredients
		const shoppingList = new ShoppingList({
			userId: new mongoose.Types.ObjectId(userId),
			name: `Shopping List for Meal Plan ${mealPlanId}`,
			items: [],
			status: 'ACTIVE',
			preferences: options?.preferences || {},
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		return await shoppingList.save();
	}

	async optimizeList(
		listId: string,
		userId: string,
		options: ShoppingListOptimizeOptions
	): Promise<IShoppingListDocument> {
		await connectDB();

		await this.validateOwnership(listId, userId);

		const shoppingList = await ShoppingList.findById(listId);
		if (!shoppingList) {
			throw new NotFoundError(`Shopping list ${listId} not found`);
		}

		// For now, just update the preferences
		// In a full implementation, this would optimize the list based on the options
		shoppingList.preferences = {
			...shoppingList.preferences,
			...options,
		};
		shoppingList.updatedAt = new Date();

		return await shoppingList.save();
	}

	async completeShoppingList(
		listId: string,
		userId: string
	): Promise<IShoppingListDocument> {
		await connectDB();

		await this.validateOwnership(listId, userId);

		const shoppingList = await ShoppingList.findById(listId);
		if (!shoppingList) {
			throw new NotFoundError(`Shopping list ${listId} not found`);
		}

		shoppingList.status = 'COMPLETED';
		shoppingList.updatedAt = new Date();

		return await shoppingList.save();
	}

	async exportList(
		listId: string,
		userId: string,
		format: 'pdf' | 'csv' | 'json'
	): Promise<Buffer> {
		await connectDB();

		await this.validateOwnership(listId, userId);

		const shoppingList = await ShoppingList.findById(listId);
		if (!shoppingList) {
			throw new NotFoundError(`Shopping list ${listId} not found`);
		}

		// For now, return JSON format
		// In a full implementation, this would generate PDF or CSV
		const data = JSON.stringify(shoppingList, null, 2);
		return Buffer.from(data, 'utf-8');
	}

	private async validateOwnership(
		listId: string,
		userId: string
	): Promise<void> {
		const list = await this.getShoppingList(listId, userId);
		if (!list) {
			throw new NotFoundError(`Shopping list ${listId} not found`);
		}
		if (list.userId !== userId) {
			throw new UnauthorizedError(
				'Not authorized to access this shopping list'
			);
		}
	}
}
