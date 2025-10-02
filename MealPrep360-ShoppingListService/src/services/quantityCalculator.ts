import { Category } from '../types/categories';
import { Unit } from '../types/units';

export interface IQuantityCalculator {
	roundToFriendlyFraction(quantity: number): number;
	getDefaultAmount(
		name: string,
		category: Category
	): { amount: number; unit: Unit };
}

export class QuantityCalculator implements IQuantityCalculator {
	private readonly defaultAmounts: Record<
		string,
		{ amount: number; unit: Unit }
	> = {
		// Seafood
		shrimp: { amount: 1, unit: 'lb' },
		prawns: { amount: 1, unit: 'lb' },
		salmon: { amount: 1, unit: 'lb' },
		tuna: { amount: 1, unit: 'piece' }, // assuming canned
		fish: { amount: 1, unit: 'lb' },

		// Grains
		quinoa: { amount: 1, unit: 'cup' },
		rice: { amount: 1, unit: 'cup' },
		pasta: { amount: 1, unit: 'lb' },
		couscous: { amount: 1, unit: 'cup' },
		barley: { amount: 1, unit: 'cup' },
		oats: { amount: 1, unit: 'cup' },

		// Meat
		chicken: { amount: 1, unit: 'lb' },
		beef: { amount: 1, unit: 'lb' },
		pork: { amount: 1, unit: 'lb' },
		turkey: { amount: 1, unit: 'lb' },

		// Vegetables (for bulk items)
		spinach: { amount: 1, unit: 'piece' }, // bunch
		kale: { amount: 1, unit: 'piece' }, // bunch
		arugula: { amount: 1, unit: 'piece' }, // bunch
		'mixed greens': { amount: 1, unit: 'piece' }, // bunch

		// Nuts and seeds
		almonds: { amount: 1, unit: 'cup' },
		walnuts: { amount: 1, unit: 'cup' },
		pecans: { amount: 1, unit: 'cup' },
		cashews: { amount: 1, unit: 'cup' },
		'sunflower seeds': { amount: 0.5, unit: 'cup' },
		'pumpkin seeds': { amount: 0.5, unit: 'cup' },
		'chia seeds': { amount: 0.25, unit: 'cup' },
		'flax seeds': { amount: 0.25, unit: 'cup' },
	};

	private readonly categoryDefaults: Record<
		Category,
		{ amount: number; unit: Unit }
	> = {
		Seafood: { amount: 1, unit: 'lb' },
		Pantry: { amount: 1, unit: 'piece' }, // assuming canned/packaged
		Meat: { amount: 1, unit: 'lb' },
		Produce: { amount: 1, unit: 'piece' },
		Dairy: { amount: 1, unit: 'piece' },
		Spices: { amount: 1, unit: 'tsp' },
		Bakery: { amount: 1, unit: 'piece' },
		Frozen: { amount: 1, unit: 'piece' },
		Other: { amount: 1, unit: 'piece' },
	};

	roundToFriendlyFraction(quantity: number): number {
		// If it's a very small amount, round to the nearest quarter
		if (quantity < 0.125) {
			return 0.25; // Round up to 1/4 minimum for usability
		}

		// Common fractions for easier shopping
		const fractions = [
			{ decimal: 0.25, display: 0.25 }, // 1/4
			{ decimal: 0.333, display: 0.33 }, // 1/3 (rounded)
			{ decimal: 0.5, display: 0.5 }, // 1/2
			{ decimal: 0.667, display: 0.67 }, // 2/3 (rounded)
			{ decimal: 0.75, display: 0.75 }, // 3/4
		];

		// If it's close to a whole number, round to nearest integer
		if (Math.abs(quantity - Math.round(quantity)) < 0.15) {
			return Math.round(quantity);
		}

		// For numbers > 1, check whole + fraction combinations
		if (quantity > 1) {
			const wholePart = Math.floor(quantity);
			const fracPart = quantity - wholePart;

			// Check if the fractional part is close to a common fraction
			for (const fraction of fractions) {
				if (Math.abs(fracPart - fraction.decimal) < 0.1) {
					return wholePart + fraction.display;
				}
			}

			// For larger amounts, prefer rounding to nearest 0.5
			if (quantity > 3) {
				return Math.round(quantity * 2) / 2; // Round to nearest half
			}
		}

		// For small fractions, check if close to common fractions
		for (const fraction of fractions) {
			if (Math.abs(quantity - fraction.decimal) < 0.08) {
				return fraction.display;
			}
		}

		// For larger numbers, round to one decimal place to avoid complex fractions
		if (quantity > 5) {
			return Math.round(quantity * 10) / 10;
		}

		// Default: round to quarter increments for practical shopping
		return Math.round(quantity * 4) / 4;
	}

	getDefaultAmount(
		name: string,
		category: Category
	): { amount: number; unit: Unit } {
		const lowerName = name.toLowerCase();

		// Check for exact matches first
		if (this.defaultAmounts[lowerName]) {
			return this.defaultAmounts[lowerName];
		}

		// Check for partial matches
		for (const [key, defaultAmount] of Object.entries(this.defaultAmounts)) {
			if (lowerName.includes(key) || key.includes(lowerName)) {
				return defaultAmount;
			}
		}

		// If no match found, use a reasonable default based on category
		return this.categoryDefaults[category];
	}
}
