import { RecipeService } from '../services/recipeService.js';

const testRecipes = [
	{
		userId: '68376d8d1d7239d019114200',
		title: 'Grilled Chicken with Roasted Vegetables',
		description: 'A healthy and protein-rich dinner option',
		ingredients: [
			'chicken breast',
			'bell peppers',
			'zucchini',
			'olive oil',
			'garlic',
			'rosemary',
		],
		prepInstructions: [
			'Preheat oven to 400°F',
			'Season chicken with garlic and rosemary',
		],
		prepTime: 15,
		cookTime: 30,
		servings: 2,
		tags: ['dinner', 'high-protein'],
		storageTime: 3,
		containerSuggestions: ['airtight container'],
		defrostInstructions: ['Thaw in refrigerator overnight'],
		cookingInstructions: [
			'Cut vegetables into chunks',
			'Toss vegetables with olive oil',
			'Place chicken and vegetables on baking sheet',
			'Bake for 25-30 minutes until chicken is cooked through',
		],
		servingInstructions: ['Serve hot with your favorite side dish'],
		season: 'all',
		embedding: [],
		images: {},
		isPublic: true,
		allergenInfo: [],
		dietaryInfo: ['high-protein'],
		hasImage: false,
		isPlaceholder: false,
		createdAt: new Date(),
		updatedAt: new Date(),
		__v: 0,
	},
	{
		userId: '68376d8d1d7239d019114200',
		title: 'Baked Salmon with Asparagus',
		description: 'A heart-healthy dinner rich in omega-3s',
		ingredients: ['salmon fillet', 'asparagus', 'lemon', 'dill', 'olive oil'],
		prepInstructions: [
			'Preheat oven to 375°F',
			'Season salmon with dill and lemon',
		],
		prepTime: 10,
		cookTime: 20,
		servings: 2,
		tags: ['dinner', 'pescatarian'],
		storageTime: 2,
		containerSuggestions: ['airtight container'],
		defrostInstructions: ['Thaw in refrigerator overnight'],
		cookingInstructions: [
			'Trim asparagus',
			'Place salmon and asparagus on baking sheet',
			'Drizzle with olive oil',
			'Bake for 15-20 minutes until salmon is flaky',
		],
		servingInstructions: ['Serve hot with lemon wedges'],
		season: 'all',
		embedding: [],
		images: {},
		isPublic: true,
		allergenInfo: [],
		dietaryInfo: ['pescatarian'],
		hasImage: false,
		isPlaceholder: false,
		createdAt: new Date(),
		updatedAt: new Date(),
		__v: 0,
	},
	{
		userId: '68376d8d1d7239d019114200',
		title: 'Vegetable Stir Fry with Tofu',
		description: 'A quick and healthy vegetarian dinner',
		ingredients: [
			'tofu',
			'broccoli',
			'carrots',
			'soy sauce',
			'ginger',
			'sesame oil',
		],
		prepInstructions: [
			'Press and cube tofu',
			'Cut vegetables into bite-sized pieces',
		],
		prepTime: 15,
		cookTime: 15,
		servings: 1,
		tags: ['dinner', 'vegetarian'],
		storageTime: 2,
		containerSuggestions: ['airtight container'],
		defrostInstructions: ['Reheat in microwave or stovetop'],
		cookingInstructions: [
			'Heat sesame oil in a large pan',
			'Stir fry vegetables until crisp-tender',
			'Add tofu and sauce',
			'Cook until heated through',
		],
		servingInstructions: ['Serve hot over rice'],
		season: 'all',
		embedding: [],
		images: {},
		isPublic: true,
		allergenInfo: ['soy'],
		dietaryInfo: ['vegetarian', 'vegan'],
		hasImage: false,
		isPlaceholder: false,
		createdAt: new Date(),
		updatedAt: new Date(),
		__v: 0,
	},
];

async function addTestRecipes() {
	const recipeService = new RecipeService();
	const userId = '68376d8d1d7239d019114200';

	console.log('Adding test recipes...');
	for (const recipe of testRecipes) {
		try {
			const recipeId = await recipeService.addRecipe(recipe);
			console.log(`Added recipe: ${recipe.title} (${recipeId})`);
		} catch (error) {
			console.error(`Failed to add recipe ${recipe.title}:`, error);
		}
	}
	console.log('Done adding test recipes');
}

addTestRecipes().catch(console.error);
