import { Document } from 'mongoose';
import { ShoppingListItem } from './index';

export interface IShoppingListDocument extends Document {
	userId: string;
	name: string;
	startDate: Date;
	endDate: Date;
	items: ShoppingListItem[];
	mealPlanId?: string;
	recipeIds: string[];
	preferences: {
		groupByCategory: boolean;
		includeOptionalIngredients: boolean;
		scalingFactor: number;
	};
	isActive: boolean;
	totalCost?: number;
	completedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}
