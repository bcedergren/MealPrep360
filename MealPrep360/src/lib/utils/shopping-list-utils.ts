export interface ShoppingListItem {
	_id: string;
	name: string;
	quantity: number;
	unit: string;
	category: string;
	status: 'PENDING' | 'COMPLETED';
	originalIndex?: number; // Track original position for API calls
	additionalQuantities?: { quantity: number; unit: string }[];
}

// Type for measurement system preference
type MeasurementSystem = 'metric' | 'imperial';

// Helper function to detect user's preferred measurement system
export const getUserMeasurementSystem = (): MeasurementSystem => {
	// Check browser locale first
	if (typeof navigator !== 'undefined') {
		const locale = navigator.language || navigator.languages?.[0];
		// US, Liberia, and Myanmar primarily use imperial
		if (
			locale?.startsWith('en-US') ||
			locale?.startsWith('en-LR') ||
			locale?.startsWith('my')
		) {
			return 'imperial';
		}
	}

	// Default to metric for most countries
	return 'metric';
};

// Convenience function that automatically detects measurement system
export const formatQuantityDisplayAuto = (item: ShoppingListItem): string => {
	return formatQuantityDisplay(item, getUserMeasurementSystem());
};

// Utility function to normalize shopping list items
export const normalizeShoppingListItems = (
	items: ShoppingListItem[]
): ShoppingListItem[] => {
	const normalizedItems = items.map((item, index) => {
		let { name, quantity, unit, category } = item;

		// Clean up item name
		name = name.trim();

		// Remove "N/A" prefixes
		if (name.startsWith('N/A ')) {
			name = name.substring(4);
		}

		// Remove common prefixes and descriptors
		const prefixesToRemove = [
			'large ',
			'medium ',
			'small ',
			'can ',
			'bunch ',
			'fresh ',
			'dried ',
			'frozen ',
			'ripe ',
			'boneless ',
			'skinless ',
			'grated ',
			'chopped ',
			'diced ',
			'peeled ',
			'unsalted ',
			'heavy ',
			'extra ',
			'virgin ',
			'whole ',
			'ground ',
			'minced ',
			'to taste ',
			'sheets ',
			'no-boil ',
			'cans ',
			'jar ',
			'bottle ',
			'package ',
			'tbsps ',
			'cups ',
			'pieces ',
			'cloves ',
			'stalks ',
			'leaves ',
		];

		// Remove prefixes at the beginning of the name
		for (const prefix of prefixesToRemove) {
			if (name.toLowerCase().startsWith(prefix.toLowerCase())) {
				name = name.substring(prefix.length).trim();
				break; // Only remove one prefix to avoid over-cleaning
			}
		}

		// Clean up specific problematic patterns
		name = name.replace(/^can\s+can\s+of\s+/gi, ''); // "can Can of white beans" -> "white beans"
		name = name.replace(/^can\s+of\s+/gi, ''); // "can of white beans" -> "white beans"
		name = name.replace(/^bunch\s+/gi, ''); // "bunch Kale" -> "Kale"
		name = name.replace(/\(\d+\s*oz\)/gi, ''); // Remove weight specifications in parentheses
		name = name.replace(/,\s*[^,]*$/gi, ''); // Remove trailing descriptors after comma

		// Normalize common ingredient names for better consolidation
		const ingredientMap: Record<string, string> = {
			// Beans
			'white beans': 'white beans',
			'black beans': 'black beans',
			'kidney beans': 'kidney beans',
			// Peppers
			'bell pepper': 'bell pepper',
			'red bell pepper': 'bell pepper',
			'yellow bell pepper': 'bell pepper',
			'green bell pepper': 'bell pepper',
			// Potatoes
			'sweet potato': 'sweet potato',
			'sweet potatoes': 'sweet potato',
			potato: 'potato',
			potatoes: 'potato',
			'russet potatoes': 'potato',
			// Onions
			onion: 'onion',
			onions: 'onion',
			'yellow onion': 'onion',
			'yellow onions': 'onion',
			'red onion': 'onion',
			// Squash
			zucchini: 'zucchini',
			'yellow squash': 'yellow squash',
			'butternut squash': 'butternut squash',
			// Garlic
			garlic: 'garlic',
			'garlic cloves': 'garlic',
			// Carrots
			carrot: 'carrot',
			carrots: 'carrot',
			// Celery
			celery: 'celery',
			'celery stalks': 'celery',
			// Herbs & Spices
			basil: 'basil',
			'fresh basil': 'basil',
			'bay leaves': 'bay leaves',
			thyme: 'thyme',
			'dried thyme': 'thyme',
			cilantro: 'cilantro',
			'fresh cilantro': 'cilantro',
			rosemary: 'rosemary',
			oregano: 'oregano',
			cumin: 'cumin',
			paprika: 'paprika',
			'italian seasoning': 'italian seasoning',
			coriander: 'coriander',
			ginger: 'ginger',
			'grated ginger': 'ginger',
			// Pantry items
			'olive oil': 'olive oil',
			quinoa: 'quinoa',
			salt: 'salt',
			'salt and pepper': 'salt',
			pepper: 'pepper',
			'black pepper': 'pepper',
			breadcrumbs: 'breadcrumbs',
			'panko breadcrumbs': 'breadcrumbs',
			// Sauces
			'marinara sauce': 'marinara sauce',
			'worcestershire sauce': 'worcestershire sauce',
			// Tomatoes
			'diced tomatoes': 'diced tomatoes',
			'can diced tomatoes': 'diced tomatoes',
			'cherry tomatoes': 'cherry tomatoes',
			'tomato paste': 'tomato paste',
			// Corn & Peas
			corn: 'corn',
			'frozen corn': 'corn',
			peas: 'peas',
			'frozen peas': 'peas',
			// Dairy
			'parmesan cheese': 'parmesan cheese',
			'grated parmesan cheese': 'parmesan cheese',
			'mozzarella cheese': 'mozzarella cheese',
			'ricotta cheese': 'ricotta cheese',
			'heavy cream': 'heavy cream',
			'sour cream': 'sour cream',
			butter: 'butter',
			'unsalted butter': 'butter',
			// Meat
			shrimp: 'shrimp',
			'large shrimp': 'shrimp',
			'chicken breast': 'chicken breast',
			'beef chuck': 'beef chuck',
			// Citrus
			lime: 'lime',
			'fresh lemon juice': 'lemon juice',
			// Mango
			mango: 'mango',
			'ripe mango': 'mango',
			// Avocado
			avocado: 'avocado',
			'ripe avocados': 'avocado',
			'ripe avocado': 'avocado',
			avocados: 'avocado',
			// Brussels sprouts
			'brussel sprouts': 'brussels sprouts',
			'brussels sprouts': 'brussels sprouts',
			// Broth
			'vegetable broth': 'vegetable broth',
			'beef broth': 'beef broth',
			'chicken broth': 'chicken broth',
			// Eggs
			egg: 'egg',
			'large egg': 'egg',
			eggs: 'egg',
			// Jalapeno
			jalapeno: 'jalapeno',
			jalapeño: 'jalapeno',
			// Taco shells
			'taco shells': 'taco shells',
			// Noodles
			'lasagna noodles': 'lasagna noodles',
			'no-boil lasagna noodles': 'lasagna noodles',
			// Skewers
			'bamboo skewers': 'bamboo skewers',
			// Flour
			'all-purpose flour': 'all-purpose flour',
			flour: 'all-purpose flour',
			// Greens
			spinach: 'spinach',
			kale: 'kale',
			// Additional chicken variations
			'boneless chicken breasts': 'chicken breast',
			'chicken breasts': 'chicken breast',
			'boneless chicken breast': 'chicken breast',
			'skinless chicken breasts': 'chicken breast',
			boneless: 'chicken breast', // Handle incomplete ingredient names
			// Additional cream variations
			cream: 'heavy cream',
		};

		// Apply ingredient normalization
		const lowerName = name.toLowerCase();
		if (ingredientMap[lowerName]) {
			name = ingredientMap[lowerName];
		}

		// Fix common unit errors
		const unitCorrections: Record<
			string,
			{ correctUnit: string; ingredientPattern?: RegExp }
		> = {
			// Liquids that should not be "pieces"
			'vegetable broth': { correctUnit: 'cups' },
			'beef broth': { correctUnit: 'cups' },
			'chicken broth': { correctUnit: 'cups' },
			'olive oil': { correctUnit: 'tbsp' },
			'marinara sauce': { correctUnit: 'cups' },
			'sour cream': { correctUnit: 'cups' },
			'heavy cream': { correctUnit: 'cups' },
			// Spices that should be tsp/tbsp
			'italian seasoning': { correctUnit: 'tsp' },
			oregano: { correctUnit: 'tsp' },
			basil: { correctUnit: 'tsp' },
			thyme: { correctUnit: 'tsp' },
			cumin: { correctUnit: 'tsp' },
			paprika: { correctUnit: 'tsp' },
			pepper: { correctUnit: 'tsp' },
			salt: { correctUnit: 'tsp' },
			// Weight measurements
			'all-purpose flour': { correctUnit: 'cups' },
			breadcrumbs: { correctUnit: 'cups' },
		};

		// Apply unit corrections
		const lowerIngredientName = name.toLowerCase();
		if (unitCorrections[lowerIngredientName]) {
			const correction = unitCorrections[lowerIngredientName];
			if (unit === 'pieces' || unit === 'piece') {
				unit = correction.correctUnit;
			}
		}

		// Fix category assignments
		const categoryCorrections: Record<string, string> = {
			// Pantry items
			'olive oil': 'Pantry',
			salt: 'Pantry',
			pepper: 'Pantry',
			'black pepper': 'Pantry',
			'all-purpose flour': 'Pantry',
			'vegetable broth': 'Pantry',
			'beef broth': 'Pantry',
			'chicken broth': 'Pantry',
			'marinara sauce': 'Pantry',
			'worcestershire sauce': 'Pantry',
			breadcrumbs: 'Pantry',
			'panko breadcrumbs': 'Pantry',
			'lasagna noodles': 'Pantry',
			'taco shells': 'Pantry',
			'bamboo skewers': 'Pantry',
			quinoa: 'Pantry',
			// Spices & Herbs
			oregano: 'Spices',
			basil: 'Spices',
			'fresh basil': 'Spices',
			thyme: 'Spices',
			'dried thyme': 'Spices',
			'bay leaves': 'Spices',
			cumin: 'Spices',
			paprika: 'Spices',
			'italian seasoning': 'Spices',
			rosemary: 'Spices',
			ginger: 'Spices',
			'grated ginger': 'Spices',
			coriander: 'Spices',
			cilantro: 'Spices',
			'fresh cilantro': 'Spices',
			// Produce
			onion: 'Produce',
			garlic: 'Produce',
			'garlic cloves': 'Produce',
			carrot: 'Produce',
			carrots: 'Produce',
			celery: 'Produce',
			'celery stalks': 'Produce',
			'bell pepper': 'Produce',
			'red bell pepper': 'Produce',
			potato: 'Produce',
			'sweet potato': 'Produce',
			zucchini: 'Produce',
			'yellow squash': 'Produce',
			'butternut squash': 'Produce', // Fixed from Dairy
			'tomato paste': 'Produce',
			'diced tomatoes': 'Produce',
			'can diced tomatoes': 'Produce',
			'cherry tomatoes': 'Produce',
			spinach: 'Produce',
			kale: 'Produce',
			mango: 'Produce',
			'ripe mango': 'Produce',
			lime: 'Produce',
			'fresh lemon juice': 'Produce',
			jalapeno: 'Produce',
			avocado: 'Produce',
			'brussels sprouts': 'Produce',
			// Frozen
			corn: 'Frozen',
			'frozen corn': 'Frozen',
			peas: 'Frozen',
			'frozen peas': 'Frozen',
			// Dairy
			butter: 'Dairy',
			'unsalted butter': 'Dairy',
			'heavy cream': 'Dairy',
			'sour cream': 'Dairy',
			'mozzarella cheese': 'Dairy',
			'parmesan cheese': 'Dairy',
			'grated parmesan cheese': 'Dairy',
			'ricotta cheese': 'Dairy',
			egg: 'Dairy',
			// Meat & Seafood
			'beef chuck': 'Meat & Seafood',
			'chicken breast': 'Meat & Seafood',
			boneless: 'Meat & Seafood',
			shrimp: 'Meat & Seafood',
			'large shrimp': 'Meat & Seafood',
			// Pantry (beans)
			'white beans': 'Pantry',
			'black beans': 'Pantry',
			'kidney beans': 'Pantry',
		};

		// Apply category corrections
		if (categoryCorrections[lowerIngredientName]) {
			category = categoryCorrections[lowerIngredientName];
		}

		// Handle units embedded in ingredient names
		const unitPatterns = [
			// Volume units
			{ patterns: ['cups ', 'cup '], unit: 'cups', singular: 'cup' },
			{
				patterns: ['tablespoons ', 'tablespoon ', 'tbsp '],
				unit: 'tablespoons',
				singular: 'tablespoon',
			},
			{
				patterns: ['teaspoons ', 'teaspoon ', 'tsp '],
				unit: 'teaspoons',
				singular: 'teaspoon',
			},
			{ patterns: ['ml ', 'milliliters '], unit: 'ml', singular: 'ml' },
			{
				patterns: ['liters ', 'liter ', 'l '],
				unit: 'liters',
				singular: 'liter',
			},
			{
				patterns: ['ounces ', 'ounce ', 'oz '],
				unit: 'ounces',
				singular: 'ounce',
			},

			// Weight units
			{
				patterns: ['pounds ', 'pound ', 'lbs ', 'lb '],
				unit: 'pounds',
				singular: 'pound',
			},
			{ patterns: ['grams ', 'gram ', 'g '], unit: 'grams', singular: 'gram' },
			{
				patterns: ['kilograms ', 'kilogram ', 'kg '],
				unit: 'kilograms',
				singular: 'kilogram',
			},

			// Other units
			{ patterns: ['pieces ', 'piece '], unit: 'pieces', singular: 'piece' },
			{ patterns: ['cloves ', 'clove '], unit: 'cloves', singular: 'clove' },
			{ patterns: ['leaves ', 'leaf '], unit: 'leaves', singular: 'leaf' },
		];

		// Check if any unit pattern is at the beginning of the name
		for (const unitDef of unitPatterns) {
			for (const pattern of unitDef.patterns) {
				if (name.toLowerCase().startsWith(pattern.toLowerCase())) {
					// Extract the ingredient name without the unit
					name = name.substring(pattern.length).trim();

					// Update the unit if it was previously 'piece' or doesn't make sense
					if (unit === 'piece' || unit === 'pieces') {
						unit = quantity === 1 ? unitDef.singular : unitDef.unit;
					}
					break;
				}
			}
		}

		// Clean up remaining unit inconsistencies
		if (unit === 'piece' && name.toLowerCase().includes('pieces')) {
			name = name.replace(/pieces?\s*/gi, '').trim();
		}

		// Final cleanup - capitalize first letter
		name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

		// Normalize units to prevent duplicates
		const unitNormalizations: Record<string, string> = {
			pieces: 'piece',
			cloves: 'clove',
			stalks: 'stalk',
			leaves: 'leaf',
			cups: 'cup',
			tablespoons: 'tbsp',
			tablespoon: 'tbsp',
			teaspoons: 'tsp',
			teaspoon: 'tsp',
			ounces: 'oz',
			ounce: 'oz',
			pounds: 'lb',
			lbs: 'lb',
		};

		if (unitNormalizations[unit.toLowerCase()]) {
			unit = unitNormalizations[unit.toLowerCase()];
		}

		// Normalize category names
		const categoryMap: Record<string, string> = {
			'Meat & Seafood': 'Meat & Seafood',
			Produce: 'Produce',
			Dairy: 'Dairy',
			Pantry: 'Pantry',
			Other: 'Other',
			Bakery: 'Bakery',
			Frozen: 'Frozen',
			Beverages: 'Beverages',
			Snacks: 'Snacks',
			Condiments: 'Condiments',
			Spices: 'Spices',
			Grains: 'Grains',
			Legumes: 'Legumes',
			'Nuts & Seeds': 'Nuts & Seeds',
			'Oils & Vinegars': 'Oils & Vinegars',
		};

		category = categoryMap[category] || category;

		return {
			...item,
			// Generate a unique _id if one doesn't exist, and store the original index
			_id:
				item._id ||
				`item-${Date.now()}-${index}-${name.replace(/\s+/g, '-').toLowerCase()}`,
			originalIndex: index, // Store the original index for API calls
			name,
			quantity,
			unit,
			category,
		};
	});

	// Consolidate duplicate items with more aggressive matching
	const consolidatedItems = normalizedItems.reduce(
		(acc, item) => {
			// Create a more flexible key for consolidation
			const normalizedName = item.name.toLowerCase().trim();
			const normalizedUnit = item.unit.toLowerCase().trim();

			// Try to find existing item with same name and compatible unit
			let existingKey = null;
			for (const key in acc) {
				const [existingName, existingUnit] = key.split('|||');
				if (existingName === normalizedName) {
					// Same ingredient name - check if units are compatible
					if (
						existingUnit === normalizedUnit ||
						// Singular/plural forms
						(existingUnit === 'piece' && normalizedUnit === 'pieces') ||
						(existingUnit === 'pieces' && normalizedUnit === 'piece') ||
						(existingUnit === 'clove' && normalizedUnit === 'cloves') ||
						(existingUnit === 'cloves' && normalizedUnit === 'clove') ||
						(existingUnit === 'leaf' && normalizedUnit === 'leaves') ||
						(existingUnit === 'leaves' && normalizedUnit === 'leaf') ||
						// Volume measurements
						(existingUnit === 'cup' && normalizedUnit === 'cups') ||
						(existingUnit === 'cups' && normalizedUnit === 'cup') ||
						(existingUnit === 'tbsp' && normalizedUnit === 'tablespoon') ||
						(existingUnit === 'tablespoon' && normalizedUnit === 'tbsp') ||
						(existingUnit === 'tsp' && normalizedUnit === 'teaspoon') ||
						(existingUnit === 'teaspoon' && normalizedUnit === 'tsp') ||
						// Weight measurements
						(existingUnit === 'oz' && normalizedUnit === 'ounce') ||
						(existingUnit === 'ounce' && normalizedUnit === 'oz') ||
						(existingUnit === 'lb' && normalizedUnit === 'lbs') ||
						(existingUnit === 'lbs' && normalizedUnit === 'lb') ||
						(existingUnit === 'pound' && normalizedUnit === 'pounds') ||
						(existingUnit === 'pounds' && normalizedUnit === 'pound') ||
						// When units are both very generic, consolidate anyway
						(existingUnit === '' && normalizedUnit === '') ||
						// Treat empty/generic units as compatible with piece
						((existingUnit === '' ||
							existingUnit === 'piece' ||
							existingUnit === 'pieces') &&
							(normalizedUnit === '' ||
								normalizedUnit === 'piece' ||
								normalizedUnit === 'pieces'))
					) {
						existingKey = key;
						break;
					}
				}
			}

			const key =
				existingKey ||
				`${normalizedName}|||${normalizedUnit}|||${item.category}`;

			if (acc[key]) {
				// Merge quantities for duplicate items
				acc[key].quantity += item.quantity;
				// Use the more specific unit name if available
				if (item.unit.length > acc[key].unit.length) {
					acc[key].unit = item.unit;
				}
				// Merge additional quantities if they exist
				if (item.additionalQuantities && item.additionalQuantities.length > 0) {
					if (!acc[key].additionalQuantities) {
						acc[key].additionalQuantities = [];
					}
					acc[key].additionalQuantities.push(...item.additionalQuantities);
				}
			} else {
				acc[key] = item;
			}

			return acc;
		},
		{} as Record<string, ShoppingListItem>
	);

	return Object.values(consolidatedItems);
};

