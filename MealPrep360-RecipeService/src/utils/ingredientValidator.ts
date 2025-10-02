export interface ValidatedIngredient {
	name: string;
	amount: string;
	unit: string;
}

export class IngredientValidator {
	/**
	 * Validates and normalizes an ingredient object
	 * @param ingredient - The ingredient to validate
	 * @returns The validated and normalized ingredient
	 * @throws Error if the ingredient structure is invalid
	 */
	static validateIngredient(ingredient: any): ValidatedIngredient {
		if (!ingredient) {
			throw new Error('Ingredient cannot be null or undefined');
		}

		if (!ingredient.name || typeof ingredient.name !== 'string') {
			throw new Error('Ingredient must have a valid name (string)');
		}

		if (!ingredient.amount && ingredient.amount !== 0) {
			// Set default amount if missing
			ingredient.amount = '1';
		}

		if (
			!ingredient.unit ||
			typeof ingredient.unit !== 'string' ||
			ingredient.unit.trim() === ''
		) {
			// Set default unit if missing or empty
			ingredient.unit = 'piece';
		}

		// Normalize amount to string (handles both string and number inputs)
		let normalizedAmount: string;
		if (typeof ingredient.amount === 'number') {
			normalizedAmount = ingredient.amount.toString();
		} else if (typeof ingredient.amount === 'string') {
			normalizedAmount = ingredient.amount.trim();
			if (normalizedAmount === '') {
				normalizedAmount = '1'; // Default fallback for empty strings
			}
		} else {
			normalizedAmount = '1'; // Default fallback for other types
		}

		return {
			name: ingredient.name.trim(),
			amount: normalizedAmount,
			unit: ingredient.unit.trim(),
		};
	}

	/**
	 * Validates and normalizes an array of ingredients
	 * @param ingredients - Array of ingredients to validate
	 * @returns Array of validated and normalized ingredients
	 * @throws Error if any ingredient is invalid or array is empty
	 */
	static validateIngredients(ingredients: any[]): ValidatedIngredient[] {
		if (!Array.isArray(ingredients)) {
			throw new Error('Ingredients must be an array');
		}

		if (ingredients.length === 0) {
			throw new Error('Ingredients array cannot be empty');
		}

		return ingredients.map((ingredient, index) => {
			try {
				return this.validateIngredient(ingredient);
			} catch (error) {
				throw new Error(
					`Invalid ingredient at index ${index}: ${error instanceof Error ? error.message : error}`
				);
			}
		});
	}

	/**
	 * Checks if an ingredient structure is valid without throwing
	 * @param ingredient - The ingredient to check
	 * @returns true if valid, false otherwise
	 */
	static isValidIngredient(ingredient: any): boolean {
		try {
			this.validateIngredient(ingredient);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Checks if an ingredients array is valid without throwing
	 * @param ingredients - Array of ingredients to check
	 * @returns true if valid, false otherwise
	 */
	static isValidIngredients(ingredients: any[]): boolean {
		try {
			this.validateIngredients(ingredients);
			return true;
		} catch {
			return false;
		}
	}
}
