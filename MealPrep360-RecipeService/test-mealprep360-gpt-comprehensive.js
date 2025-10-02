import 'dotenv/config';
import fetch from 'node-fetch';

async function testMealPrep360GPT() {
	console.log('🧪 Testing MealPrep360 GPT...\n');

	const apiKey = process.env.OPENAI_API_KEY;
	const gptId =
		process.env.OPENAI_GPT_ID || 'g-685026fe87088191bfdeea1127d36635';

	if (!apiKey) {
		console.log('❌ OPENAI_API_KEY environment variable is required');
		return;
	}

	console.log(`📋 Using GPT ID: ${gptId}\n`);

	// Test 1: Basic Recipe Generation
	console.log('🔍 Test 1: Basic Recipe Generation');
	await testRecipeGeneration(apiKey, gptId);

	// Test 2: Recipe Name Generation
	console.log('\n🔍 Test 2: Recipe Name Generation');
	await testRecipeNames(apiKey, gptId);

	// Test 3: Image Generation Prompt
	console.log('\n🔍 Test 3: Image Generation Prompt');
	await testImagePrompt(apiKey, gptId);

	// Test 4: Freezer-Friendly Classification
	console.log('\n🔍 Test 4: Freezer-Friendly Classification');
	await testFreezerClassification(apiKey, gptId);

	// Test 5: Seasonal Recipe with Specific Requirements
	console.log('\n🔍 Test 5: Seasonal Recipe with Specific Requirements');
	await testSeasonalRecipe(apiKey, gptId);
}

async function testRecipeGeneration(apiKey, gptId) {
	try {
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model: gptId,
				messages: [
					{
						role: 'system',
						content:
							'You are MealPrep360, a professional chef specializing in structured freezer-friendly recipes. Always respond with valid JSON that follows the exact recipe schema.',
					},
					{
						role: 'user',
						content:
							'Generate a detailed freezer-friendly recipe for winter season.',
					},
				],
				max_tokens: 4000,
				temperature: 0.7,
				response_format: { type: 'json_object' },
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.log(`❌ API error (${response.status}): ${errorText}`);
			return;
		}

		const data = await response.json();
		const content = data.choices?.[0]?.message?.content;

		if (!content) {
			console.log('❌ No content received');
			return;
		}

		console.log('✅ Recipe generation response received');
		console.log('📊 Response length:', content.length, 'characters');

		// Try to parse JSON
		try {
			const recipe = JSON.parse(content);
			console.log('✅ Valid JSON response');

			// Validate required fields
			const requiredFields = [
				'title',
				'description',
				'ingredients',
				'prepInstructions',
				'prepTime',
				'cookTime',
				'servings',
				'tags',
				'storageTime',
				'containerSuggestions',
				'defrostInstructions',
				'cookingInstructions',
				'servingInstructions',
				'allergenInfo',
				'dietaryInfo',
				'season',
			];

			const missingFields = requiredFields.filter((field) => !recipe[field]);
			if (missingFields.length > 0) {
				console.log('❌ Missing required fields:', missingFields.join(', '));
			} else {
				console.log('✅ All required fields present');
			}

			// Check specific validations
			if (recipe.description && recipe.description.length > 150) {
				console.log('❌ Description exceeds 150 characters');
			} else {
				console.log('✅ Description length is appropriate');
			}

			if (recipe.cookTime < 1) {
				console.log('❌ Cook time is less than 1 minute');
			} else {
				console.log('✅ Cook time is valid');
			}

			console.log('📝 Recipe title:', recipe.title);
			console.log('📝 Season:', recipe.season);
		} catch (parseError) {
			console.log('❌ Invalid JSON response:', parseError.message);
			console.log(
				'📄 Raw response preview:',
				content.substring(0, 200) + '...'
			);
		}
	} catch (error) {
		console.log('❌ Test failed:', error.message);
	}
}

async function testRecipeNames(apiKey, gptId) {
	try {
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model: gptId,
				messages: [
					{
						role: 'system',
						content:
							'You are MealPrep360, a professional chef. Always respond with valid JSON arrays of recipe names.',
					},
					{
						role: 'user',
						content:
							'Generate 10 freezer-friendly recipe names for spring season.',
					},
				],
				max_tokens: 2000,
				temperature: 0.8,
				response_format: { type: 'json_object' },
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.log(`❌ API error (${response.status}): ${errorText}`);
			return;
		}

		const data = await response.json();
		const content = data.choices?.[0]?.message?.content;

		if (!content) {
			console.log('❌ No content received');
			return;
		}

		console.log('✅ Recipe names response received');

		try {
			const result = JSON.parse(content);
			let recipeNames = [];

			// Handle different response formats
			if (Array.isArray(result)) {
				recipeNames = result;
			} else if (result.recipes && Array.isArray(result.recipes)) {
				recipeNames = result.recipes;
			} else if (result.names && Array.isArray(result.names)) {
				recipeNames = result.names;
			} else {
				console.log('❌ Unexpected response format');
				return;
			}

			console.log('✅ Valid recipe names array');
			console.log('📊 Number of names generated:', recipeNames.length);
			console.log('📝 Sample names:', recipeNames.slice(0, 3));
		} catch (parseError) {
			console.log('❌ Invalid JSON response:', parseError.message);
		}
	} catch (error) {
		console.log('❌ Test failed:', error.message);
	}
}