// Unit conversion utilities
const convertToPreferredSystem = (
	quantity: number,
	unit: string,
	measurementSystem: MeasurementSystem
): { quantity: number; unit: string } => {
	// If already in preferred system, return as-is
	if (measurementSystem === 'imperial') {
		// Convert metric to imperial
		switch (unit.toLowerCase()) {
			case 'ml':
			case 'milliliters':
				if (quantity >= 473) {
					// Convert to cups (1 cup = 237ml, but using 240ml for cooking convenience)
					return { quantity: quantity / 240, unit: 'cups' };
				} else if (quantity >= 15) {
					// Convert to tablespoons (1 tbsp = 15ml)
					return { quantity: quantity / 15, unit: 'tablespoons' };
				} else {
					// Convert to teaspoons (1 tsp = 5ml)
					return { quantity: quantity / 5, unit: 'teaspoons' };
				}
			case 'l':
			case 'liter':
			case 'liters':
				return { quantity: quantity * 4.227, unit: 'cups' }; // 1L = ~4.2 cups
			case 'g':
			case 'gram':
			case 'grams':
				if (quantity >= 454) {
					// Convert to pounds (1 lb = 454g)
					return { quantity: quantity / 454, unit: 'pounds' };
				} else {
					// Convert to ounces (1 oz = 28.35g)
					return { quantity: quantity / 28.35, unit: 'ounces' };
				}
			case 'kg':
			case 'kilogram':
			case 'kilograms':
				return { quantity: quantity * 2.205, unit: 'pounds' }; // 1kg = 2.205 lbs
		}
	} else {
		// Convert imperial to metric
		switch (unit.toLowerCase()) {
			case 'cup':
			case 'cups':
				return { quantity: quantity * 240, unit: 'ml' }; // 1 cup = 240ml
			case 'tablespoon':
			case 'tablespoons':
			case 'tbsp':
				return { quantity: quantity * 15, unit: 'ml' }; // 1 tbsp = 15ml
			case 'teaspoon':
			case 'teaspoons':
			case 'tsp':
				return { quantity: quantity * 5, unit: 'ml' }; // 1 tsp = 5ml
			case 'ounce':
			case 'ounces':
			case 'oz':
				return { quantity: quantity * 28.35, unit: 'grams' }; // 1 oz = 28.35g
			case 'pound':
			case 'pounds':
			case 'lb':
			case 'lbs':
				return { quantity: quantity * 454, unit: 'grams' }; // 1 lb = 454g
		}
	}

	// If no conversion needed or unit not recognized, return original
	return { quantity, unit };
};

