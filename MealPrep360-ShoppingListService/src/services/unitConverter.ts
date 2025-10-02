import { Unit } from '../types/units';

export interface IUnitConverter {
	convert(amount: number, fromUnit: string, toUnit: string): number;
	normalizeUnit(unit: string | null): Unit;
}

export class UnitConverter implements IUnitConverter {
	private readonly unitMap: Record<string, Unit> = {
		// Count/pieces
		piece: 'piece',
		pieces: 'piece',
		pcs: 'piece',
		pc: 'piece',
		whole: 'whole',
		item: 'piece',
		items: 'piece',
		each: 'piece',
		head: 'piece',
		heads: 'piece',
		clove: 'piece',
		cloves: 'piece',
		bulb: 'piece',
		bulbs: 'piece',
		stalk: 'piece',
		stalks: 'piece',
		sheet: 'piece',
		sheets: 'piece',
		slice: 'piece',
		slices: 'piece',

		// Volume - cups
		cup: 'cup',
		cups: 'cup',
		c: 'cup',

		// Volume - tablespoons
		tablespoon: 'tbsp',
		tablespoons: 'tbsp',
		tbsp: 'tbsp',
		tbsps: 'tbsp',
		tb: 'tbsp',

		// Volume - teaspoons
		teaspoon: 'tsp',
		teaspoons: 'tsp',
		tsp: 'tsp',
		ts: 'tsp',
		t: 'tsp',

		// Weight - ounces
		ounce: 'oz',
		ounces: 'oz',
		oz: 'oz',

		// Weight - grams
		gram: 'g',
		grams: 'g',
		g: 'g',

		// Weight - kilograms
		kilogram: 'kg',
		kilograms: 'kg',
		kg: 'kg',

		// Weight - pounds
		pound: 'lb',
		pounds: 'lb',
		lb: 'lb',
		lbs: 'lb',

		// Volume - milliliters
		milliliter: 'ml',
		milliliters: 'ml',
		ml: 'ml',

		// Volume - liters
		liter: 'l',
		liters: 'l',
		l: 'l',

		// Special units
		can: 'piece',
		cans: 'piece',
		jar: 'piece',
		jars: 'piece',
		bottle: 'piece',
		bottles: 'piece',
		package: 'piece',
		packages: 'piece',
		pkg: 'piece',
		container: 'piece',
		containers: 'piece',
		box: 'piece',
		boxes: 'piece',
		bag: 'piece',
		bags: 'piece',

		bunch: 'piece',
		bunches: 'piece',
		bundle: 'piece',
		bundles: 'piece',

		// Special small amounts
		pinch: 'pinch',
		pinches: 'pinch',
		dash: 'pinch',
		dashes: 'pinch',
		sprinkle: 'pinch',
	};

	private readonly conversions: Record<string, Record<string, number>> = {
		// To grams
		gram: {
			kilogram: 1000,
			kg: 1000,
		},
		// To cups
		cup: {
			liter: 4.227, // 1 liter ≈ 4.227 cups
			l: 4.227,
			milliliter: 0.004227, // 1 ml ≈ 0.004227 cups
			ml: 0.004227,
			pint: 2, // 1 pint = 2 cups
			quart: 4, // 1 quart = 4 cups
			gallon: 16, // 1 gallon = 16 cups
			'fluid ounce': 0.125, // 1 fl oz = 0.125 cups
			'fl oz': 0.125,
		},
		// To teaspoons
		teaspoon: {
			pinch: 0.125, // 1 pinch ≈ 1/8 teaspoon
			dash: 0.125,
		},
	};

	convert(amount: number, fromUnit: string, toUnit: string): number {
		if (fromUnit === toUnit) return amount;

		const conversion = this.conversions[toUnit]?.[fromUnit];
		if (conversion) {
			return amount * conversion;
		}

		return amount; // No conversion available
	}

	normalizeUnit(unit: string | null): Unit {
		if (!unit) return 'piece';
		const lowerUnit = unit.toLowerCase().trim();
		return this.unitMap[lowerUnit] || 'piece';
	}
}
