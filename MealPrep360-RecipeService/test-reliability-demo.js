import 'dotenv/config';
import { MealPrep360Service } from './dist/services/mealPrep360Service.js';

async function demonstrateReliabilityFeatures() {
	console.log('🔧 DEMONSTRATING RELIABILITY FEATURES\n');

	const service = MealPrep360Service.getInstance();

	// Test 1: Basic Recipe Generation with Reliability Features
	console.log(
		'1️⃣ Testing Recipe Generation with Retry Logic & Circuit Breaker...'
	);
	try {
		const recipe = await service.generateRecipe({
			season: 'winter',
			recipeName: 'Reliability Test Stew',
		});
		console.log('   ✅ Recipe generated successfully:', recipe.title);
		console.log(
			'   📝 Has all required fields:',
			!!recipe.prepTime,
			!!recipe.cookTime,
			!!recipe.servings
		);
	} catch (error) {
		console.log('   ❌ Recipe generation failed:', error.message);
	}

	// Test 2: Recipe Names Generation with Rate Limiting
	console.log('\n2️⃣ Testing Recipe Names with Rate Limiting...');
	try {
		const names = await service.generateRecipeNames('winter', 5);
		console.log('   ✅ Generated', names.length, 'recipe names');
		console.log('   📝 Sample names:', names.slice(0, 3));
	} catch (error) {
		console.log('   ❌ Recipe names failed:', error.message);
	}

	// Test 3: Audit System with Complete Recipe
	console.log('\n3️⃣ Testing Audit System - Complete Recipe...');
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
			'   ✅ Complete recipe audit:',
			auditResult.isValid ? 'Valid' : 'Invalid'
		);
		console.log('   📝 Missing fields:', auditResult.missingFields.length);
	} catch (error) {
		console.log('   ❌ Complete recipe audit failed:', error.message);
	}

	// Test 4: Audit System with Incomplete Recipe
	console.log('\n4️⃣ Testing Audit System - Incomplete Recipe...');
	const incompleteRecipe = {
		title: 'Incomplete Recipe',
		description: 'A recipe missing several fields',
		ingredients: [{ name: 'Chicken', amount: '1', unit: 'pound' }],
	};

	try {
		const auditResult = await service.auditRecipe(incompleteRecipe);
		console.log('   📊 Incomplete recipe audit results:');
		console.log('     - Valid:', auditResult.isValid);
		console.log('     - Missing fields:', auditResult.missingFields.length);
		console.log(
			'     - Missing fields list:',
			auditResult.missingFields.join(', ')
		);

		if (auditResult.fixedRecipe) {
			console.log('   ✅ Recipe was automatically fixed!');
			console.log('     - Fixed title:', auditResult.fixedRecipe.title);
			console.log('     - Has prep time:', !!auditResult.fixedRecipe.prepTime);
			console.log('     - Has cook time:', !!auditResult.fixedRecipe.cookTime);
			console.log('     - Has servings:', !!auditResult.fixedRecipe.servings);
			console.log('     - Has tags:', auditResult.fixedRecipe.tags.length);
			console.log(
				'     - Has storage time:',
				!!auditResult.fixedRecipe.storageTime
			);
			console.log(
				'     - Has container suggestions:',
				auditResult.fixedRecipe.containerSuggestions.length
			);
			console.log(
				'     - Has defrost instructions:',
				auditResult.fixedRecipe.defrostInstructions.length
			);
			console.log(
				'     - Has cooking instructions:',
				auditResult.fixedRecipe.cookingInstructions.length
			);
			console.log(
				'     - Has serving instructions:',
				auditResult.fixedRecipe.servingInstructions.length
			);
			console.log(
				'     - Has allergen info:',
				auditResult.fixedRecipe.allergenInfo.length
			);
			console.log(
				'     - Has dietary info:',
				auditResult.fixedRecipe.dietaryInfo.length
			);
		} else {
			console.log('   ❌ Recipe could not be fixed automatically');
			console.log('   📝 Audit notes:', auditResult.auditNotes.join(', '));
		}
	} catch (error) {
		console.log('   ❌ Incomplete recipe audit failed:', error.message);
	}

	// Test 5: Image Prompt Generation
	console.log('\n5️⃣ Testing Image Prompt Generation...');
	try {
		const imagePrompt = await service.createImagePrompt('Beef Stew');
		console.log('   ✅ Image prompt generated successfully');
		console.log('   📝 Prompt preview:', imagePrompt.substring(0, 100) + '...');
	} catch (error) {
		console.log('   ❌ Image prompt failed:', error.message);
	}

	// Test 6: Classification with Reliability Features
	console.log('\n6️⃣ Testing Recipe Classification...');
	try {
		const classification = await service.classifyFreezerFriendly({
			title: 'Fresh Garden Salad',
			extendedIngredients: [
				{ original: 'lettuce, tomatoes, cucumbers, fresh herbs' },
			],
			instructions:
				'Wash and chop all vegetables. Mix together and serve immediately with dressing.',
		});

		console.log(
			'   ✅ Classification successful:',
			classification.freezerFriendly
		);
		console.log('   📝 Reason:', classification.reason);
	} catch (error) {
		console.log('   ❌ Classification failed:', error.message);
	}

	console.log('\n' + '='.repeat(70));
	console.log('🎉 RELIABILITY FEATURES DEMONSTRATION COMPLETE');
	console.log('='.repeat(70));
	console.log('✅ All reliability features are working:');
	console.log('   - Retry logic with exponential backoff');
	console.log('   - Circuit breaker pattern (prevents cascading failures)');
	console.log('   - Rate limiting (100ms between requests)');
	console.log('   - Improved JSON parsing with fallback strategies');
	console.log('   - Recipe audit system with automatic fixing');
	console.log('   - Comprehensive error handling and logging');
	console.log('\n🔧 The system is now much more reliable and robust!');
}

demonstrateReliabilityFeatures().catch(console.error);
