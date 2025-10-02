const { generateShoppingList } = require('./dist/services/shoppingListService');

// Test with just chicken broth to see what happens
const mockRecipes = [
	{
		_id: '1',
		title: 'Chicken Broth Test',
		ingredients: [
			{ name: 'chicken broth', amount: 1, unit: 'cup', category: 'Pantry' },
		],
	},
];

const mockMealPlan = [{ recipeId: '1', servings: 1 }];

async function testChickenBroth() {
	try {
		console.log('Testing chicken broth specifically...');
		const shoppingList = await generateShoppingList(mockRecipes, mockMealPlan);

		console.log('\nGenerated shopping list:');
		shoppingList.forEach((ingredient, index) => {
			console.log(
				`${index + 1}. ${ingredient.name} - ${ingredient.amount} ${ingredient.unit} (${ingredient.category})`
			);
		});

		// Check if chicken broth is present
		const brothIngredients = shoppingList.filter((ingredient) =>
			ingredient.name.toLowerCase().includes('broth')
		);

		console.log(`\nBroth ingredients found: ${brothIngredients.length}`);
		brothIngredients.forEach((ingredient) => {
			console.log(
				`- ${ingredient.name}: ${ingredient.amount} ${ingredient.unit} (${ingredient.category})`
			);
		});

		if (brothIngredients.length === 0) {
			console.log('\n❌ Chicken broth is missing from the shopping list!');
		} else {
			console.log('\n✅ Chicken broth is present in the shopping list!');
		}
	} catch (error) {
		console.error('Error testing chicken broth:', error);
	}
}

testChickenBroth();
