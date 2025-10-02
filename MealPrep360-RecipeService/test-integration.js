import 'dotenv/config';
console.log('🚀 Testing MealPrep360 Integration...\n');

process.on('unhandledRejection', (reason, promise) => {
	console.error('❌ Unhandled Rejection:', reason);
});

try {
	const { RecipeGenerator } = await import(
		'./dist/services/recipeGenerator.js'
	);

	async function testIntegration() {
		console.log(
			'🧪 Testing RecipeGenerator with MealPrep360Service integration...\n'
		);

		try {
			const recipeGenerator = RecipeGenerator.getInstance();

			// Test 1: Generate Recipe Names
			console.log('🔍 Test 1: Generate Recipe Names');
			const recipeNames = await recipeGenerator.generateRecipeNames('winter');
			console.log('✅ Recipe names generated:', recipeNames.length);
			console.log('📝 Sample names:', recipeNames.slice(0, 3));

			// Test 2: Generate a Single Recipe
			console.log('\n🔍 Test 2: Generate Single Recipe');
			const recipe = await recipeGenerator.generateRecipe('winter');
			console.log('✅ Recipe generated successfully');
			console.log('📝 Recipe title:', recipe.title);
			console.log('📝 Season:', recipe.season);
			console.log('📝 Ingredients count:', recipe.ingredients.length);
			console.log('📝 Has allergen info:', !!recipe.allergenInfo);
			console.log('📝 Has dietary info:', !!recipe.dietaryInfo);

			// Test 3: Test Freezer-Friendly Classification
			console.log('\n🔍 Test 3: Freezer-Friendly Classification');
			const testRecipe = {
				title: 'Fresh Garden Salad',
				extendedIngredients: [{ original: 'lettuce, tomatoes, cucumbers' }],
				instructions: 'Mix all ingredients and serve immediately',
			};
			const classification =
				await recipeGenerator.classifyFreezerFriendly(testRecipe);
			console.log('✅ Classification result:', classification);

			console.log('\n🎉 All integration tests passed!');
		} catch (error) {
			console.log('❌ Integration test failed:', error.message);
		}
	}

	// Run the integration test
	testIntegration().catch(console.error);
} catch (importError) {
	console.error('❌ Import error:', importError);
}