async function testImagePrompt(apiKey, gptId) {
	try {
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model: gptId,
				messages: [
					{
						role: 'system',
						content:
							'You are MealPrep360, a professional chef. Create detailed DALL-E image generation prompts.',
					},
					{
						role: 'user',
						content:
							'Create a DALL-E prompt for a "Beef and Vegetable Stew" recipe.',
					},
				],
				max_tokens: 500,
				temperature: 0.7,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.log(`❌ API error (${response.status}): ${errorText}`);
			return;
		}

		const data = await response.json();
		const content = data.choices?.[0]?.message?.content;

		if (!content) {
			console.log('❌ No content received');
			return;
		}

		console.log('✅ Image prompt response received');
		console.log('📝 Generated prompt:', content);
	} catch (error) {
		console.log('❌ Test failed:', error.message);
	}
}

async function testFreezerClassification(apiKey, gptId) {
	try {
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model: gptId,
				messages: [
					{
						role: 'system',
						content:
							'You are MealPrep360, a professional chef. Analyze recipes for freezer-friendliness.',
					},
					{
						role: 'user',
						content:
							'Is this recipe suitable for freezing? Title: "Fresh Garden Salad" Ingredients: lettuce, tomatoes, cucumbers, olive oil Instructions: Mix all ingredients and serve immediately',
					},
				],
				max_tokens: 500,
				temperature: 0.3,
				response_format: { type: 'json_object' },
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.log(`❌ API error (${response.status}): ${errorText}`);
			return;
		}

		const data = await response.json();
		const content = data.choices?.[0]?.message?.content;

		if (!content) {
			console.log('❌ No content received');
			return;
		}

		console.log('✅ Classification response received');

		try {
			const result = JSON.parse(content);
			console.log('✅ Valid JSON response');
			console.log('📊 Freezer-friendly:', result.freezerFriendly);
			console.log('📝 Reason:', result.reason);
		} catch (parseError) {
			console.log('❌ Invalid JSON response:', parseError.message);
		}
	} catch (error) {
		console.log('❌ Test failed:', error.message);
	}
}

async function testSeasonalRecipe(apiKey, gptId) {
	try {
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model: gptId,
				messages: [
					{
						role: 'system',
						content:
							'You are MealPrep360, a professional chef specializing in structured freezer-friendly recipes. Always respond with valid JSON that follows the exact recipe schema.',
					},
					{
						role: 'user',
						content:
							'Generate a freezer-friendly recipe for summer season. Must include zucchini and tomatoes. Dietary restriction: vegetarian. Servings: 4.',
					},
				],
				max_tokens: 4000,
				temperature: 0.7,
				response_format: { type: 'json_object' },
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.log(`❌ API error (${response.status}): ${errorText}`);
			return;
		}

		const data = await response.json();
		const content = data.choices?.[0]?.message?.content;

		if (!content) {
			console.log('❌ No content received');
			return;
		}

		console.log('✅ Seasonal recipe response received');

		try {
			const recipe = JSON.parse(content);
			console.log('✅ Valid JSON response');

			// Check if requirements were met
			const ingredients =
				recipe.ingredients?.map((ing) => ing.name.toLowerCase()) || [];
			const hasZucchini = ingredients.some((ing) => ing.includes('zucchini'));
			const hasTomatoes = ingredients.some((ing) => ing.includes('tomato'));
			const isVegetarian = recipe.dietaryInfo?.some((info) =>
				info.toLowerCase().includes('vegetarian')
			);
			const correctServings = recipe.servings === 4;

			console.log('📊 Requirements check:');
			console.log('  - Includes zucchini:', hasZucchini ? '✅' : '❌');
			console.log('  - Includes tomatoes:', hasTomatoes ? '✅' : '❌');
			console.log('  - Vegetarian:', isVegetarian ? '✅' : '❌');
			console.log('  - 4 servings:', correctServings ? '✅' : '❌');

			console.log('📝 Recipe title:', recipe.title);
			console.log('📝 Season:', recipe.season);
		} catch (parseError) {
			console.log('❌ Invalid JSON response:', parseError.message);
		}
	} catch (error) {
		console.log('❌ Test failed:', error.message);
	}
}

// Run the tests
testMealPrep360GPT().catch(console.error);
