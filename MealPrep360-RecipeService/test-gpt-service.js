#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🧪 Testing GPT Service Integration...\n');

console.log('📋 Environment Variables:');
console.log(
	`- OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'Set' : 'Not set'}`
);
console.log(
	`- OPENAI_GPT_ID: ${process.env.OPENAI_GPT_ID ? 'Set' : 'Not set'}`
);

// Test GPT Service
async function testGPTService() {
	console.log('\n🚀 Testing GPT Service...');

	if (!process.env.OPENAI_API_KEY) {
		console.log('❌ OpenAI API key not configured');
		return;
	}

	try {
		// Import the GPT service
		const { GPTService } = await import('./dist/services/gptService.js');
		const gptService = GPTService.getInstance();

		console.log('\n📝 Testing recipe name generation...');
		const recipeNames = await gptService.generateRecipeNames('winter', 5);
		console.log('✅ Recipe names generated:', recipeNames);

		console.log('\n🍳 Testing recipe generation...');
		const recipe = await gptService.generateRecipe({
			season: 'winter',
			recipeName: 'Hearty Winter Beef Stew',
		});

		console.log('✅ Recipe generated:');
		console.log(`- Title: ${recipe.title}`);
		console.log(`- Description: ${recipe.description}`);
		console.log(`- Prep Time: ${recipe.prepTime} minutes`);
		console.log(`- Cook Time: ${recipe.cookTime} minutes`);
		console.log(`- Servings: ${recipe.servings}`);
		console.log(`- Storage Time: ${recipe.storageTime} days`);
		console.log(`- Ingredients: ${recipe.ingredients.length} items`);
		console.log(`- Tags: ${recipe.tags.join(', ')}`);

		console.log('\n🎉 SUCCESS! GPT Service integration is working correctly!');
	} catch (error) {
		console.error('❌ Error testing GPT Service:', error.message);
		console.error('Stack trace:', error.stack);
	}
}

// Run the test
testGPTService().catch(console.error);
