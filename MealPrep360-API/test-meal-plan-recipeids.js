const fetch = require('node-fetch');

async function testMealPlanWithRecipeIds() {
	const baseUrl = 'http://localhost:3000';
	const token = 'YOUR_AUTH_TOKEN_HERE'; // Replace with actual token

	const testData = {
		startDate: '2024-01-01',
		endDate: '2024-01-03',
		recipeIds: [
			'507f1f77bcf86cd799439011',
			'507f1f77bcf86cd799439012',
			'507f1f77bcf86cd799439013',
		],
		servings: 4,
	};

	try {
		console.log('🧪 Testing meal plan creation with recipeIds...');
		console.log('📝 Request data:', testData);

		const response = await fetch(`${baseUrl}/api/meal-plans`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(testData),
		});

		const result = await response.json();

		console.log('📊 Response status:', response.status);
		console.log('📄 Response body:', JSON.stringify(result, null, 2));

		if (response.ok) {
			console.log('✅ Test passed! Meal plan created successfully');
		} else {
			console.log('❌ Test failed! Error:', result.error);
		}
	} catch (error) {
		console.error('💥 Test error:', error);
	}
}

// Run the test
testMealPlanWithRecipeIds();
