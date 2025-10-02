import {
	RequestValidator,
	ValidationRule,
} from '../../core/validation/RequestValidator';
import { RecipeCreateDTO } from '../types';

export class RecipeValidator extends RequestValidator<RecipeCreateDTO> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) => !!data.title && data.title.length >= 3,
			message: 'Title is required and must be at least 3 characters long',
		});

		this.addRule({
			validate: (data) =>
				Array.isArray(data.ingredients) && data.ingredients.length > 0,
			message: 'At least one ingredient is required',
		});

		this.addRule({
			validate: (data) =>
				Array.isArray(data.instructions) && data.instructions.length > 0,
			message: 'At least one instruction is required',
		});

		this.addRule({
			validate: (data) => !data.prepTime || data.prepTime > 0,
			message: 'Prep time must be greater than 0',
		});

		this.addRule({
			validate: (data) => !data.cookTime || data.cookTime > 0,
			message: 'Cook time must be greater than 0',
		});
	}
}
