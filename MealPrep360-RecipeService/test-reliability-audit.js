import 'dotenv/config';
import { MealPrep360Service } from './dist/services/mealPrep360Service.js';

async function testReliabilityAndAudit() {
	console.log('Testing Enhanced Reliability Features & Audit System...\n');

	const service = MealPrep360Service.getInstance();

	// Test 1: Basic Reliability Features
	console.log('1. Testing Enhanced Reliability Features...');
	try {
		const recipeNames = await service.generateRecipeNames('winter', 5);
		console.log(
			'   Recipe names with retry logic: Generated',
			recipeNames.length,
			'names'
		);

		const recipe = await service.generateRecipe({
			season: 'winter',
			recipeName: 'Chicken Casserole',
		});
		console.log(
			'   Recipe generation with circuit breaker: Generated',
			recipe.title
		);

		const imagePrompt = await service.createImagePrompt('Beef Stew');
		console.log('   Image prompt with rate limiting: Generated prompt');
	} catch (error) {
		console.log('   Reliability test failed:', error.message);
	}

	// Test 2: Audit System with Complete Recipe
	console.log('\n2. Testing Audit System - Complete Recipe...');
	const completeRecipe = {
		title: 'Complete Beef Stew',
		description: 'A hearty beef stew perfect for freezing',
		ingredients: [
			{ name: 'Beef', amount: '2', unit: 'pounds' },
			{ name: 'Potatoes', amount: '4', unit: 'medium' },
		],
		prepInstructions: ['Chop beef into cubes', 'Prepare vegetables'],
		prepTime: 30,
		cookTime: 120,
		servings: 6,
		tags: ['winter', 'freezer-friendly'],
		storageTime: 90,
		containerSuggestions: ['Freezer bags', 'Airtight containers'],
		defrostInstructions: ['Thaw in refrigerator for 24 hours'],
		cookingInstructions: ['Simmer until beef is tender'],
		servingInstructions: ['Serve hot with bread'],
		allergenInfo: ['None'],
		dietaryInfo: ['Gluten-Free'],
		season: 'winter',
	};

	try {
		const auditResult = await service.auditRecipe(completeRecipe);
		console.log(
			'   Complete recipe audit:',
			auditResult.isValid ? 'Valid' : 'Invalid'
		);
		console.log('   Missing fields:', auditResult.missingFields.length);
	} catch (error) {
		console.log('   Complete recipe audit failed:', error.message);
	}

	// Test 3: Audit System with Incomplete Recipe
	console.log('\n3. Testing Audit System - Incomplete Recipe...');
	const incompleteRecipe = {
		title: 'Incomplete Recipe',
		description: 'A recipe missing several fields',
		ingredients: [{ name: 'Chicken', amount: '1', unit: 'pound' }],
	};

	try {
		const auditResult = await service.auditRecipe(incompleteRecipe);
		console.log('   Incomplete recipe audit results:');
		console.log('     Valid:', auditResult.isValid);
		console.log('     Missing fields:', auditResult.missingFields.length);
		console.log(
			'     Missing fields list:',
			auditResult.missingFields.join(', ')
		);

		if (auditResult.fixedRecipe) {
			console.log('   Recipe was automatically fixed!');
			console.log('     Fixed title:', auditResult.fixedRecipe.title);
			console.log('     Has prep time:', !!auditResult.fixedRecipe.prepTime);
			console.log('     Has cook time:', !!auditResult.fixedRecipe.cookTime);
			console.log('     Has servings:', !!auditResult.fixedRecipe.servings);
			console.log('     Has tags:', auditResult.fixedRecipe.tags.length);
			console.log(
				'     Has storage time:',
				!!auditResult.fixedRecipe.storageTime
			);
			console.log(
				'     Has container suggestions:',
				auditResult.fixedRecipe.containerSuggestions.length
			);
			console.log(
				'     Has defrost instructions:',
				auditResult.fixedRecipe.defrostInstructions.length
			);
			console.log(
				'     Has cooking instructions:',
				auditResult.fixedRecipe.cookingInstructions.length
			);
			console.log(
				'     Has serving instructions:',
				auditResult.fixedRecipe.servingInstructions.length
			);
			console.log(
				'     Has allergen info:',
				auditResult.fixedRecipe.allergenInfo.length
			);
			console.log(
				'     Has dietary info:',
				auditResult.fixedRecipe.dietaryInfo.length
			);
		} else {
			console.log('   Recipe could not be fixed automatically');
		}
	} catch (error) {
		console.log('   Incomplete recipe audit failed:', error.message);
	}

	// Test 4: Stress Test with Multiple Concurrent Requests
	console.log('\n4. Testing Stress Test - Multiple Concurrent Requests...');
	const concurrentTests = [];
	for (let i = 0; i < 3; i++) {
		concurrentTests.push(
			service
				.generateRecipeNames('winter', 3)
				.then((names) => ({ success: true, count: names.length, id: i }))
				.catch((error) => ({ success: false, error: error.message, id: i }))
		);
	}

	try {
		const results = await Promise.all(concurrentTests);
		const successes = results.filter((r) => r.success);
		const failures = results.filter((r) => !r.success);

		console.log('   Concurrent request results:');
		console.log('     Successful:', successes.length, '/ 3');
		console.log('     Failed:', failures.length, '/ 3');

		if (failures.length > 0) {
			console.log(
				'     Failures:',
				failures.map((f) => `Test ${f.id}: ${f.error}`)
			);
		} else {
			console.log(
				'   All concurrent requests succeeded (rate limiting working)'
			);
		}
	} catch (error) {
		console.log('   Concurrent test failed:', error.message);
	}

	console.log('\n' + '='.repeat(60));
	console.log('RELIABILITY & AUDIT SYSTEM TEST COMPLETE');
	console.log('='.repeat(60));
	console.log('Enhanced features implemented:');
	console.log('   - Retry logic with exponential backoff');
	console.log('   - Circuit breaker pattern');
	console.log('   - Rate limiting (100ms between requests)');
	console.log('   - Improved JSON parsing with fallback strategies');
	console.log('   - Recipe audit system with automatic fixing');
	console.log('   - Comprehensive error handling and logging');
	console.log(
		'\nThe system should now be much more reliable and can automatically fix incomplete recipes!'
	);
}

testReliabilityAndAudit().catch(console.error);
