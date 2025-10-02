import { RequestValidator } from '../../core/validation/RequestValidator';
import { ShoppingListCreateDTO } from '../types';

export class ShoppingListValidator extends RequestValidator<ShoppingListCreateDTO> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) => !!data.startDate,
			message: 'Start date is required',
		});

		this.addRule({
			validate: (data) => !!data.endDate,
			message: 'End date is required',
		});

		this.addRule({
			validate: (data) => {
				if (!data.startDate || !data.endDate) return true;
				return new Date(data.startDate) <= new Date(data.endDate);
			},
			message: 'Start date must be before or equal to end date',
		});

		this.addRule({
			validate: (data) =>
				!data.recipeIds ||
				(Array.isArray(data.recipeIds) &&
					data.recipeIds.every((id) => typeof id === 'string')),
			message: 'Recipe IDs must be an array of strings',
		});

		this.addRule({
			validate: (data) =>
				!data.mealPlanId || typeof data.mealPlanId === 'string',
			message: 'Meal plan ID must be a string',
		});

		this.addRule({
			validate: (data) =>
				!data.excludeItems ||
				(Array.isArray(data.excludeItems) &&
					data.excludeItems.every((item) => typeof item === 'string')),
			message: 'Excluded items must be an array of strings',
		});

		this.addRule({
			validate: (data) =>
				!data.preferences ||
				(typeof data.preferences === 'object' &&
					(!data.preferences.scalingFactor ||
						data.preferences.scalingFactor > 0)),
			message:
				'Preferences must be an object and scaling factor must be greater than 0',
		});
	}
}
