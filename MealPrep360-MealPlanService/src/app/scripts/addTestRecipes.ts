import { RecipeRepository } from '../repositories/recipeRepository.js';
import { Recipe } from '../types/recipe.js';
import { v4 as uuidv4 } from 'uuid';

const testRecipes: Omit<Recipe, 'id'>[] = [
	{
		userId: '68376d8d1d7239d019114200',
		name: 'Grilled Chicken with Roasted Vegetables',
		description: 'A healthy and protein-rich dinner option',
		ingredients: [
			{ name: 'chicken breast', amount: 2, unit: 'pieces' },
			{ name: 'bell peppers', amount: 2, unit: 'whole' },
			{ name: 'zucchini', amount: 2, unit: 'whole' },
			{ name: 'olive oil', amount: 2, unit: 'tbsp' },
			{ name: 'garlic', amount: 2, unit: 'cloves' },
			{ name: 'rosemary', amount: 1, unit: 'sprig' },
		],
		instructions: [
			'Preheat oven to 400°F',
			'Season chicken with garlic and rosemary',
			'Cut vegetables into chunks',
			'Toss vegetables with olive oil',
			'Place chicken and vegetables on baking sheet',
			'Bake for 25-30 minutes until chicken is cooked through',
		],
		prepTime: 15,
		cookTime: 30,
		servings: 2,
		nutritionalInfo: {
			calories: 450,
			protein: 40,
			carbs: 20,
			fat: 25,
		},
		tags: ['dinner', 'high-protein'],
		dietaryPreferences: ['high-protein'],
		restrictions: [],
	},
	{
		userId: '68376d8d1d7239d019114200',
		name: 'Baked Salmon with Asparagus',
		description: 'A heart-healthy dinner rich in omega-3s',
		ingredients: [
			{ name: 'salmon fillet', amount: 2, unit: 'pieces' },
			{ name: 'asparagus', amount: 1, unit: 'bunch' },
			{ name: 'lemon', amount: 1, unit: 'whole' },
			{ name: 'dill', amount: 2, unit: 'tbsp' },
			{ name: 'olive oil', amount: 2, unit: 'tbsp' },
		],
		instructions: [
			'Preheat oven to 375°F',
			'Season salmon with dill and lemon',
			'Trim asparagus',
			'Place salmon and asparagus on baking sheet',
			'Drizzle with olive oil',
			'Bake for 15-20 minutes until salmon is flaky',
		],
		prepTime: 10,
		cookTime: 20,
		servings: 2,
		nutritionalInfo: {
			calories: 380,
			protein: 35,
			carbs: 10,
			fat: 22,
		},
		tags: ['dinner', 'pescatarian'],
		dietaryPreferences: ['pescatarian'],
		restrictions: [],
	},
	{
		userId: '68376d8d1d7239d019114200',
		name: 'Vegetable Stir Fry with Tofu',
		description: 'A quick and healthy vegetarian dinner',
		ingredients: [
			{ name: 'tofu', amount: 1, unit: 'block' },
			{ name: 'broccoli', amount: 2, unit: 'cups' },
			{ name: 'carrots', amount: 2, unit: 'whole' },
			{ name: 'soy sauce', amount: 3, unit: 'tbsp' },
			{ name: 'ginger', amount: 1, unit: 'tbsp' },
			{ name: 'sesame oil', amount: 1, unit: 'tbsp' },
		],
		instructions: [
			'Press and cube tofu',
			'Cut vegetables into bite-sized pieces',
			'Heat sesame oil in a large pan',
			'Stir fry vegetables until crisp-tender',
			'Add tofu and sauce',
			'Cook until heated through',
		],
		prepTime: 15,
		cookTime: 15,
		servings: 1,
		nutritionalInfo: {
			calories: 350,
			protein: 20,
			carbs: 30,
			fat: 15,
		},
		tags: ['dinner'],
		dietaryPreferences: ['vegetarian', 'vegan'],
		restrictions: [],
	},
	{
		userId: '68376d8d1d7239d019114200',
		name: 'Beef and Broccoli',
		description: 'Classic beef and broccoli stir fry',
		ingredients: [
			{ name: 'beef strips', amount: 1, unit: 'pound' },
			{ name: 'broccoli', amount: 2, unit: 'cups' },
			{ name: 'soy sauce', amount: 3, unit: 'tbsp' },
			{ name: 'ginger', amount: 1, unit: 'tbsp' },
		],
		instructions: [
			'Stir fry beef until browned',
			'Add broccoli and sauce',
			'Cook until broccoli is tender',
		],
		prepTime: 15,
		cookTime: 15,
		servings: 1,
		nutritionalInfo: {
			calories: 500,
			protein: 40,
			carbs: 25,
			fat: 30,
		},
		tags: ['dinner'],
		dietaryPreferences: ['high-protein'],
		restrictions: [],
	},
	{
		userId: '68376d8d1d7239d019114200',
		name: 'Lentil Curry',
		description: 'Spicy lentil curry with rice',
		ingredients: [
			{ name: 'lentils', amount: 1, unit: 'cup' },
			{ name: 'coconut milk', amount: 1, unit: 'can' },
			{ name: 'curry powder', amount: 2, unit: 'tbsp' },
			{ name: 'brown rice', amount: 1, unit: 'cup' },
		],
		instructions: [
			'Cook lentils until tender',
			'Add coconut milk and curry powder',
			'Simmer until thickened',
			'Serve over rice',
		],
		prepTime: 10,
		cookTime: 30,
		servings: 1,
		nutritionalInfo: {
			calories: 450,
			protein: 25,
			carbs: 60,
			fat: 15,
		},
		tags: ['dinner'],
		dietaryPreferences: ['vegetarian', 'vegan'],
		restrictions: [],
	},
];

async function addTestRecipes() {
	const recipeRepository = new RecipeRepository();
	const userId = '68376d8d1d7239d019114200';

	console.log('Adding test recipes...');
	for (const recipe of testRecipes) {
		try {
			const id = crypto.randomUUID();
			const recipeWithId: Recipe & { userId: string } = {
				...recipe,
				id,
				userId,
			};
			await recipeRepository.saveRecipe(recipeWithId);
			console.log(`Added recipe: ${recipe.name} (${id})`);
		} catch (error) {
			console.error(`Failed to add recipe ${recipe.name}:`, error);
		}
	}
	console.log('Done adding test recipes');
}

addTestRecipes().catch(console.error);
