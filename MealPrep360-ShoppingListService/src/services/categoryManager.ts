import { Category } from '../types/categories';

export interface ICategoryManager {
	normalizeCategory(
		name: string,
		existingCategory?: Category
	): Promise<Category>;
}

export class CategoryManager implements ICategoryManager {
	private readonly categoryKeywords: Record<Category, string[]> = {
		Produce: [
			'tomato',
			'tomatoes',
			'onion',
			'onions',
			'garlic',
			'potato',
			'potatoes',
			'carrot',
			'carrots',
			'lettuce',
			'cucumber',
			'bell pepper',
			'celery',
			'spinach',
			'kale',
			'arugula',
			'broccoli',
			'cauliflower',
			'zucchini',
			'squash',
			'butternut squash',
			'yellow squash',
			'acorn squash',
			'spaghetti squash',
			'pepper',
			'peppers',
			'mushroom',
			'mushrooms',
			'avocado',
			'avocados',
			'lemon',
			'lemons',
			'lime',
			'limes',
			'apple',
			'apples',
			'banana',
			'bananas',
			'orange',
			'oranges',
			'mango',
			'mangoes',
			'jalapeno',
			'jalapeño',
			'ginger',
			'grape',
			'grapes',
			'berry',
			'berries',
			'strawberry',
			'strawberries',
			'blueberry',
			'blueberries',
			'raspberry',
			'raspberries',
			'asparagus',
			'green beans',
			'peas',
			'corn',
			'cabbage',
			'brussels sprouts',
			'brussel sprouts',
			'radish',
			'radishes',
			'fruit',
			'fruits',
			'vegetable',
			'vegetables',
			'sweet potato',
			'sweet potatoes',
		],
		Dairy: [
			'milk',
			'cheese',
			'butter',
			'cream',
			'yogurt',
			'egg',
			'eggs',
			'dairy',
			'cheddar',
			'mozzarella',
			'parmesan',
			'feta',
			'gouda',
			'swiss',
			'provolone',
			'ricotta',
			'cottage cheese',
			'sour cream',
			'heavy cream',
			'half and half',
			'whipping cream',
			'buttermilk',
			'kefir',
		],
		Meat: [
			'chicken breast',
			'chicken thighs',
			'chicken wings',
			'ground beef',
			'ground turkey',
			'ground pork',
			'pork chops',
			'pork loin',
			'beef chuck',
			'beef tenderloin',
			'beef sirloin',
			'beef ribeye',
			'bacon',
			'meat',
			'sausage',
			'ham',
			'steak',
			'pepperoni',
			'salami',
			'prosciutto',
			'pastrami',
			'corned beef',
			'roast beef',
			'chicken',
			'beef',
			'pork',
			'turkey',
			'lamb',
		],
		Seafood: [
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
			'mahi mahi',
			'sea bass',
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
		],
		Pantry: [
			'flour',
			'sugar',
			'sauce',
			'can',
			'canned',
			'dried',
			'dry',
			'soup',
			'beans',
			'lentils',
			'chickpeas',
			'black beans',
			'kidney beans',
			'pinto beans',
			'white beans',
			'breadcrumbs',
			'panko',
			'crackers',
			'chips',
			'taco shells',
			'tortilla shells',
			'honey',
			'maple syrup',
			'agave',
			'jam',
			'jelly',
			'peanut butter',
			'nutella',
			'mayonnaise',
			'mustard',
			'ketchup',
			'hot sauce',
			'soy sauce',
			'worcestershire sauce',
			'teriyaki sauce',
			'barbecue sauce',
			'alfredo sauce',
			'pesto sauce',
		],
		Spices: [
			'salt',
			'pepper',
			'spice',
			'spices',
			'herb',
			'herbs',
			'seasoning',
			'seasonings',
			'basil',
			'oregano',
			'thyme',
			'rosemary',
			'sage',
			'parsley',
			'cilantro',
			'dill',
			'mint',
			'bay leaf',
			'bay leaves',
			'cinnamon',
			'nutmeg',
			'ginger',
			'cumin',
			'coriander',
			'paprika',
			'chili powder',
			'cayenne',
			'red pepper flakes',
			'garlic powder',
			'onion powder',
			'celery salt',
			'celery seed',
			'mustard seed',
			'fennel seed',
			'caraway seed',
			'poppy seed',
			'vanilla',
			'almond extract',
			'lemon extract',
		],
		Bakery: [
			'bread',
			'loaf',
			'roll',
			'bun',
			'hamburger buns',
			'cake',
			'pastry',
			'bakery',
			'baked',
			'sandwich bread',
			'sourdough',
			'whole wheat bread',
			'rye bread',
			'pita bread',
			'tortilla',
			'tortillas',
			'naan',
			'bagel',
			'bagels',
			'croissant',
			'croissants',
			'muffin',
			'muffins',
			'cookie',
			'cookies',
			'brownie',
			'brownies',
			'pie',
			'pies',
			'donut',
			'donuts',
			'doughnut',
			'doughnuts',
		],
		Frozen: [
			'frozen',
			'ice cream',
			'freezer',
			'frozen vegetables',
			'frozen fruit',
			'frozen berries',
			'frozen peas',
			'frozen corn',
			'frozen spinach',
			'frozen broccoli',
			'frozen pizza',
			'frozen waffles',
			'frozen french fries',
			'frozen chicken nuggets',
			'frozen fish sticks',
		],
		Other: [], // Default category
	};

