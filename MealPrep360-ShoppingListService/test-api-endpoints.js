const axios = require('axios');

async function testAllEndpoints() {
	const baseUrl = 'http://localhost:3000';
	const testData = {
		userId: 'test-user-123',
		recipes: [
			{
				_id: 'recipe-1',
				title: 'Chicken Recipe 1',
				ingredients: [
					{ name: 'chicken breasts', amount: 2, unit: 'piece', category: 'Meat' },
					{ name: 'chicken broth', amount: 1, unit: 'cup', category: 'Pantry' },
				],
			},
			{
				_id: 'recipe-2',
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
				_id: 'recipe-3',
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
		],
		pantryExclusions: ['salt', 'pepper'],
	};

	const endpoints = [
		'/api/shopping-list',
		'/api/shopping-lists/generate',
	];

	console.log('🧪 Testing all API endpoints...\n');

	for (const endpoint of endpoints) {
		try {
			console.log(`📡 Testing endpoint: ${endpoint}`);
			
			const response = await axios.post(`${baseUrl}${endpoint}`, testData, {
				headers: {
					'Content-Type': 'application/json',
					'X-API-Key': 'dev-key',
				},
			});

			console.log(`✅ ${endpoint} - SUCCESS`);
			console.log(`   Status: ${response.status}`);
			console.log(`   Items: ${response.data.shoppingList?.items?.length || 'N/A'}`);
			
			// Check if our fixes are working
			if (response.data.shoppingList?.items) {
				const items = response.data.shoppingList.items;
				
				// Check chicken breast combination
				const chickenItems = items.filter(item => 
					item.name.toLowerCase().includes('chicken breast')
				);
				console.log(`   Chicken breast items: ${chickenItems.length} (should be 1)`);
				
				// Check broth categorization
				const brothItems = items.filter(item => 
					item.name.toLowerCase().includes('broth')
				);
				const pantryBrothItems = brothItems.filter(item => 
					item.category === 'Pantry'
				);
				console.log(`   Broth in Pantry: ${pantryBrothItems.length}/${brothItems.length}`);
				
				// Check shrimp unit
				const shrimpItems = items.filter(item => 
					item.name.toLowerCase().includes('shrimp')
				);
				const correctShrimpItems = shrimpItems.filter(item => 
					item.unit === 'g'
				);
				console.log(`   Shrimp with 'g' unit: ${correctShrimpItems.length}/${shrimpItems.length}`);
				
				// Show first few items
				console.log('   Sample items:');
				items.slice(0, 3).forEach((item, index) => {
					console.log(`     ${index + 1}. ${item.name} - ${item.amount} ${item.unit} (${item.category})`);
				});
			}
			
		} catch (error) {
			console.log(`❌ ${endpoint} - FAILED`);
			console.log(`   Error: ${error.response?.data?.error || error.message}`);
			console.log(`   Status: ${error.response?.status || 'N/A'}`);
		}
		
		console.log('');
	}

	console.log('🔍 Summary:');
	console.log('The frontend should be using one of these endpoints.');
	console.log('If the fixes are working in the API but not in the UI, the frontend might be:');
	console.log('1. Using a different endpoint');
	console.log('2. Caching old data');
	console.log('3. Using a different environment (staging vs production)');
	console.log('4. Having its own ingredient combination logic');
}

testAllEndpoints().catch(console.error); 