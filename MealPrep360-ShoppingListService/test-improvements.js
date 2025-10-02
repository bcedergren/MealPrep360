// Test script to demonstrate shopping list improvements
const { generateShoppingList } = require('./dist/services/shoppingListService');

// Test data that shows the improvements
const mockRecipes = [
	{
		_id: '1',
		title: 'Chicken Stir Fry',
		ingredients: [
			{ name: 'chicken breast', amount: 2, unit: 'piece', category: 'Meat' },
			{ name: 'shrimp', amount: 1, unit: 'g', category: 'Seafood' },
			{ name: 'quinoa', amount: 1, unit: 'g', category: 'Pantry' },
			{ name: 'N/A onion', amount: 1, unit: 'piece', category: 'Produce' },
			{ name: 'garlic cloves', amount: 3, unit: 'piece', category: 'Produce' },
		],
	},
	{
		_id: '2',
		title: 'Chicken Pasta',
		ingredients: [
			{
				name: 'boneless chicken breast',
				amount: 1,
				unit: 'piece',
				category: 'Meat',
			},
			{ name: 'shrimp', amount: 1, unit: 'g', category: 'Seafood' },
			{ name: 'quinoa', amount: 1, unit: 'g', category: 'Pantry' },
			{ name: 'onion', amount: 1, unit: 'piece', category: 'Produce' },
			{ name: 'garlic', amount: 2, unit: 'piece', category: 'Produce' },
		],
	},
	{
		_id: '3',
		title: 'Seafood Salad',
		ingredients: [
			{ name: 'shrimp', amount: 1, unit: 'g', category: 'Seafood' },
			{ name: 'quinoa', amount: 1, unit: 'g', category: 'Pantry' },
			{ name: 'tomato', amount: 2, unit: 'piece', category: 'Produce' },
		],
	},
];

const mockMealPlan = [
	{ recipeId: '1', servings: 1 },
	{ recipeId: '2', servings: 1 },
	{ recipeId: '3', servings: 1 },
];

async function testImprovements() {
	try {
		console.log('🎉 Testing shopping list improvements...\n');

		const shoppingList = await generateShoppingList(mockRecipes, mockMealPlan);

		console.log('📋 IMPROVED shopping list:');
		console.log('='.repeat(60));

		shoppingList.forEach((ingredient, index) => {
			console.log(
				`${index + 1}. ${ingredient.name} - ${ingredient.amount} ${ingredient.unit} (${ingredient.category})`
			);
		});

		console.log('\n✅ IMPROVEMENTS ACHIEVED:');
		console.log('='.repeat(60));

		// Check for cleaned names (no N/A prefixes)
		const naPrefixes = shoppingList.filter((item) =>
			item.name.toLowerCase().includes('n/a')
		);
		if (naPrefixes.length === 0) {
			console.log('✅ N/A prefixes removed: All ingredient names are clean');
		}

		// Check for reasonable amounts (no 1g items)
		const genericUnits = shoppingList.filter(
			(item) => item.unit === 'g' && item.amount === 1
		);
		if (genericUnits.length === 0) {
			console.log('✅ Generic units fixed: No more "1 g" items');
		}

		// Check for combined similar items
		const shrimpItems = shoppingList.filter((item) =>
			item.name.toLowerCase().includes('shrimp')
		);
		if (shrimpItems.length === 1) {
			console.log('✅ Redundant items combined: Shrimp items merged into one');
		}

		const quinoaItems = shoppingList.filter((item) =>
			item.name.toLowerCase().includes('quinoa')
		);
		if (quinoaItems.length === 1) {
			console.log('✅ Redundant items combined: Quinoa items merged into one');
		}

		const onionItems = shoppingList.filter((item) =>
			item.name.toLowerCase().includes('onion')
		);
		if (onionItems.length === 1) {
			console.log('✅ Inconsistent naming fixed: Onion items normalized');
		}

		const garlicItems = shoppingList.filter((item) =>
			item.name.toLowerCase().includes('garlic')
		);
		if (garlicItems.length === 1) {
			console.log('✅ Inconsistent naming fixed: Garlic items normalized');
		}

		console.log('\n📊 SUMMARY:');
		console.log('='.repeat(60));
		console.log(`Total items: ${shoppingList.length}`);
		console.log(
			`Items with reasonable amounts: ${shoppingList.filter((item) => item.amount > 1 || item.unit !== 'g').length}`
		);
		console.log(
			`Items with clean names: ${shoppingList.filter((item) => !item.name.toLowerCase().includes('n/a')).length}`
		);
	} catch (error) {
		console.error('Error testing improvements:', error);
	}
}

testImprovements();