// Helper function to convert decimal to fraction
const decimalToFraction = (decimal: number): string => {
	// Round very small differences to whole numbers
	if (Math.abs(decimal - Math.round(decimal)) < 0.05) {
		return Math.round(decimal).toString();
	}

	const wholePart = Math.floor(decimal);
	const fractionalPart = decimal - wholePart;

	// Common cooking fractions with tolerance
	const fractions = [
		{ decimal: 0.125, fraction: '1/8' },
		{ decimal: 0.25, fraction: '1/4' },
		{ decimal: 0.333, fraction: '1/3' },
		{ decimal: 0.375, fraction: '3/8' },
		{ decimal: 0.5, fraction: '1/2' },
		{ decimal: 0.625, fraction: '5/8' },
		{ decimal: 0.667, fraction: '2/3' },
		{ decimal: 0.75, fraction: '3/4' },
		{ decimal: 0.875, fraction: '7/8' },
	];

	// Find the closest fraction
	let closestFraction = null;
	let minDifference = Infinity;

	for (const frac of fractions) {
		const difference = Math.abs(fractionalPart - frac.decimal);
		if (difference < minDifference && difference < 0.08) {
			// 0.08 tolerance
			minDifference = difference;
			closestFraction = frac.fraction;
		}
	}

	if (closestFraction) {
		return wholePart > 0 ? `${wholePart} ${closestFraction}` : closestFraction;
	}

	// If no close fraction found, round to one decimal place
	const rounded = Math.round(decimal * 10) / 10;
	return rounded.toString();
};

