import { connectToDatabase } from '../src/utils/database';
import { IngredientReference } from '../src/models/IngredientReference';
import { Category } from '../src/types';

interface IngredientData {
	name: string;
	displayName: string;
	category: Category;
	alternateNames: string[];
	defaultUnit: string;
	defaultAmount: number;
	isCommonPantryItem: boolean;
}

const ingredientData: IngredientData[] = [
	// Produce - Vegetables
	{
		name: 'bell pepper',
		displayName: 'Bell Pepper',
		category: 'Produce',
		alternateNames: [
			'bell peppers',
			'red bell pepper',
			'green bell pepper',
			'yellow bell pepper',
			'orange bell pepper',
		],
		defaultUnit: 'piece',
		defaultAmount: 1,
		isCommonPantryItem: false,
	},
	{
		name: 'carrot',
		displayName: 'Carrot',
		category: 'Produce',
		alternateNames: ['carrots', 'baby carrots'],
		defaultUnit: 'piece',
		defaultAmount: 2,
		isCommonPantryItem: false,
	},
	{
		name: 'celery',
		displayName: 'Celery',
		category: 'Produce',
		alternateNames: ['celery stalks', 'celery stalk'],
		defaultUnit: 'piece',
		defaultAmount: 2,
		isCommonPantryItem: false,
	},
	{
		name: 'cucumber',
		displayName: 'Cucumber',
		category: 'Produce',
		alternateNames: ['cucumbers', 'english cucumber'],
		defaultUnit: 'piece',
		defaultAmount: 1,
		isCommonPantryItem: false,
	},
	{
		name: 'zucchini',
		displayName: 'Zucchini',
		category: 'Produce',
		alternateNames: ['courgette'],
		defaultUnit: 'piece',
		defaultAmount: 1,
		isCommonPantryItem: false,
	},
	{
		name: 'yellow squash',
		displayName: 'Yellow Squash',
		category: 'Produce',
		alternateNames: ['summer squash'],
		defaultUnit: 'piece',
		defaultAmount: 1,
		isCommonPantryItem: false,
	},
	{
		name: 'sweet potato',
		displayName: 'Sweet Potato',
		category: 'Produce',
		alternateNames: ['sweet potatoes', 'yam', 'yams'],
		defaultUnit: 'piece',
		defaultAmount: 1,
		isCommonPantryItem: false,
	},
	{
		name: 'brussels sprouts',
		displayName: 'Brussels Sprouts',
		category: 'Produce',
		alternateNames: ['brussel sprouts'],
		defaultUnit: 'cup',
		defaultAmount: 2,
		isCommonPantryItem: false,
	},
	{
		name: 'spinach',
		displayName: 'Spinach',
		category: 'Produce',
		alternateNames: ['baby spinach', 'fresh spinach'],
		defaultUnit: 'cup',
		defaultAmount: 2,
		isCommonPantryItem: false,
	},
	{
		name: 'kale',
		displayName: 'Kale',
		category: 'Produce',
		alternateNames: ['curly kale', 'dinosaur kale', 'lacinato kale'],
		defaultUnit: 'cup',
		defaultAmount: 2,
		isCommonPantryItem: false,
	},

	// Produce - Fruits
	{
		name: 'lemon',
		displayName: 'Lemon',
		category: 'Produce',
		alternateNames: ['lemons', 'fresh lemon'],
		defaultUnit: 'piece',
		defaultAmount: 1,
		isCommonPantryItem: false,
	},
	{
		name: 'lime',
		displayName: 'Lime',
		category: 'Produce',
		alternateNames: ['limes', 'fresh lime'],
		defaultUnit: 'piece',
		defaultAmount: 1,
		isCommonPantryItem: false,
	},
	{
		name: 'avocado',
		displayName: 'Avocado',
		category: 'Produce',
		alternateNames: [
			'avocados',
			'ripe avocado',
			'ripe avocados',
			'hass avocado',
		],
		defaultUnit: 'piece',
		defaultAmount: 1,
		isCommonPantryItem: false,
	},
	{
		name: 'mango',
		displayName: 'Mango',
		category: 'Produce',
		alternateNames: ['mangoes', 'ripe mango', 'ripe mangoes'],
		defaultUnit: 'piece',
		defaultAmount: 1,
		isCommonPantryItem: false,
	},
	{
		name: 'jalapeno',
		displayName: 'Jalapeño',
		category: 'Produce',
		alternateNames: ['jalapenos', 'jalapeño pepper', 'jalapeño peppers'],
		defaultUnit: 'piece',
		defaultAmount: 1,
		isCommonPantryItem: false,
	},

	// Pantry - Grains & Pasta
	{
		name: 'penne pasta',
		displayName: 'Penne Pasta',
		category: 'Pantry',
		alternateNames: ['penne', 'penne rigate'],
		defaultUnit: 'g',
		defaultAmount: 500,
		isCommonPantryItem: false,
	},
	{
		name: 'lasagna noodles',
		displayName: 'Lasagna Noodles',
		category: 'Pantry',
		alternateNames: ['lasagne sheets', 'no-boil lasagna noodles'],
		defaultUnit: 'piece',
		defaultAmount: 9,
		isCommonPantryItem: false,
	},

	// Pantry - Canned & Jarred
	{
		name: 'marinara sauce',
		displayName: 'Marinara Sauce',
		category: 'Pantry',
		alternateNames: ['tomato sauce', 'pasta sauce'],
		defaultUnit: 'cup',
		defaultAmount: 3,
		isCommonPantryItem: false,
	},
	{
		name: 'diced tomatoes',
		displayName: 'Diced Tomatoes',
		category: 'Pantry',
		alternateNames: ['canned diced tomatoes', 'can diced tomatoes'],
		defaultUnit: 'piece',
		defaultAmount: 1,
		isCommonPantryItem: false,
	},

	// Pantry - Condiments
	{
		name: 'lemon juice',
		displayName: 'Lemon Juice',
		category: 'Pantry',
		alternateNames: ['fresh lemon juice'],
		defaultUnit: 'tbsp',
		defaultAmount: 2,
		isCommonPantryItem: true,
	},

	// Spices & Herbs
	{
		name: 'oregano',
		displayName: 'Oregano',
		category: 'Spices',
		alternateNames: ['dried oregano', 'fresh oregano'],
		defaultUnit: 'tsp',
		defaultAmount: 1,
		isCommonPantryItem: true,
	},
	{
		name: 'thyme',
		displayName: 'Thyme',
		category: 'Spices',
		alternateNames: ['dried thyme', 'fresh thyme'],
		defaultUnit: 'tsp',
		defaultAmount: 1,
		isCommonPantryItem: true,
	},
	{
		name: 'rosemary',
		displayName: 'Rosemary',
		category: 'Spices',
		alternateNames: ['dried rosemary', 'fresh rosemary', 'rosemary sprigs'],
		defaultUnit: 'tsp',
		defaultAmount: 1,
		isCommonPantryItem: true,
	},
	{
		name: 'italian seasoning',
		displayName: 'Italian Seasoning',
		category: 'Spices',
		alternateNames: ['italian herbs'],
		defaultUnit: 'tbsp',
		defaultAmount: 1,
		isCommonPantryItem: true,
	},
	{
		name: 'cumin',
		displayName: 'Cumin',
		category: 'Spices',
		alternateNames: ['ground cumin'],
		defaultUnit: 'tsp',
		defaultAmount: 1,
		isCommonPantryItem: true,
	},
	{
		name: 'paprika',
		displayName: 'Paprika',
		category: 'Spices',
		alternateNames: ['sweet paprika'],
		defaultUnit: 'tsp',
		defaultAmount: 1,
		isCommonPantryItem: true,
	},
	{
		name: 'coriander',
		displayName: 'Coriander',
		category: 'Spices',
		alternateNames: ['ground coriander', 'cilantro'],
		defaultUnit: 'tsp',
		defaultAmount: 1,
		isCommonPantryItem: true,
	},

	// Dairy
	{
		name: 'mozzarella cheese',
		displayName: 'Mozzarella Cheese',
		category: 'Dairy',
		alternateNames: ['mozzarella', 'shredded mozzarella'],
		defaultUnit: 'g',
		defaultAmount: 200,
		isCommonPantryItem: false,
	},
	{
		name: 'parmesan cheese',
		displayName: 'Parmesan Cheese',
		category: 'Dairy',
		alternateNames: ['parmesan', 'grated parmesan', 'parmigiano reggiano'],
		defaultUnit: 'g',
		defaultAmount: 100,
		isCommonPantryItem: false,
	},
	{
		name: 'ricotta cheese',
		displayName: 'Ricotta Cheese',
		category: 'Dairy',
		alternateNames: ['ricotta'],
		defaultUnit: 'cup',
		defaultAmount: 2,
		isCommonPantryItem: false,
	},
	{
		name: 'feta cheese',
		displayName: 'Feta Cheese',
		category: 'Dairy',
		alternateNames: ['feta'],
		defaultUnit: 'g',
		defaultAmount: 200,
		isCommonPantryItem: false,
	},
	{
		name: 'egg',
		displayName: 'Egg',
		category: 'Dairy',
		alternateNames: ['eggs', 'large egg', 'large eggs'],
		defaultUnit: 'piece',
		defaultAmount: 1,
		isCommonPantryItem: false,
	},
	{
		name: 'sour cream',
		displayName: 'Sour Cream',
		category: 'Dairy',
		alternateNames: [],
		defaultUnit: 'cup',
		defaultAmount: 0.5,
		isCommonPantryItem: false,
	},
	// Produce
	{
		name: 'tomato',
		displayName: 'Tomato',
		category: 'Produce',
		alternateNames: ['tomatoes', 'roma tomato', 'roma tomatoes'],
		defaultUnit: 'piece',
		defaultAmount: 1,
		isCommonPantryItem: false,
	},
	{
		name: 'onion',
		displayName: 'Onion',
		category: 'Produce',
		alternateNames: [
			'onions',
			'yellow onion',
			'white onion',
			'red onion',
			'sweet onion',
		],
		defaultUnit: 'piece',
		defaultAmount: 1,
		isCommonPantryItem: false,
	},
	{
		name: 'garlic',
		displayName: 'Garlic',
		category: 'Produce',
		alternateNames: ['garlic cloves', 'cloves garlic', 'fresh garlic'],
		defaultUnit: 'piece',
		defaultAmount: 1,
		isCommonPantryItem: false,
	},
	{
		name: 'butternut squash',
		displayName: 'Butternut Squash',
		category: 'Produce',
		alternateNames: [],
		defaultUnit: 'piece',
		defaultAmount: 1,
		isCommonPantryItem: false,
	},

	// Meat
	{
		name: 'chicken breast',
		displayName: 'Chicken Breast',
		category: 'Meat',
		alternateNames: [
			'chicken breasts',
			'boneless chicken breast',
			'skinless chicken breast',
		],
		defaultUnit: 'piece',
		defaultAmount: 2,
		isCommonPantryItem: false,
	},

	// Seafood
	{
		name: 'shrimp',
		displayName: 'Shrimp',
		category: 'Seafood',
		alternateNames: ['prawns', 'large shrimp'],
		defaultUnit: 'lb',
		defaultAmount: 1,
		isCommonPantryItem: false,
	},

	// Pantry
	{
		name: 'olive oil',
		displayName: 'Olive Oil',
		category: 'Pantry',
		alternateNames: ['extra virgin olive oil', 'evoo'],
		defaultUnit: 'tbsp',
		defaultAmount: 1,
		isCommonPantryItem: true,
	},
	{
		name: 'quinoa',
		displayName: 'Quinoa',
		category: 'Pantry',
		alternateNames: [],
		defaultUnit: 'cup',
		defaultAmount: 1,
		isCommonPantryItem: false,
	},

	// Spices
	{
		name: 'salt',
		displayName: 'Salt',
		category: 'Spices',
		alternateNames: ['kosher salt', 'sea salt', 'table salt'],
		defaultUnit: 'tsp',
		defaultAmount: 1,
		isCommonPantryItem: true,
	},
	{
		name: 'black pepper',
		displayName: 'Black Pepper',
		category: 'Spices',
		alternateNames: ['pepper', 'ground black pepper'],
		defaultUnit: 'tsp',
		defaultAmount: 1,
		isCommonPantryItem: true,
	},
	{
		name: 'basil',
		displayName: 'Basil',
		category: 'Spices',
		alternateNames: ['fresh basil', 'dried basil'],
		defaultUnit: 'tbsp',
		defaultAmount: 1,
		isCommonPantryItem: false,
	},

	// Dairy
	{
		name: 'butter',
		displayName: 'Butter',
		category: 'Dairy',
		alternateNames: ['unsalted butter', 'salted butter'],
		defaultUnit: 'tbsp',
		defaultAmount: 1,
		isCommonPantryItem: true,
	},
];

async function populateIngredientReferences() {
	try {
		await connectToDatabase();
		console.log('Connected to database');

		// Clear existing data
		await IngredientReference.deleteMany({});
		console.log('Cleared existing ingredient references');

		// Insert new data
		for (const ingredient of ingredientData) {
			const reference = new IngredientReference(ingredient);
			await reference.save();
			console.log(`Added ingredient reference: ${ingredient.displayName}`);
		}

		console.log('Finished populating ingredient references');
		process.exit(0);
	} catch (error) {
		console.error('Error populating ingredient references:', error);
		process.exit(1);
	}
}

populateIngredientReferences();
