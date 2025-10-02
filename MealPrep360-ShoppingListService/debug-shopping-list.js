// Debug script to show shopping list issues
const { generateShoppingList } = require('./dist/services/shoppingListService');

// Test data that demonstrates the issues
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
			{ name: 'boneless chicken breast', amount: 1, unit: 'piece', category: 'Meat' },
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

async function debugShoppingListIssues() {
	try {
		console.log('🔍 Debugging shopping list issues...\n');
		
		const shoppingList = await generateShoppingList(mockRecipes, mockMealPlan);

		console.log('📋 Generated shopping list:');
		console.log('='.repeat(50));
		
		shoppingList.forEach((ingredient, index) => {
			console.log(
				`${index + 1}. ${ingredient.name} - ${ingredient.amount} ${ingredient.unit} (${ingredient.category})`
			);
		});

		console.log('\n🚨 ISSUES FOUND:');
		console.log('='.repeat(50));
		
		// Check for generic units (1g items)
		const genericUnits = shoppingList.filter(item => 
			item.unit === 'g' && item.amount === 1
		);
		if (genericUnits.length > 0) {
			console.log('❌ Generic units (1g items):');
			genericUnits.forEach(item => {
				console.log(`   - ${item.name}: ${item.amount} ${item.unit}`);
			});
		}

		// Check for N/A prefixes
		const naPrefixes = shoppingList.filter(item => 
			item.name.toLowerCase().includes('n/a')
		);
		if (naPrefixes.length > 0) {
			console.log('❌ Items with N/A prefixes:');
			naPrefixes.forEach(item => {
				console.log(`   - ${item.name}`);
			});
		}

		// Check for duplicate items that should be combined
		const duplicateNames = shoppingList.reduce((acc, item) => {
			const key = item.name.toLowerCase();
			if (!acc[key]) acc[key] = [];
			acc[key].push(item);
			return acc;
		}, {});
		
		const duplicates = Object.entries(duplicateNames).filter(([name, items]) => items.length > 1);
		if (duplicates.length > 0) {
			console.log('❌ Duplicate items that should be combined:');
			duplicates.forEach(([name, items]) => {
				console.log(`   - ${name}: ${items.length} separate entries`);
				items.forEach(item => {
					console.log(`     * ${item.amount} ${item.unit}`);
				});
			});
		}

		// Check for inconsistent naming
		const similarItems = shoppingList.filter(item => 
			item.name.toLowerCase().includes('chicken') || 
			item.name.toLowerCase().includes('garlic') ||
			item.name.toLowerCase().includes('onion')
		);
		if (similarItems.length > 1) {
			console.log('❌ Inconsistent naming for similar items:');
			similarItems.forEach(item => {
				console.log(`   - ${item.name}: ${item.amount} ${item.unit}`);
			});
		}

	} catch (error) {
		console.error('Error debugging shopping list:', error);
	}
}

debugShoppingListIssues(); 