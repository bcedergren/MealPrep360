import { RecipeGenerator } from './dist/services/recipeGenerator.js';
import { logger } from './dist/services/logger.js';

async function testConsistency() {
	console.log('🧪 Testing Recipe Generation Consistency...\n');

	const recipeGenerator = new RecipeGenerator();
	const testResults = {
		totalTests: 0,
		successfulTests: 0,
		failedTests: 0,
		errors: [],
	};

	const testCases = [
		{ name: 'Recipe Names Generation', count: 5 },
		{ name: 'Single Recipe Generation', count: 3 },
		{ name: 'Recipe Classification', count: 3 },
		{ name: 'Image Prompt Generation', count: 3 },
	];

	for (const testCase of testCases) {
		console.log(`\n📋 Testing: ${testCase.name}`);
		console.log(`Running ${testCase.count} iterations...\n`);

		for (let i = 1; i <= testCase.count; i++) {
			testResults.totalTests++;

			try {
				console.log(`  Iteration ${i}/${testCase.count}:`);

				let result;
				switch (testCase.name) {
					case 'Recipe Names Generation':
						result = await recipeGenerator.generateRecipeNames('winter', 5);
						console.log(`    ✅ Generated ${result.length} recipe names`);
						break;

					case 'Single Recipe Generation':
						result = await recipeGenerator.generateRecipe(
							'Chicken Casserole',
							'winter'
						);
						console.log(`    ✅ Generated recipe: ${result.title}`);
						break;

					case 'Recipe Classification':
						result = await recipeGenerator.classifyRecipe({
							title: 'Beef Stew',
							ingredients: ['beef', 'potatoes', 'carrots'],
							instructions: ['Cook beef', 'Add vegetables', 'Simmer'],
						});
						console.log(`    ✅ Classified as: ${result.category}`);
						break;

					case 'Image Prompt Generation':
						result = await recipeGenerator.generateImagePrompt(
							'Beef Stew',
							'winter'
						);
						console.log(
							`    ✅ Generated image prompt: ${result.substring(0, 50)}...`
						);
						break;
				}

				testResults.successfulTests++;
			} catch (error) {
				testResults.failedTests++;
				testResults.errors.push({
					test: testCase.name,
					iteration: i,
					error: error.message,
				});
				console.log(`    ❌ Failed: ${error.message}`);
			}

			// Small delay between tests to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}

	// Summary
	console.log('\n' + '='.repeat(60));
	console.log('📊 CONSISTENCY TEST RESULTS');
	console.log('='.repeat(60));
	console.log(`Total Tests: ${testResults.totalTests}`);
	console.log(`Successful: ${testResults.successfulTests}`);
	console.log(`Failed: ${testResults.failedTests}`);
	console.log(
		`Success Rate: ${((testResults.successfulTests / testResults.totalTests) * 100).toFixed(1)}%`
	);

	if (testResults.errors.length > 0) {
		console.log('\n❌ ERRORS ENCOUNTERED:');
		testResults.errors.forEach((error, index) => {
			console.log(
				`${index + 1}. ${error.test} (Iteration ${error.iteration}): ${error.error}`
			);
		});
	}

	console.log('\n' + '='.repeat(60));

	if (testResults.successfulTests === testResults.totalTests) {
		console.log(
			'🎉 ALL TESTS PASSED! Recipe generation is consistent and reliable.'
		);
	} else if (testResults.successfulTests / testResults.totalTests >= 0.8) {
		console.log(
			'✅ Recipe generation is mostly reliable with some occasional issues.'
		);
	} else {
		console.log(
			'⚠️  Recipe generation has significant reliability issues that need attention.'
		);
	}
}

// Run the test
testConsistency().catch(console.error);
