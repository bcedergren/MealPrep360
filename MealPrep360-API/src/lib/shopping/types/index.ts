import { IRecipeDocument } from '../../recipes/types/recipe';

export interface ShoppingListItem {
	ingredient: string;
	amount: number;
	unit: string;
	recipes: Array<{
		recipeId: string;
		recipeName: string;
		amount: number;
		unit: string;
	}>;
	category: string;
	isChecked: boolean;
	notes?: string;
}

export interface ShoppingListCreateDTO {
	name?: string;
	startDate: string | Date;
	endDate: string | Date;
	recipeIds?: string[];
	mealPlanId?: string;
	excludeItems?: string[];
	preferences?: {
		groupByCategory?: boolean;
		includeOptionalIngredients?: boolean;
		scalingFactor?: number;
	};
}

export interface ShoppingListUpdateDTO {
	name?: string;
	items?: Partial<ShoppingListItem>[];
	preferences?: {
		groupByCategory?: boolean;
		includeOptionalIngredients?: boolean;
		scalingFactor?: number;
	};
}

export interface ShoppingListFilterDTO {
	userId: string;
	startDate?: Date;
	endDate?: Date;
	isActive?: boolean;
	includeCompleted?: boolean;
}

export interface ShoppingListOptimizeOptions {
	minimizeCost?: boolean;
	preferredStores?: string[];
	substituteOutOfStock?: boolean;
	consolidateItems?: boolean;
}
