#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🧪 Testing GPT Endpoint...\n');

async function testGPTEndpoint() {
	try {
		console.log('🚀 Testing /api/gpt/recipe endpoint...');

		const response = await fetch('http://localhost:3000/api/gpt/recipe', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				season: 'winter',
			}),
		});

		if (!response.ok) {
			console.log(`❌ Error: ${response.status} ${response.statusText}`);
			const errorText = await response.text();
			console.log(`Error details: ${errorText}`);
			return;
		}

		const data = await response.json();
		console.log('✅ Success! Response:');
		console.log(JSON.stringify(data, null, 2));

		if (data.recipe) {
			console.log('\n📋 Generated Recipe:');
			console.log(`- Title: ${data.recipe.title}`);
			console.log(`- Description: ${data.recipe.description}`);
			console.log(`- Prep Time: ${data.recipe.prepTime} minutes`);
			console.log(`- Cook Time: ${data.recipe.cookTime} minutes`);
			console.log(`- Servings: ${data.recipe.servings}`);
			console.log(`- Storage Time: ${data.recipe.storageTime} days`);
			console.log(
				`- Ingredients: ${data.recipe.ingredients?.length || 0} items`
			);
			console.log(`- Tags: ${data.recipe.tags?.join(', ') || 'None'}`);
		}
	} catch (error) {
		console.error('❌ Error testing endpoint:', error.message);
		if (error.code === 'ECONNREFUSED') {
			console.log('💡 Make sure the server is running on port 3000');
		}
	}
}

// Run the test
testGPTEndpoint().catch(console.error);
