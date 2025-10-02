import { Category } from '../types';
import { normalizeIngredient } from './ingredientService';

const SEAFOOD_TERMS = [
	'fish',
	'salmon',
	'tuna',
	'shrimp',
	'seafood',
	'crab',
	'lobster',
	'tilapia',
	'cod',
	'halibut',
	'mahi',
	'bass',
	'trout',
	'mackerel',
	'sardines',
	'anchovies',
	'oysters',
	'mussels',
	'clams',
	'scallops',
	'calamari',
	'squid',
	'octopus',
	'prawns',
];

/**
 * Normalizes an ingredient's category based on its name and current category.
 * This is the single source of truth for category normalization in the application.
 */
export async function normalizeIngredientCategory(
	name: string,
	existingCategory?: string
): Promise<Category> {
	console.log('Normalizing ingredient category:', {
		name,
		existingCategory,
	});

	// First try to find the category from ingredient reference
	const normalizedIngredient = await normalizeIngredient(name);
	if (normalizedIngredient) {
		console.log('Found normalized ingredient:', {
			name,
			category: normalizedIngredient.category,
		});
		return normalizedIngredient.category;
	}

	// Handle "Meat & Seafood" case and variations
	if (
		existingCategory &&
		(existingCategory === 'Meat & Seafood' ||
			(existingCategory.includes('Meat') &&
				existingCategory.includes('Seafood')))
	) {
		const lowercaseIngredient = name.toLowerCase();
		const isSeafood = SEAFOOD_TERMS.some((term) =>
			lowercaseIngredient.includes(term)
		);
		const category = isSeafood ? 'Seafood' : 'Meat';

		console.log('Normalized Meat & Seafood category:', {
			name,
			originalCategory: existingCategory,
			normalizedCategory: category,
			isSeafood,
		});

		return category;
	}

	// If no reference found, use the existing logic
	const lowercaseName = name.toLowerCase();

	// PRIORITY 1: Handle compound terms that override individual keywords
	// These must be checked FIRST before any individual keyword matching

	// Broths and stocks (ALWAYS Pantry, regardless of meat type)
	if (lowercaseName.includes('broth') || lowercaseName.includes('stock')) {
		return 'Pantry';
	}

	// All oils (ALWAYS Pantry)
	if (lowercaseName.includes('oil')) {
		return 'Pantry';
	}

	// Canned/processed products (ALWAYS Pantry)
	if (
		lowercaseName.includes('can ') ||
		lowercaseName.includes('canned ') ||
		lowercaseName.includes('jar ') ||
		lowercaseName.includes('bottle ')
	) {
		return 'Pantry';
	}

	// Processed tomato products (Pantry, not Produce)
	if (
		lowercaseName.includes('tomato sauce') ||
		lowercaseName.includes('tomato paste') ||
		lowercaseName.includes('marinara sauce') ||
		lowercaseName.includes('diced tomatoes') ||
		lowercaseName.includes('crushed tomatoes') ||
		lowercaseName.includes('tomato puree')
	) {
		return 'Pantry';
	}

	// Sauces and juices (ALWAYS Pantry)
	if (
		lowercaseName.includes('sauce') ||
		lowercaseName.includes('worcestershire') ||
		lowercaseName.includes('soy sauce') ||
		lowercaseName.includes('hot sauce') ||
		lowercaseName.includes('juice')
	) {
		return 'Pantry';
	}

	// Vinegars (ALWAYS Pantry)
	if (lowercaseName.includes('vinegar')) {
		return 'Pantry';
	}

	// Frozen items (ALWAYS Frozen)
	if (lowercaseName.includes('frozen')) {
		return 'Frozen';
	}

	// Spices and seasonings (ALWAYS Spices)
	if (
		lowercaseName.includes('extract') ||
		lowercaseName.includes('powder') ||
		lowercaseName.includes('seasoning') ||
		lowercaseName.includes('italian seasoning') ||
		lowercaseName.includes('bay leaves') ||
		lowercaseName.includes('dried') ||
		lowercaseName.includes('ground') ||
		lowercaseName.includes('spice') ||
		lowercaseName === 'salt' ||
		lowercaseName === 'pepper' ||
		lowercaseName === 'black pepper' ||
		lowercaseName.includes('salt and pepper') ||
		lowercaseName === 'basil' ||
		lowercaseName === 'oregano' ||
		lowercaseName === 'thyme' ||
		lowercaseName === 'rosemary' ||
		lowercaseName === 'cumin' ||
		lowercaseName === 'paprika' ||
		lowercaseName === 'coriander' ||
		lowercaseName === 'fresh basil' ||
		lowercaseName === 'fresh oregano' ||
		lowercaseName === 'fresh thyme' ||
		lowercaseName === 'fresh rosemary' ||
		lowercaseName === 'rosemary sprigs' ||
		lowercaseName === 'fresh coriander' ||
		lowercaseName === 'fresh herbs' ||
		lowercaseName === 'herbs'
	) {
		return 'Spices';
	}

	// Canned/dried beans (ALWAYS Pantry)
	if (
		lowercaseName.includes('beans') ||
		lowercaseName.includes('lentils') ||
		lowercaseName.includes('chickpeas')
	) {
		return 'Pantry';
	}

	// Rice and grain products (ALWAYS Pantry)
	if (
		lowercaseName.includes('rice') ||
		lowercaseName.includes('quinoa') ||
		lowercaseName.includes('barley') ||
		lowercaseName.includes('oats') ||
		lowercaseName.includes('couscous')
	) {
		return 'Pantry';
	}

	// Nuts and seeds (ALWAYS Pantry)
	if (
		lowercaseName.includes('nuts') ||
		lowercaseName.includes('almonds') ||
		lowercaseName.includes('walnuts') ||
		lowercaseName.includes('pecans') ||
		lowercaseName.includes('cashews') ||
		lowercaseName.includes('seeds')
	) {
		return 'Pantry';
	}

	// Pasta products (ALWAYS Pantry, even whole wheat pasta)
	if (
		lowercaseName.includes('pasta') ||
		lowercaseName.includes('noodles') ||
		lowercaseName.includes('spaghetti') ||
		lowercaseName.includes('penne') ||
		lowercaseName.includes('rigatoni') ||
		lowercaseName.includes('fettuccine') ||
		lowercaseName.includes('linguine') ||
		lowercaseName.includes('macaroni') ||
		lowercaseName.includes('lasagna')
	) {
		return 'Pantry';
	}

	// Breadcrumbs and flour (ALWAYS Pantry)
	if (
		lowercaseName.includes('breadcrumbs') ||
		lowercaseName.includes('bread crumbs') ||
		lowercaseName.includes('flour') ||
		lowercaseName.includes('cornstarch') ||
		lowercaseName.includes('baking powder') ||
		lowercaseName.includes('baking soda')
	) {
		return 'Pantry';
	}

	// Dairy products
	if (
		lowercaseName.includes('milk') ||
		lowercaseName.includes('cream') ||
		lowercaseName.includes('cheese') ||
		lowercaseName.includes('yogurt') ||
		lowercaseName.includes('butter') ||
		lowercaseName.includes('sour cream') ||
		lowercaseName.includes('buttermilk')
	) {
		return 'Dairy';
	}

	// Meat products
	if (
		lowercaseName.includes('beef') ||
		lowercaseName.includes('chicken') ||
		lowercaseName.includes('pork') ||
		lowercaseName.includes('lamb') ||
		lowercaseName.includes('turkey') ||
		lowercaseName.includes('meat') ||
		lowercaseName.includes('steak') ||
		lowercaseName.includes('bacon') ||
		lowercaseName.includes('sausage') ||
		lowercaseName.includes('ground')
	) {
		return 'Meat';
	}

	// Seafood products
	if (SEAFOOD_TERMS.some((term) => lowercaseName.includes(term))) {
		return 'Seafood';
	}

	// Bakery products
	if (
		lowercaseName.includes('bread') ||
		lowercaseName.includes('bun') ||
		lowercaseName.includes('roll') ||
		lowercaseName.includes('bagel') ||
		lowercaseName.includes('croissant') ||
		lowercaseName.includes('pastry') ||
		lowercaseName.includes('muffin') ||
		lowercaseName.includes('cake')
	) {
		return 'Bakery';
	}

	// If no specific category found and we have an existing category that's valid, use it
	if (existingCategory && existingCategory !== 'Meat & Seafood') {
		const validCategories: Category[] = [
			'Produce',
			'Dairy',
			'Meat',
			'Seafood',
			'Pantry',
			'Spices',
			'Bakery',
			'Frozen',
			'Other',
		];
		if (validCategories.includes(existingCategory as Category)) {
			return existingCategory as Category;
		}
	}

	// Default to Other if no specific category found
	return 'Other';
}
