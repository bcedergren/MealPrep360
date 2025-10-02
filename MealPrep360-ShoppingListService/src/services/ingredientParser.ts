export interface ParsedIngredient {
	name: string;
	quantity: number | null;
	unit: string | null;
}

export interface IIngredientParser {
	parseIngredientString(ingredientStr: string): ParsedIngredient;
}

export class IngredientParser implements IIngredientParser {
	parseIngredientString(ingredientStr: string): ParsedIngredient {
		let cleaned = ingredientStr.trim();

		// Handle "to taste" ingredients
		if (cleaned.toLowerCase().includes('to taste')) {
			const nameOnly = cleaned.replace(/\s*to\s+taste\s*/gi, '').trim();
			return {
				name: nameOnly || cleaned,
				quantity: null,
				unit: null,
			};
		}

		// Handle "N/A" ingredients
		if (cleaned.toLowerCase().startsWith('n/a')) {
			const nameOnly = cleaned.replace(/^n\/a\s*/i, '').trim();
			return {
				name: nameOnly || cleaned,
				quantity: null,
				unit: null,
			};
		}

		// Extract numeric quantity (including mixed fractions, simple fractions, and decimals)
		const quantityMatch = cleaned.match(
			/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+\.\d+|\d+)(?:\s|$)/
		);
		let quantity: number | null = null;

		if (quantityMatch) {
			const quantityStr = quantityMatch[1];
			cleaned = cleaned.replace(quantityMatch[0], '').trim();

			// Parse mixed fractions (e.g., "1 1/3")
			if (quantityStr.includes(' ') && quantityStr.includes('/')) {
				const parts = quantityStr.split(' ');
				const wholePart = parseFloat(parts[0]);
				const fractionParts = parts[1].split('/');
				if (fractionParts.length === 2) {
					const numerator = parseFloat(fractionParts[0]);
					const denominator = parseFloat(fractionParts[1]);
					quantity = wholePart + numerator / denominator;
				}
			}
			// Parse simple fractions (e.g., "2/3")
			else if (quantityStr.includes('/')) {
				const parts = quantityStr.split('/');
				if (parts.length === 2) {
					const numerator = parseFloat(parts[0].trim());
					const denominator = parseFloat(parts[1].trim());
					quantity = numerator / denominator;
				}
			}
			// Parse decimals and whole numbers
			else {
				quantity = parseFloat(quantityStr);
			}
		}

		// Extract unit - look for unit words anywhere in the remaining string
		const unitMatch = cleaned.match(
			/\b(cups?|tbsps?|tablespoons?|tsps?|teaspoons?|ozs?|ounces?|lbs?|pounds?|grams?|kilograms?|kgs?|pieces?|whole|pinch|pinches|cans?|jars?|bottles?|packages?|bunches?|leaves?|sprigs?|sheets?|cloves?)\b/i
		);
		let unit: string | null = null;

		if (unitMatch) {
			unit = unitMatch[1].toLowerCase();
			// Remove the unit from the string
			cleaned = cleaned
				.replace(new RegExp('\\b' + unitMatch[1] + '\\b', 'i'), '')
				.trim();
		}

		return {
			name: cleaned || ingredientStr,
			quantity: quantity,
			unit: unit,
		};
	}
}
