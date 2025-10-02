// Test the complete frontend flow
const axios = require('axios');

async function testFrontendFlow() {
	try {
		console.log('🧪 Testing complete frontend flow...');

		// Simulate meal plan data that the frontend would send
		const mealPlanData = {
			id: '687d210886422f8c952c1817',
			planId: '687d210886422f8c952c1817',
			hasDays: true,
			daysLength: 7,
			hasRecipes: true,
			recipeCount: 2,
			startDate: '2025-07-23T00:00:00.000Z',
			endDate: '2025-07-29T23:59:59.999Z',
			pantryExclusions: ['salt', 'pepper'],
		};

		console.log('📋 Meal plan data:', mealPlanData);

		// Simulate recipes that would be fetched from the frontend database
		const recipes = [
			{
				_id: 'recipe-1',
				title: 'Grilled Chicken Salad',
				ingredients: [
					{ name: 'Chicken breast', amount: 2, unit: 'lb', category: 'Meat' },
					{ name: 'Mixed greens', amount: 4, unit: 'cup', category: 'Produce' },
					{
						name: 'Cherry tomatoes',
						amount: 2,
						unit: 'cup',
						category: 'Produce',
					},
					{ name: 'Cucumber', amount: 1, unit: 'piece', category: 'Produce' },
				],
			},
			{
				_id: 'recipe-2',
				title: 'Pasta with Vegetables',
				ingredients: [
					{ name: 'Pasta', amount: 1, unit: 'lb', category: 'Pantry' },
					{ name: 'Broccoli', amount: 2, unit: 'cup', category: 'Produce' },
					{
						name: 'Bell peppers',
						amount: 2,
						unit: 'piece',
						category: 'Produce',
					},
					{ name: 'Olive oil', amount: 2, unit: 'tbsp', category: 'Pantry' },
				],
			},
		];

		console.log('🍽️ Recipes to be processed:', recipes.length);

		// Prepare the request body (same as frontend would send)
		const requestBody = {
			userId: 'test-user-123',
			recipes: recipes,
			pantryExclusions: mealPlanData.pantryExclusions,
		};

		console.log('📤 Sending request to ShoppingListService...');

		// Call the ShoppingListService
		const response = await axios.post(
			'http://localhost:3000/api/shopping-list',
			requestBody,
			{
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);

		console.log('✅ Shopping list generated successfully!');
		console.log(
			'📋 Shopping list items:',
			response.data.shoppingList.items.length
		);

		// Display the shopping list
		console.log('\n🛒 Generated Shopping List:');
		response.data.shoppingList.items.forEach((item, index) => {
			console.log(
				`${index + 1}. ${item.name}: ${item.amount} ${item.unit} (${item.category})`
			);
			if (item.normalizedAmount !== item.amount) {
				console.log(
					`   → Normalized: ${item.normalizedAmount} ${item.normalizedUnit}`
				);
			}
		});

		console.log('\n📊 Summary:');
		console.log(`- Total items: ${response.data.shoppingList.items.length}`);
		console.log(`- Mode: ${response.data.mode}`);
		console.log(`- User ID: ${response.data.shoppingList.userId}`);
	} catch (error) {
		console.error('❌ Test failed:', error.response?.data || error.message);
		if (error.response) {
			console.log('Status:', error.response.status);
			console.log('Headers:', error.response.headers);
		}
	}
}

testFrontendFlow();
