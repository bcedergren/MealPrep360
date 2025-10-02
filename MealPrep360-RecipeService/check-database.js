#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkDatabase() {
	try {
		console.log('🔍 Connecting to MongoDB...');
		await mongoose.connect(process.env.MONGODB_URI, {
			serverSelectionTimeoutMS: 5000,
			connectTimeoutMS: 5000,
		});

		console.log('✅ Connected to MongoDB');

		// Import the Recipe model
		const { Recipe } = await import('./dist/models/recipe.js');

		// Count total recipes
		const totalRecipes = await Recipe.countDocuments();
		console.log(`📊 Total recipes in database: ${totalRecipes}`);

		// Get recent recipes
		const recentRecipes = await Recipe.find()
			.sort({ createdAt: -1 })
			.limit(10)
			.select('title season createdAt');

		console.log('\n📋 Recent recipes:');
		if (recentRecipes.length === 0) {
			console.log('❌ No recipes found in database');
		} else {
			recentRecipes.forEach((recipe, index) => {
				console.log(
					`${index + 1}. ${recipe.title} (${recipe.season}) - ${recipe.createdAt}`
				);
			});
		}

		// Check recipes by season
		const summerRecipes = await Recipe.countDocuments({ season: 'summer' });
		console.log(`\n🌞 Summer recipes: ${summerRecipes}`);

		// Check if any recipes have images
		const recipesWithImages = await Recipe.countDocuments({
			'images.main': { $exists: true, $ne: null },
		});
		console.log(`🖼️ Recipes with images: ${recipesWithImages}`);

		// Check job status
		const { Job } = await import('./dist/models/job.js');
		const recentJobs = await Job.find()
			.sort({ createdAt: -1 })
			.limit(5)
			.select('id type status progress total season createdAt');

		console.log('\n📋 Recent jobs:');
		if (recentJobs.length === 0) {
			console.log('❌ No jobs found in database');
		} else {
			recentJobs.forEach((job, index) => {
				console.log(
					`${index + 1}. ${job.id} - ${job.type} (${job.status}) - ${job.progress}/${job.total} - ${job.season} - ${job.createdAt}`
				);
			});
		}
	} catch (error) {
		console.error('❌ Error checking database:', error.message);
	} finally {
		await mongoose.disconnect();
		console.log('🔌 Disconnected from MongoDB');
	}
}

checkDatabase();
