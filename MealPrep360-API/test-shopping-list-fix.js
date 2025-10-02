const fetch = require('node-fetch');

async function testShoppingListGeneration() {
	console.log('🧪 Testing shopping list generation fix...');

	try {
		// Test the endpoint with a sample meal plan ID
		const response = await fetch(
			'http://localhost:3000/api/shopping-lists/generate',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer test-token', // This will trigger debug mode
				},
				body: JSON.stringify({
					mealPlanId: '687d210886422f8c952c1817', // The meal plan ID from the error
					startDate: '2024-01-01',
					endDate: '2024-01-07',
				}),
			}
		);

		console.log('📊 Response status:', response.status);

		if (response.ok) {
			const data = await response.json();
			console.log('✅ Success! Shopping list generated:');
			console.log('   - ID:', data.shoppingList._id);
			console.log('   - Items count:', data.shoppingList.items.length);
			console.log('   - Name:', data.shoppingList.name);

			if (data.warning) {
				console.log('   - Warning:', data.warning);
			}

			// Show first few items
			console.log('   - Sample items:');
			data.shoppingList.items.slice(0, 3).forEach((item, index) => {
				console.log(
					`     ${index + 1}. ${item.quantity} ${item.unit} ${item.name} (${item.category})`
				);
			});
		} else {
			const errorData = await response.text();
			console.log('❌ Error response:', errorData);
		}
	} catch (error) {
		console.error('❌ Test failed:', error.message);
	}
}

// Run the test
testShoppingListGeneration();
