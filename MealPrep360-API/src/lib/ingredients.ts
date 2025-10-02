interface ParsedIngredient {
	name: string;
	quantity: number;
	unit: string;
	category?: string;
}

export function parseIngredient(
	ingredientLine: string
): ParsedIngredient | null {
	if (!ingredientLine || ingredientLine.trim() === '') {
		return null;
	}

	// Basic regex to parse ingredients like "2 cups flour" or "1 tbsp olive oil"
	const regex = /^(\d+(?:\.\d+)?(?:\/\d+)?)\s*([a-zA-Z]+)?\s+(.+)$/;
	const match = ingredientLine.trim().match(regex);

	if (match) {
		const [, quantityStr, unit = '', name] = match;

		// Parse quantity (handle fractions)
		let quantity = 1;
		if (quantityStr.includes('/')) {
			const [whole, fraction] = quantityStr.split('/');
			quantity = parseFloat(whole) / parseFloat(fraction);
		} else {
			quantity = parseFloat(quantityStr);
		}

		return {
			name: cleanIngredientName(name.trim()),
			quantity: quantity || 1,
			unit: unit.toLowerCase() || 'piece', // Default to 'piece' if unit is empty
			category: determineCategory(name.trim()),
		};
	}

	// If no quantity found, treat as ingredient with quantity 1
	return {
		name: cleanIngredientName(ingredientLine.trim()),
		quantity: 1,
		unit: 'piece', // Default unit when none is specified
		category: determineCategory(ingredientLine.trim()),
	};
}

export function cleanIngredientName(name: string): string {
	// Remove common prefixes and suffixes, normalize spacing
	return name
		.replace(/^(fresh|dried|chopped|minced|sliced|diced)\s+/i, '')
		.replace(/\s*,\s*(chopped|minced|sliced|diced).*$/i, '')
		.trim();
}

export function determineCategory(ingredientName: string): string {
	const name = ingredientName.toLowerCase();

	// Produce
	if (
		name.includes('onion') ||
		name.includes('garlic') ||
		name.includes('tomato') ||
		name.includes('carrot') ||
		name.includes('celery') ||
		name.includes('pepper') ||
		name.includes('lettuce') ||
		name.includes('spinach') ||
		name.includes('potato')
	) {
		return 'Produce';
	}

	// Meat & Seafood
	if (
		name.includes('chicken') ||
		name.includes('beef') ||
		name.includes('pork') ||
		name.includes('fish') ||
		name.includes('salmon') ||
		name.includes('shrimp')
	) {
		return 'Meat & Seafood';
	}

	// Dairy
	if (
		name.includes('milk') ||
		name.includes('cheese') ||
		name.includes('butter') ||
		name.includes('yogurt') ||
		name.includes('cream')
	) {
		return 'Dairy';
	}

	// Pantry
	if (
		name.includes('flour') ||
		name.includes('sugar') ||
		name.includes('salt') ||
		name.includes('pepper') ||
		name.includes('oil') ||
		name.includes('vinegar') ||
		name.includes('spice') ||
		name.includes('herb')
	) {
		return 'Pantry';
	}

	return 'Other';
}
