#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🧪 Testing MealPrep360 GPT Integration...\n');

console.log('📋 Environment Variables:');
console.log(
	`- OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'Set' : 'Not set'}`
);
console.log(
	`- OPENAI_GPT_ID: ${process.env.OPENAI_GPT_ID ? 'Set' : 'Not set'}`
);
console.log(`- OPENAI_MODEL: ${process.env.OPENAI_MODEL ? 'Set' : 'Not set'}`);

console.log('\n🔧 Configuration:');
const model =
	process.env.OPENAI_MODEL ||
	process.env.OPENAI_GPT_ID ||
	'g-685026fe87088191bfdeea1127d36635';
console.log(`- OpenAI Model: ${model}`);
console.log(
	`- OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Set' : 'Not set'}`
);

// Test MealPrep360 GPT API call
async function testMealPrep360GPT() {
	console.log('\n🚀 Testing MealPrep360 GPT API call...');

	if (!process.env.OPENAI_API_KEY) {
		console.log('❌ OpenAI API key not configured');
		return;
	}

	try {
		// Test recipe name generation
		console.log('\n📝 Testing recipe name generation...');
		const nameResponse = await fetch(
			'https://api.openai.com/v1/chat/completions',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
				},
				body: JSON.stringify({
					model: model,
					messages: [
						{
							role: 'system',
							content:
								'You are MealPrep360, a professional chef. Always respond with valid JSON arrays of recipe names.',
						},
						{
							role: 'user',
							content:
								'Generate 5 freezer-friendly recipe names for winter season. Return only a JSON array of recipe names as strings.',
						},
					],
					max_tokens: 1000,
					temperature: 0.8,
					response_format: { type: 'json_object' },
				}),
			}
		);

		if (!nameResponse.ok) {
			const errorText = await nameResponse.text();
			console.log(`❌ GPT API error (${nameResponse.status}): ${errorText}`);
			return;
		}

		const nameData = await nameResponse.json();
		console.log('✅ Recipe names response:', {
			model: nameData.model,
			content: nameData.choices?.[0]?.message?.content,
			usage: nameData.usage,
		});

		// Test recipe generation
		console.log('\n🍳 Testing recipe generation...');
		const recipeResponse = await fetch(
			'https://api.openai.com/v1/chat/completions',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
				},
				body: JSON.stringify({
					model: model,
					messages: [
						{
							role: 'system',
							content:
								'You are MealPrep360, a professional chef specializing in structured freezer-friendly recipes. Always respond with valid JSON that follows the exact recipe schema.',
						},
						{
							role: 'user',
							content: `Generate a detailed freezer-friendly recipe for winter season.
						
						Return a JSON object with the following structure:
						{
							"title": "Recipe Name",
							"description": "Brief description of the dish",
							"ingredients": [
								{"name": "ingredient name", "amount": number, "unit": "unit of measurement"}
							],
							"prepInstructions": "Step-by-step prep instructions",
							"prepTime": number (in minutes),
							"cookTime": number (in minutes),
							"servings": number,
							"tags": ["tag1", "tag2"],
							"storageTime": number (in days),
							"containerSuggestions": ["container type 1", "container type 2"],
							"defrostInstructions": "How to defrost the meal",
							"cookingInstructions": "How to cook the meal",
							"servingInstructions": "How to serve the meal"
						}`,
						},
					],
					max_tokens: 3000,
					temperature: 0.7,
					response_format: { type: 'json_object' },
				}),
			}
		);

		if (!recipeResponse.ok) {
			const errorText = await recipeResponse.text();
			console.log(`❌ GPT API error (${recipeResponse.status}): ${errorText}`);
			return;
		}

		const recipeData = await recipeResponse.json();
		console.log('✅ Recipe generation response:', {
			model: recipeData.model,
			content: recipeData.choices?.[0]?.message?.content,
			usage: recipeData.usage,
		});

		// Parse and validate the recipe
		try {
			const recipe = JSON.parse(recipeData.choices?.[0]?.message?.content);
			console.log('\n📋 Generated Recipe:');
			console.log(`- Title: ${recipe.title}`);
			console.log(`- Description: ${recipe.description}`);
			console.log(`- Prep Time: ${recipe.prepTime} minutes`);
			console.log(`- Cook Time: ${recipe.cookTime} minutes`);
			console.log(`- Servings: ${recipe.servings}`);
			console.log(`- Storage Time: ${recipe.storageTime} days`);
			console.log(`- Ingredients: ${recipe.ingredients?.length || 0} items`);
			console.log(`- Tags: ${recipe.tags?.join(', ') || 'None'}`);
		} catch (parseError) {
			console.log('❌ Failed to parse recipe JSON:', parseError.message);
		}

		if (recipeData.model && recipeData.model.includes('g-')) {
			console.log('\n🎉 SUCCESS! MealPrep360 GPT is working correctly!');
		} else {
			console.log('\n⚠️ Using standard GPT model, not custom GPT');
		}
	} catch (error) {
		console.error('❌ Error testing MealPrep360 GPT:', error.message);
	}
}

// Run the test
testMealPrep360GPT().catch(console.error);
