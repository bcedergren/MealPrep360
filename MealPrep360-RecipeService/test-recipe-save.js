#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testRecipeSave() {
	try {
		console.log('🔍 Connecting to MongoDB...');
		await mongoose.connect(process.env.MONGODB_URI, {
			serverSelectionTimeoutMS: 5000,
			connectTimeoutMS: 5000,
		});

		console.log('✅ Connected to MongoDB');

		// Import the Recipe model
		const { Recipe } = await import('./dist/models/recipe.js');

		// Create a test recipe
		const testRecipe = {
			title: 'Test Recipe',
			description:
				'A test recipe for database testing. Freezes well and quick to prep.',
			ingredients: [
				{ name: 'Test Ingredient 1', amount: '1', unit: 'cup' },
				{ name: 'Test Ingredient 2', amount: '2', unit: 'tablespoons' },
			],
			prepInstructions: ['Mix ingredients together'],
			prepTime: 10,
			cookTime: 15,
			servings: 4,
			tags: ['test', 'summer', 'freezer-friendly'],
			storageTime: 30,
			containerSuggestions: ['Freezer-safe container'],
			defrostInstructions: ['Thaw in refrigerator overnight'],
			cookingInstructions: ['Heat in microwave for 2 minutes'],
			servingInstructions: ['Serve hot'],
			season: 'summer',
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		console.log('📝 Attempting to save test recipe...');
		const savedRecipe = await Recipe.create(testRecipe);
		console.log('✅ Test recipe saved successfully!');
		console.log(`📋 Recipe ID: ${savedRecipe._id}`);
		console.log(`📋 Recipe Title: ${savedRecipe.title}`);

		// Verify it was saved
		const foundRecipe = await Recipe.findById(savedRecipe._id);
		if (foundRecipe) {
			console.log('✅ Recipe found in database!');
		} else {
			console.log('❌ Recipe not found in database!');
		}

		// Clean up - delete the test recipe
		await Recipe.findByIdAndDelete(savedRecipe._id);
		console.log('🧹 Test recipe cleaned up');
	} catch (error) {
		console.error('❌ Error testing recipe save:', error.message);
		console.error('Stack trace:', error.stack);
	} finally {
		await mongoose.disconnect();
		console.log('🔌 Disconnected from MongoDB');
	}
}

testRecipeSave();
