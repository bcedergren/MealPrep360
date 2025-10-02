// Test script for shopping list generation
const axios = require('axios');

async function testShoppingListGeneration() {
	try {
		console.log('🧪 Testing shopping list generation...');

		// Test data with recipes sent directly
		const testData = {
			userId: 'test-user-123',
			recipes: [
				{
					_id: 'recipe-1',
					title: 'Test Recipe 1',
					ingredients: [
						{
							name: 'Chicken breast',
							amount: 2,
							unit: 'lb',
							category: 'Meat',
						},
						{
							name: 'Rice',
							amount: 1,
							unit: 'cup',
							category: 'Pantry',
						},
					],
				},
				{
					_id: 'recipe-2',
					title: 'Test Recipe 2',
					ingredients: [
						{
							name: 'Chicken breast',
							amount: 1,
							unit: 'lb',
							category: 'Meat',
						},
						{
							name: 'Broccoli',
							amount: 2,
							unit: 'cup',
							category: 'Produce',
						},
					],
				},
			],
			pantryExclusions: ['salt', 'pepper'],
		};

		console.log('📤 Sending test data:', JSON.stringify(testData, null, 2));

		const response = await axios.post(
			'http://localhost:3000/api/shopping-list',
			testData,
			{
				headers: {
					'Content-Type': 'application/json',
					'X-API-Key': 'dev-key',
				},
			}
		);

		console.log('✅ Test successful!');
		console.log(
			'📋 Generated shopping list:',
			JSON.stringify(response.data, null, 2)
		);
	} catch (error) {
		console.log('❌ Test failed:', error.response?.data || error.message);
		if (error.response) {
			console.log('Status:', error.response.status);
			console.log('Headers:', error.response.headers);
		}
		if (error.request) {
			console.log('Request was made but no response received');
		}
	}
}

testShoppingListGeneration();