	async normalizeCategory(
		name: string,
		existingCategory?: Category
	): Promise<Category> {
		const lowercaseName = name.toLowerCase();

		// PRIORITY 1: Handle compound terms that override individual keywords
		if (this.isCompoundMatch(lowercaseName)) {
			return this.getCompoundCategory(lowercaseName);
		}

		// PRIORITY 2: Check existing category if provided
		if (existingCategory) {
			return existingCategory;
		}

		// PRIORITY 3: Check for exact keyword matches
		const words = lowercaseName.split(/\s+/);

		// Create a flattened array of all keywords with their categories, sorted by length
		const allKeywords: Array<{ keyword: string; category: Category }> = [];
		for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
			for (const keyword of keywords) {
				allKeywords.push({ keyword, category: category as Category });
			}
		}

		// Sort by keyword length (longest first) to prioritize specific matches
		allKeywords.sort((a, b) => b.keyword.length - a.keyword.length);

		// First, try exact matches with longest keywords first
		for (const { keyword, category } of allKeywords) {
			if (lowercaseName.includes(keyword)) {
				return category;
			}
		}

		// If no exact match, try word-by-word matching
		for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
			if (
				words.some((word) =>
					keywords.some(
						(keyword) => keyword.includes(word) || word.includes(keyword)
					)
				)
			) {
				return category as Category;
			}
		}

		return 'Other';
	}

	private isCompoundMatch(name: string): boolean {
		return (
			name.includes('broth') ||
			name.includes('stock') ||
			name.includes('oil') ||
			name.includes('can ') ||
			name.includes('canned ') ||
			name.includes('jar ') ||
			name.includes('bottle ') ||
			name.includes('sauce') ||
			name.includes('juice') ||
			name.includes('vinegar') ||
			name.includes('frozen')
		);
	}

	private getCompoundCategory(name: string): Category {
		// Broths and stocks
		if (name.includes('broth') || name.includes('stock')) {
			return 'Pantry';
		}

		// All oils
		if (name.includes('oil')) {
			return 'Pantry';
		}

		// Canned/processed products
		if (
			name.includes('can ') ||
			name.includes('canned ') ||
			name.includes('jar ') ||
			name.includes('bottle ')
		) {
			return 'Pantry';
		}

		// Processed tomato products
		if (
			name.includes('tomato sauce') ||
			name.includes('tomato paste') ||
			name.includes('marinara sauce') ||
			name.includes('diced tomatoes') ||
			name.includes('crushed tomatoes') ||
			name.includes('tomato puree')
		) {
			return 'Pantry';
		}

		// Sauces and juices
		if (
			name.includes('sauce') ||
			name.includes('worcestershire') ||
			name.includes('soy sauce') ||
			name.includes('hot sauce') ||
			name.includes('juice')
		) {
			return 'Pantry';
		}

		// Vinegars
		if (name.includes('vinegar')) {
			return 'Pantry';
		}

		// Frozen items
		if (name.includes('frozen')) {
			return 'Frozen';
		}

		return 'Other';
	}
}
