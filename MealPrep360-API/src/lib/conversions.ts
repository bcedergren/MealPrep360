export class ConversionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ConversionError';
	}
}

export class ValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ValidationError';
	}
}

export function validateQuantity(quantity: number): boolean {
	return typeof quantity === 'number' && quantity > 0 && !isNaN(quantity);
}

export function validateUnitForCategory(
	unit: string,
	category: string
): boolean {
	// Basic validation - can be expanded
	const validUnits = [
		'g',
		'kg',
		'ml',
		'l',
		'cup',
		'tsp',
		'tbsp',
		'oz',
		'lb',
		'piece',
	];
	return validUnits.includes(unit.toLowerCase());
}

export function convertIngredientUnits(
	quantity: number,
	fromUnit: string,
	toUnit: string
): number {
	// Basic conversion factors
	const conversions: { [key: string]: { [key: string]: number } } = {
		g: { kg: 0.001, oz: 0.035274 },
		kg: { g: 1000, lb: 2.20462 },
		ml: { l: 0.001, cup: 0.00422675, tsp: 0.202884, tbsp: 0.067628 },
		l: { ml: 1000, cup: 4.22675 },
		cup: { ml: 236.588, tsp: 48, tbsp: 16 },
		tsp: { ml: 4.92892, tbsp: 0.333333 },
		tbsp: { ml: 14.7868, tsp: 3 },
		oz: { g: 28.3495, lb: 0.0625 },
		lb: { kg: 0.453592, oz: 16 },
	};

	const from = fromUnit.toLowerCase();
	const to = toUnit.toLowerCase();

	if (from === to) return quantity;

	if (conversions[from] && conversions[from][to]) {
		return quantity * conversions[from][to];
	}

	throw new ConversionError(`Cannot convert from ${fromUnit} to ${toUnit}`);
}

export function roundQuantity(quantity: number, precision: number = 2): number {
	return (
		Math.round(quantity * Math.pow(10, precision)) / Math.pow(10, precision)
	);
}

export function normalizeIngredientName(name: string): string {
	return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function convertToPreferredUnit(
	quantity: number,
	unit: string,
	category: string
): { quantity: number; unit: string } {
	// Simple preferred unit logic
	const preferredUnits: { [key: string]: string } = {
		Produce: 'piece',
		'Meat & Seafood': 'lb',
		Dairy: 'cup',
		Pantry: 'cup',
	};

	const preferred = preferredUnits[category] || unit;

	try {
		const convertedQuantity = convertIngredientUnits(quantity, unit, preferred);
		return { quantity: roundQuantity(convertedQuantity), unit: preferred };
	} catch (error) {
		return { quantity: roundQuantity(quantity), unit };
	}
}
