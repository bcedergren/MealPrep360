import { RequestValidator } from '../../core/validation/RequestValidator';
import { MealPlanCreateDTO } from '../types';

export class MealPlanValidator extends RequestValidator<MealPlanCreateDTO> {
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
				!data.preferences || typeof data.preferences === 'object',
			message: 'Preferences must be an object',
		});

		this.addRule({
			validate: (data) =>
				!data.dietaryRestrictions ||
				(Array.isArray(data.dietaryRestrictions) &&
					data.dietaryRestrictions.every((r) => typeof r === 'string')),
			message: 'Dietary restrictions must be an array of strings',
		});

		this.addRule({
			validate: (data) =>
				!data.excludedIngredients ||
				(Array.isArray(data.excludedIngredients) &&
					data.excludedIngredients.every((i) => typeof i === 'string')),
			message: 'Excluded ingredients must be an array of strings',
		});
	}
}