// Utility function to format quantity and unit display
export const formatQuantityDisplay = (
	item: ShoppingListItem,
	measurementSystem: MeasurementSystem = 'imperial'
): string => {
	// Convert to preferred measurement system
	const converted = convertToPreferredSystem(
		item.quantity,
		item.unit,
		measurementSystem
	);
	const { quantity, unit } = converted;

	// Convert quantity to fraction format
	const fractionQuantity = decimalToFraction(quantity);
	const numericQuantity = parseFloat(fractionQuantity) || quantity;

	// Handle different unit types with proper singular/plural forms
	const formatWithUnit = (singular: string, plural: string) => {
		return numericQuantity === 1 && !fractionQuantity.includes(' ')
			? `1 ${singular}`
			: `${fractionQuantity} ${plural}`;
	};

	// Volume units
	if (unit === 'cup' || unit === 'cups') {
		return formatWithUnit('cup', 'cups');
	}

	if (unit === 'tablespoon' || unit === 'tablespoons' || unit === 'tbsp') {
		return formatWithUnit('tbsp', 'tbsp');
	}

	if (unit === 'teaspoon' || unit === 'teaspoons' || unit === 'tsp') {
		return formatWithUnit('tsp', 'tsp');
	}

	if (unit === 'ml' || unit === 'milliliters') {
		return quantity >= 1000
			? `${decimalToFraction(quantity / 1000)} L`
			: `${fractionQuantity}ml`;
	}

	if (unit === 'liter' || unit === 'liters' || unit === 'l') {
		return formatWithUnit('L', 'L');
	}

	if (unit === 'ounce' || unit === 'ounces' || unit === 'oz') {
		return formatWithUnit('oz', 'oz');
	}

	// Weight units
	if (unit === 'gram' || unit === 'grams' || unit === 'g') {
		return quantity >= 1000
			? `${decimalToFraction(quantity / 1000)} kg`
			: `${fractionQuantity}g`;
	}

	if (unit === 'kilogram' || unit === 'kilograms' || unit === 'kg') {
		return formatWithUnit('kg', 'kg');
	}

	if (
		unit === 'pound' ||
		unit === 'pounds' ||
		unit === 'lb' ||
		unit === 'lbs'
	) {
		return formatWithUnit('lb', 'lbs');
	}

	// Count units
	if (unit === 'piece' || unit === 'pieces') {
		return formatWithUnit('piece', 'pieces');
	}

	if (unit === 'clove' || unit === 'cloves') {
		return formatWithUnit('clove', 'cloves');
	}

	if (unit === 'leaf' || unit === 'leaves') {
		return formatWithUnit('leaf', 'leaves');
	}

	// Default case - use the unit as provided
	return `${fractionQuantity} ${unit}`;
};

// Utility function to group items by category
export const groupItemsByCategory = (
	items: ShoppingListItem[]
): Record<string, ShoppingListItem[]> => {
	return items.reduce(
		(acc, item) => {
			const category = item.category || 'Other';
			if (!acc[category]) {
				acc[category] = [];
			}
			acc[category].push(item);
			return acc;
		},
		{} as Record<string, ShoppingListItem[]>
	);
};
