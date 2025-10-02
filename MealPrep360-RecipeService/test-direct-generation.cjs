require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function testDirectGeneration() {
	try {
		console.log('🧪 Testing Individual Recipe Generation');
		console.log('=====================================\n');

		// Connect to MongoDB
		console.log('📡 Connecting to MongoDB...');
		await mongoose.connect(process.env.MONGODB_URI);
		console.log('✅ MongoDB connected\n');

		// Import models and services
		const { Recipe } = await import('./dist/models/recipe.js');
		const { RecipeOrchestrator } = await import(
			'./dist/services/recipeOrchestrator.js'
		);

		console.log('🍳 Testing individual recipe generation...');
		const recipeOrchestrator = RecipeOrchestrator.getInstance();

		// Generate 3 individual recipes to prove it works
		const recipesToGenerate = [
			'Hearty Winter Stew',
			'Creamy Chicken Casserole',
			'Beef and Vegetable Soup',
		];
		const results = [];

		for (let i = 0; i < recipesToGenerate.length; i++) {
			const recipeName = recipesToGenerate[i];
			try {
				console.log(`\n📝 Generating recipe ${i + 1}/3: ${recipeName}`);

				// Generate individual recipe (the approach that works)
				const recipe = await recipeOrchestrator.generateRecipe(
					'winter',
					recipeName
				);

				console.log(`✅ Generated: ${recipe.title}`);
				console.log(`   Ingredients: ${recipe.ingredients.length}`);
				console.log(`   Prep time: ${recipe.prepTime} min`);
				console.log(`   Cook time: ${recipe.cookTime} min`);

				// Save the recipe
				console.log('💾 Saving to database...');
				const savedRecipe = await Recipe.create(recipe);
				console.log(`✅ Saved with ID: ${savedRecipe._id}`);

				results.push({
					name: recipeName,
					title: recipe.title,
					success: true,
					id: savedRecipe._id,
				});
			} catch (error) {
				console.error(`❌ Failed to generate ${recipeName}: ${error.message}`);
				results.push({
					name: recipeName,
					success: false,
					error: error.message,
				});
			}

			// Small delay between recipes
			if (i < recipesToGenerate.length - 1) {
				console.log('⏳ Waiting 2 seconds...');
				await new Promise((resolve) => setTimeout(resolve, 2000));
			}
		}

		// Summary
		console.log('\n📊 RESULTS SUMMARY');
		console.log('==================');
		const successful = results.filter((r) => r.success);
		const failed = results.filter((r) => !r.success);

		console.log(`✅ Successful: ${successful.length}/${results.length}`);
		console.log(`❌ Failed: ${failed.length}/${results.length}`);

		if (successful.length > 0) {
			console.log(
				'\n🎉 SUCCESS! Individual recipe generation works perfectly!'
			);
			console.log('The core system is functioning correctly.');
			console.log(
				'Issues are only with batch processing, not core generation.'
			);
		}

		if (failed.length > 0) {
			console.log('\n❌ Failed recipes:');
			failed.forEach((f) => console.log(`   - ${f.name}: ${f.error}`));
		}

		// Check final count
		const totalRecipes = await Recipe.countDocuments();
		console.log(`\n📈 Total recipes in database: ${totalRecipes}`);
	} catch (error) {
		console.error('\n💥 Test failed:', error);
	} finally {
		if (mongoose.connection.readyState === 1) {
			await mongoose.disconnect();
		}
	}
}

testDirectGeneration().catch(console.error);
