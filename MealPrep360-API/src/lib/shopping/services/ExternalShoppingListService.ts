import { BaseExternalService } from '../../core/services/BaseExternalService';
import { IShoppingListService } from '../interfaces/IShoppingListService';
import { IShoppingListDocument } from '../types/shopping-list';
import {
	ShoppingListCreateDTO,
	ShoppingListUpdateDTO,
	ShoppingListOptimizeOptions,
	ShoppingListItem,
} from '../types';
import {
	NotFoundError,
	UnauthorizedError,
} from '../../core/errors/ServiceError';

export class ExternalShoppingListService
	extends BaseExternalService
	implements IShoppingListService
{
	constructor() {
		super('shopping-service');
	}

	async createShoppingList(
		data: ShoppingListCreateDTO & { userId: string }
	): Promise<IShoppingListDocument> {
		return await this.resilientClient.post<IShoppingListDocument>(
			'/shopping-lists',
			data
		);
	}

	async getShoppingList(
		id: string,
		userId: string
	): Promise<IShoppingListDocument> {
		const list = await this.resilientClient.get<IShoppingListDocument>(
			`/shopping-lists/${id}`
		);

		if (list.userId !== userId) {
			throw new UnauthorizedError(
				'Not authorized to access this shopping list'
			);
		}

		return list;
	}

	async updateShoppingList(
		id: string,
		userId: string,
		data: ShoppingListUpdateDTO
	): Promise<IShoppingListDocument> {
		await this.validateOwnership(id, userId);
		return await this.resilientClient.put<IShoppingListDocument>(
			`/shopping-lists/${id}`,
			data
		);
	}

	async deleteShoppingList(id: string, userId: string): Promise<boolean> {
		await this.validateOwnership(id, userId);
		await this.resilientClient.delete(`/shopping-lists/${id}`);
		return true;
	}

	async getActiveShoppingList(
		userId: string
	): Promise<IShoppingListDocument | null> {
		return await this.resilientClient.get<IShoppingListDocument | null>(
			`/shopping-lists/active?userId=${userId}`
		);
	}

	async getShoppingListsByDateRange(
		userId: string,
		startDate: Date,
		endDate: Date
	): Promise<IShoppingListDocument[]> {
		return await this.resilientClient.get<IShoppingListDocument[]>(
			`/shopping-lists/range?userId=${userId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
		);
	}

	async markItemChecked(
		listId: string,
		userId: string,
		itemId: string,
		isChecked: boolean
	): Promise<IShoppingListDocument> {
		await this.validateOwnership(listId, userId);
		return await this.resilientClient.put<IShoppingListDocument>(
			`/shopping-lists/${listId}/items/${itemId}/check`,
			{ isChecked }
		);
	}

	async addItems(
		listId: string,
		userId: string,
		items: Partial<ShoppingListItem>[]
	): Promise<IShoppingListDocument> {
		await this.validateOwnership(listId, userId);
		return await this.resilientClient.post<IShoppingListDocument>(
			`/shopping-lists/${listId}/items`,
			{ items }
		);
	}

	async removeItems(
		listId: string,
		userId: string,
		itemIds: string[]
	): Promise<IShoppingListDocument> {
		await this.validateOwnership(listId, userId);
		return await this.resilientClient.delete<IShoppingListDocument>(
			`/shopping-lists/${listId}/items`,
			{ data: { itemIds } }
		);
	}

	async generateFromMealPlan(
		mealPlanId: string,
		userId: string,
		options?: {
			excludeItems?: string[];
			preferences?: ShoppingListCreateDTO['preferences'];
		}
	): Promise<IShoppingListDocument> {
		return await this.resilientClient.post<IShoppingListDocument>(
			'/shopping-lists/generate',
			{
				mealPlanId,
				userId,
				...options,
			}
		);
	}

	async optimizeList(
		listId: string,
		userId: string,
		options: ShoppingListOptimizeOptions
	): Promise<IShoppingListDocument> {
		await this.validateOwnership(listId, userId);
		return await this.resilientClient.post<IShoppingListDocument>(
			`/shopping-lists/${listId}/optimize`,
			options
		);
	}

	async completeShoppingList(
		listId: string,
		userId: string
	): Promise<IShoppingListDocument> {
		await this.validateOwnership(listId, userId);
		return await this.resilientClient.post<IShoppingListDocument>(
			`/shopping-lists/${listId}/complete`
		);
	}

	async exportList(
		listId: string,
		userId: string,
		format: 'pdf' | 'csv' | 'json'
	): Promise<Buffer> {
		await this.validateOwnership(listId, userId);
		const data = await this.resilientClient.get<ArrayBuffer>(
			`/shopping-lists/${listId}/export?format=${format}`,
			{ responseType: 'arraybuffer' }
		);
		return Buffer.from(data);
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
