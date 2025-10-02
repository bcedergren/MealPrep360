import { IShoppingListDocument } from '../types/shopping-list';
import {
	ShoppingListCreateDTO,
	ShoppingListUpdateDTO,
	ShoppingListFilterDTO,
	ShoppingListOptimizeOptions,
	ShoppingListItem,
} from '../types';

export interface IShoppingListService {
	createShoppingList(
		data: ShoppingListCreateDTO & { userId: string }
	): Promise<IShoppingListDocument>;

	getShoppingList(id: string, userId: string): Promise<IShoppingListDocument>;

	updateShoppingList(
		id: string,
		userId: string,
		data: ShoppingListUpdateDTO
	): Promise<IShoppingListDocument>;

	deleteShoppingList(id: string, userId: string): Promise<boolean>;

	getActiveShoppingList(userId: string): Promise<IShoppingListDocument | null>;

	getShoppingListsByDateRange(
		userId: string,
		startDate: Date,
		endDate: Date
	): Promise<IShoppingListDocument[]>;

	markItemChecked(
		listId: string,
		userId: string,
		itemId: string,
		isChecked: boolean
	): Promise<IShoppingListDocument>;

	addItems(
		listId: string,
		userId: string,
		items: Partial<ShoppingListItem>[]
	): Promise<IShoppingListDocument>;

	removeItems(
		listId: string,
		userId: string,
		itemIds: string[]
	): Promise<IShoppingListDocument>;

	generateFromMealPlan(
		mealPlanId: string,
		userId: string,
		options?: {
			excludeItems?: string[];
			preferences?: ShoppingListCreateDTO['preferences'];
		}
	): Promise<IShoppingListDocument>;

	optimizeList(
		listId: string,
		userId: string,
		options: ShoppingListOptimizeOptions
	): Promise<IShoppingListDocument>;

	completeShoppingList(
		listId: string,
		userId: string
	): Promise<IShoppingListDocument>;

	exportList(
		listId: string,
		userId: string,
		format: 'pdf' | 'csv' | 'json'
	): Promise<Buffer>;
}
