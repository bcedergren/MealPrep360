// Test file that imports directly from TypeScript source
const { generateShoppingList } = require('./src/services/shoppingListService');

// Test data with common issues
const testRecipes = [
	{
		_id: 'recipe-1',
		title: 'Test Recipe 1',
		ingredients: [
			{
				name: 'tablespoon olive oil',
				amount: 2,
				unit: 'tbsp',
				category: 'Pantry',
			},
			{
				name: 'medium carrots',
				amount: 3,
				unit: 'piece',
				category: 'Produce',
			},
			{
				name: 'large carrots',
				amount: 2,
				unit: 'piece',
				category: 'Produce',
			},
			{
				name: 'garlic cloves',
				amount: 4,
				unit: 'piece',
				category: 'Produce',
			},
			{
				name: 'cloves garlic',
				amount: 2,
				unit: 'piece',
				category: 'Produce',
			},
			{
				name: 'large red bell pepper',
				amount: 1,
				unit: 'piece',
				category: 'Produce',
			},
			{
				name: 'red bell pepper',
				amount: 2,
				unit: 'piece',
				category: 'Produce',
			},
			{
				name: 'to taste Pepper',
				amount: 1,
				unit: 'pinch',
				category: 'Spices',
			},
			{
				name: 'chicken breast',
				amount: 1,
				unit: 'lb',
				category: 'Meat',
			},
			{
				name: 'boneless chicken breast',
				amount: 1,
				unit: 'lb',
				category: 'Meat',
			},
		],
	},
];

const mealPlan = [
	{
		recipeId: 'recipe-1',
		servings: 1,
	},
];

async function testShoppingList() {
	try {
		console.log('🧪 Testing shopping list generation with problematic data...');

		const result = await generateShoppingList(testRecipes, mealPlan, []);

		console.log('\n📋 Generated Shopping List:');
		console.log(JSON.stringify(result, null, 2));

		// Group by category
		const grouped = result.reduce((acc, item) => {
			if (!acc[item.category]) {
				acc[item.category] = [];
			}
			acc[item.category].push(item);
			return acc;
		}, {});

		console.log('\n📂 Grouped by Category:');
		Object.entries(grouped).forEach(([category, items]) => {
			console.log(`\n${category}:`);
			items.forEach((item) => {
				console.log(`  - ${item.name}: ${item.amount} ${item.unit}`);
			});
		});
	} catch (error) {
		console.error('❌ Test failed:', error);
	}
}

testShoppingList();
