// Simple test for shopping list generation logic
const { generateShoppingList } = require('./dist/services/shoppingListService');

// Mock recipes with similar ingredients that should be combined
const mockRecipes = [
	{
		_id: '1',
		title: 'Chicken Recipe 1',
		ingredients: [
			{ name: 'chicken breasts', amount: 2, unit: 'piece', category: 'Meat' },
			{ name: 'chicken broth', amount: 1, unit: 'cup', category: 'Pantry' },
		],
	},
	{
		_id: '2',
		title: 'Chicken Recipe 2',
		ingredients: [
			{
				name: 'boneless chicken breasts',
				amount: 1,
				unit: 'piece',
				category: 'Meat',
			},
			{ name: 'beef broth', amount: 0.5, unit: 'cup', category: 'Pantry' },
		],
	},
	{
		_id: '3',
		title: 'Chicken Recipe 3',
		ingredients: [
			{
				name: 'boneless, skinless chicken breasts',
				amount: 1,
				unit: 'piece',
				category: 'Meat',
			},
			{ name: 'shrimp', amount: 1, unit: 'g', category: 'Seafood' },
		],
	},
];

const mockMealPlan = [
	{ recipeId: '1', servings: 1 },
	{ recipeId: '2', servings: 1 },
	{ recipeId: '3', servings: 1 },
];

async function testIngredientCombination() {
	try {
		const shoppingList = await generateShoppingList(mockRecipes, mockMealPlan);

		console.log('Generated shopping list:');
		shoppingList.forEach((ingredient, index) => {
			console.log(
				`${index + 1}. ${ingredient.name} - ${ingredient.amount} ${ingredient.unit} (${ingredient.category})`
			);
		});

		// Check if chicken ingredients were combined
		const chickenIngredients = shoppingList.filter((ingredient) =>
			ingredient.name.toLowerCase().includes('chicken')
		);

		console.log(`\nChicken ingredients found: ${chickenIngredients.length}`);
		chickenIngredients.forEach((ingredient) => {
			console.log(
				`- ${ingredient.name}: ${ingredient.amount} ${ingredient.unit}`
			);
		});

		// Check if broth ingredients were combined
		const brothIngredients = shoppingList.filter((ingredient) =>
			ingredient.name.toLowerCase().includes('broth')
		);

		console.log(`\nBroth ingredients found: ${brothIngredients.length}`);
		brothIngredients.forEach((ingredient) => {
			console.log(
				`- ${ingredient.name}: ${ingredient.amount} ${ingredient.unit}`
			);
		});

		// Check shrimp
		const shrimpIngredients = shoppingList.filter((ingredient) =>
			ingredient.name.toLowerCase().includes('shrimp')
		);

		console.log(`\nShrimp ingredients found: ${shrimpIngredients.length}`);
		shrimpIngredients.forEach((ingredient) => {
			console.log(
				`- ${ingredient.name}: ${ingredient.amount} ${ingredient.unit}`
			);
		});
	} catch (error) {
		console.error('Error testing ingredient combination:', error);
	}
}

testIngredientCombination();
