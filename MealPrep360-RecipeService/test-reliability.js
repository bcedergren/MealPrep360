import 'dotenv/config';
import { MealPrep360Service } from './dist/services/mealPrep360Service.js';
import { logger } from './dist/services/logger.js';

async function testReliability() {
	console.log('🔍 Testing Recipe Generation Reliability Issues...\n');

	const service = MealPrep360Service.getInstance();
	const issues = [];

	// Test 1: JSON Parsing Issues
	console.log('1. Testing JSON parsing reliability...');
	try {
		const recipeNames = await service.generateRecipeNames('winter', 5);
		console.log('   ✅ Recipe names generation successful');
	} catch (error) {
		console.log(`   ❌ Recipe names failed: ${error.message}`);
		issues.push(`JSON parsing in recipe names: ${error.message}`);
	}

	// Test 2: Recipe Generation with Validation
	console.log('\n2. Testing recipe generation with validation...');
	try {
		const recipe = await service.generateRecipe({
			season: 'winter',
			recipeName: 'Beef Stew',
		});
		console.log(`   ✅ Recipe generation successful: ${recipe.title}`);

		// Validate all required fields
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
		];

		for (const field of requiredFields) {
			if (!recipe[field]) {
				issues.push(`Missing required field: ${field}`);
			}
		}

		if (recipe.ingredients.length === 0) {
			issues.push('Empty ingredients array');
		}
	} catch (error) {
		console.log(`   ❌ Recipe generation failed: ${error.message}`);
		issues.push(`Recipe generation: ${error.message}`);
	}

	// Test 3: Image Prompt Generation
	console.log('\n3. Testing image prompt generation...');
	try {
		const imagePrompt = await service.createImagePrompt('Chicken Casserole');
		console.log(
			`   ✅ Image prompt successful: ${imagePrompt.substring(0, 50)}...`
		);
	} catch (error) {
		console.log(`   ❌ Image prompt failed: ${error.message}`);
		issues.push(`Image prompt generation: ${error.message}`);
	}

	// Test 4: Classification
	console.log('\n4. Testing recipe classification...');
	try {
		const classification = await service.classifyFreezerFriendly({
			title: 'Beef Stew',
			extendedIngredients: [{ original: 'beef, potatoes, carrots' }],
			instructions: 'Cook beef, add vegetables, simmer',
		});
		console.log(
			`   ✅ Classification successful: ${classification.freezerFriendly}`
		);
	} catch (error) {
		console.log(`   ❌ Classification failed: ${error.message}`);
		issues.push(`Recipe classification: ${error.message}`);
	}

	// Test 5: Rate Limiting and Retry Logic
	console.log('\n5. Testing rate limiting and retry...');
	const promises = [];
	for (let i = 0; i < 3; i++) {
		promises.push(
			service
				.generateRecipeNames('winter', 3)
				.then((names) => ({ success: true, count: names.length }))
				.catch((error) => ({ success: false, error: error.message }))
		);
	}

	const results = await Promise.all(promises);
	const failures = results.filter((r) => !r.success);
	if (failures.length > 0) {
		console.log(
			`   ⚠️  ${failures.length} out of 3 concurrent requests failed`
		);
		failures.forEach((f) => issues.push(`Concurrent request: ${f.error}`));
	} else {
		console.log('   ✅ All concurrent requests successful');
	}

	// Summary
	console.log('\n' + '='.repeat(60));
	console.log('📊 RELIABILITY ISSUES FOUND');
	console.log('='.repeat(60));

	if (issues.length === 0) {
		console.log('🎉 No reliability issues detected!');
	} else {
		console.log(`Found ${issues.length} potential issues:`);
		issues.forEach((issue, index) => {
			console.log(`${index + 1}. ${issue}`);
		});

		console.log('\n🔧 RECOMMENDED FIXES:');
		console.log('1. Add retry logic with exponential backoff');
		console.log('2. Implement better JSON parsing with fallback strategies');
		console.log('3. Add request rate limiting');
		console.log('4. Improve error handling and validation');
		console.log('5. Add circuit breaker pattern for API calls');
	}
}

testReliability().catch(console.error);
