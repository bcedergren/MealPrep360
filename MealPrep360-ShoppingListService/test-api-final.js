const axios = require('axios');

// Test data with the problematic ingredients
const testData = {
	userId: 'test-user-123',
	recipes: [
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
	],
	mealPlan: [
		{
			recipeId: 'recipe-1',
			servings: 1,
		},
	],
	pantryExclusions: [],
};

async function testShoppingListAPI() {
	try {
		console.log('🧪 Testing shopping list API with problematic data...');
		console.log('='.repeat(60));

		const response = await axios.post(
			'http://localhost:3000/api/shopping-list',
			testData,
			{
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': 'dev-key', // Development API key
				},
			}
		);

		console.log('\n📋 Generated Shopping List:');
		console.log(JSON.stringify(response.data, null, 2));

		// Group by category
		const grouped = response.data.reduce((acc, item) => {
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

		// Check for specific issues
		console.log('\n🔍 Issue Check:');
		const issues = [];

		// Check 1: No ingredients with units in names
		const ingredientsWithUnits = response.data.filter(
			(item) =>
				item.name.includes('tablespoon') ||
				item.name.includes('tbsp') ||
				item.name.includes('piece') ||
				item.name.includes('medium') ||
				item.name.includes('large')
		);
		if (ingredientsWithUnits.length > 0) {
			issues.push(
				`❌ Found ingredients with units in names: ${ingredientsWithUnits.map((i) => i.name).join(', ')}`
			);
		} else {
			console.log('✅ No ingredients with units in names');
		}

		// Check 2: No "to taste" ingredients
		const toTasteIngredients = response.data.filter((item) =>
			item.name.toLowerCase().includes('to taste')
		);
		if (toTasteIngredients.length > 0) {
			issues.push(
				`❌ Found "to taste" ingredients: ${toTasteIngredients.map((i) => i.name).join(', ')}`
			);
		} else {
			console.log('✅ No "to taste" ingredients');
		}

		// Check 3: Similar ingredients should be merged
		const carrotCount = response.data.filter(
			(item) => item.name === 'carrot'
		).length;
		const garlicCount = response.data.filter(
			(item) => item.name === 'garlic'
		).length;
		const bellPepperCount = response.data.filter(
			(item) => item.name === 'bell pepper'
		).length;
		const chickenBreastCount = response.data.filter(
			(item) => item.name === 'chicken breast'
		).length;

		if (carrotCount > 1) {
			issues.push(`❌ Carrots not merged properly (${carrotCount} entries)`);
		} else if (carrotCount === 1) {
			console.log('✅ Carrots merged properly');
		}

		if (garlicCount > 1) {
			issues.push(`❌ Garlic not merged properly (${garlicCount} entries)`);
		} else if (garlicCount === 1) {
			console.log('✅ Garlic merged properly');
		}

		if (bellPepperCount > 1) {
			issues.push(
				`❌ Bell peppers not merged properly (${bellPepperCount} entries)`
			);
		} else if (bellPepperCount === 1) {
			console.log('✅ Bell peppers merged properly');
		}

		if (chickenBreastCount > 1) {
			issues.push(
				`❌ Chicken breast not merged properly (${chickenBreastCount} entries)`
			);
		} else if (chickenBreastCount === 1) {
			console.log('✅ Chicken breast merged properly');
		}

		// Check 4: Not too many items in "Other" category
		const otherCategory = response.data.filter(
			(item) => item.category === 'Other'
		);
		if (otherCategory.length > 3) {
			issues.push(
				`❌ Too many items in "Other" category (${otherCategory.length} items)`
			);
		} else {
			console.log('✅ Reasonable number of items in "Other" category');
		}

		if (issues.length > 0) {
			console.log('\n❌ Issues found:');
			issues.forEach((issue) => console.log(issue));
		} else {
			console.log('\n🎉 All issues resolved! Shopping list looks correct.');
		}
	} catch (error) {
		console.error('❌ Test failed:', error.message);
		if (error.response) {
			console.error('Response data:', error.response.data);
		}
	}
}

testShoppingListAPI();
