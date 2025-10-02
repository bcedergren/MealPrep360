#!/usr/bin/env node

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testSingleRecipe() {
	try {
		console.log('🧪 Testing Single Recipe Generation...\n');

		// Import the RecipeGenerator
		const { RecipeGenerator } = await import(
			'./dist/services/recipeGenerator.js'
		);

		console.log('📝 Attempting to generate a single recipe...');

		const recipeGenerator = RecipeGenerator.getInstance();
		const recipe = await recipeGenerator.generateRecipe('summer');

		console.log('✅ Recipe generated successfully!');
		console.log(`📋 Title: ${recipe.title}`);
		console.log(`📋 Description: ${recipe.description}`);
		console.log(`📋 Cook Time: ${recipe.cookTime}`);
		console.log(`📋 Season: ${recipe.season}`);
		console.log(`📋 Ingredients: ${recipe.ingredients.length}`);
		console.log(`📋 Tags: ${recipe.tags.join(', ')}`);

		// Test saving to database
		console.log('\n💾 Testing database save...');
		const { Recipe } = await import('./dist/models/recipe.js');
		const savedRecipe = await Recipe.create(recipe);
		console.log('✅ Recipe saved to database!');
		console.log(`📋 Database ID: ${savedRecipe._id}`);

		// Clean up
		await Recipe.findByIdAndDelete(savedRecipe._id);
		console.log('🧹 Test recipe cleaned up');
	} catch (error) {
		console.error('❌ Error generating recipe:', error.message);
		console.error('Stack trace:', error.stack);
	}
}

testSingleRecipe();
