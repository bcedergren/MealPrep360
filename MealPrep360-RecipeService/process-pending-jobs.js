import mongoose from 'mongoose';
import { createClient } from 'redis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

console.log('🚀 Manual Job Processor - Temporary Solution\n');
console.log('This script will process ONE pending job manually.');
console.log('For a permanent solution, deploy the background workers.\n');

async function processPendingJob() {
	let redisClient;

	try {
		// Connect to MongoDB
		console.log('Connecting to MongoDB...');
		await mongoose.connect(process.env.MONGODB_URI);
		console.log('✅ MongoDB connected\n');

		// Import models and services
		const { Job } = await import('./dist/models/job.js');
		const { Recipe } = await import('./dist/models/recipe.js');
		const { RecipeOrchestrator } = await import(
			'./dist/services/recipeOrchestrator.js'
		);

		// Find oldest pending job
		const pendingJob = await Job.findOne({ status: 'pending' }).sort({
			createdAt: 1,
		});

		if (!pendingJob) {
			console.log('✅ No pending jobs found!');
			return;
		}

		console.log(`Found pending job: ${pendingJob.id}`);
		console.log(`Type: ${pendingJob.type}`);
		console.log(`Season: ${pendingJob.data?.season}`);
		console.log(`Created: ${pendingJob.createdAt}\n`);

		// Ask for confirmation
		console.log('⚠️  This will process the job manually.');
		console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

		await new Promise((resolve) => setTimeout(resolve, 5000));

		// Update job status
		console.log('Processing job...');
		pendingJob.status = 'processing';
		pendingJob.progress = 0;
		pendingJob.attempts = (pendingJob.attempts || 0) + 1;
		await pendingJob.save();

		// Process based on job type
		if (pendingJob.type === 'recipe-generation') {
			console.log(
				'Generating recipes individually to avoid double progress tracking...'
			);
			const recipeOrchestrator = RecipeOrchestrator.getInstance();

			// Step 1: Generate recipe names first
			console.log('Generating recipe names...');
			const recipeNames = await recipeOrchestrator.generateRecipeNames(
				pendingJob.data.season
			);
			console.log(`Generated ${recipeNames.length} recipe names`);

			if (recipeNames.length === 0) {
				throw new Error('No recipe names could be generated');
			}

			// Step 2: Set job total based on recipe names
			pendingJob.total = recipeNames.length;
			await pendingJob.save();

			// Step 3: Generate recipes individually
			const recipes = [];
			let failureCount = 0;
			const maxFailures = 5; // Allow some failures

			for (let i = 0; i < recipeNames.length; i++) {
				const recipeName = recipeNames[i];
				try {
					console.log(
						`Generating recipe ${i + 1}/${recipeNames.length}: ${recipeName}`
					);

					// Generate individual recipe using the singular method
					const recipe = await recipeOrchestrator.generateRecipe(
						pendingJob.data.season,
						recipeName
					);

					// Save the recipe immediately
					console.log(`Saving recipe: ${recipe.title}`);
					await Recipe.create(recipe);
					recipes.push(recipe);

					// Update progress
					pendingJob.progress = i + 1;
					await pendingJob.save();

					console.log(
						`✅ Successfully saved recipe ${i + 1}/${recipeNames.length}: ${recipe.title}`
					);
				} catch (error) {
					failureCount++;
					console.error(
						`❌ Failed to generate recipe ${recipeName}: ${error.message}`
					);

					if (failureCount >= maxFailures) {
						throw new Error(
							`Too many failures (${failureCount}). Stopping generation.`
						);
					}

					// Update progress even for failed recipes
					pendingJob.progress = i + 1;
					await pendingJob.save();
				}

				// Add a small delay to avoid rate limiting
				if (i < recipeNames.length - 1) {
					await new Promise((resolve) => setTimeout(resolve, 1000));
				}
			}

			if (recipes.length === 0) {
				throw new Error('No recipes could be generated successfully');
			}

			// Complete job
			pendingJob.status = 'completed';
			pendingJob.data = {
				...pendingJob.data,
				recipesGenerated: recipes.length,
				recipesAttempted: recipeNames.length,
				failures: failureCount,
				completedAt: new Date(),
			};
			await pendingJob.save();

			console.log(`\n✅ Job completed successfully!`);
			console.log(
				`Generated ${recipes.length} out of ${recipeNames.length} attempted recipes for ${pendingJob.data.season} season.`
			);
			if (failureCount > 0) {
				console.log(`⚠️  ${failureCount} recipes failed to generate.`);
			}
		} else if (pendingJob.type === 'generate-images') {
			console.log(
				'❌ Image generation jobs require the ImageGenerationWorker.'
			);
			console.log(
				'Please deploy the workers to process image generation jobs.'
			);

			// Revert status
			pendingJob.status = 'pending';
			pendingJob.attempts = (pendingJob.attempts || 1) - 1;
			await pendingJob.save();
		} else {
			console.log(`❌ Unknown job type: ${pendingJob.type}`);
			pendingJob.status = 'failed';
			pendingJob.error = `Unknown job type: ${pendingJob.type}`;
			await pendingJob.save();
		}

		// Check Redis queue and remove processed message
		console.log('\nChecking Redis queue...');
		redisClient = createClient({
			username: process.env.REDIS_USER,
			password: process.env.REDIS_PASSWORD,
			socket: {
				host: process.env.REDIS_HOST,
				port: Number(process.env.REDIS_PORT),
			},
		});

		await redisClient.connect();

		// Remove message from queue if it exists
		const queueKey =
			pendingJob.type === 'recipe-generation'
				? 'recipe-generation-queue'
				: 'image-generation-queue';

		const messages = await redisClient.lRange(queueKey, 0, -1);
		for (let i = 0; i < messages.length; i++) {
			try {
				const msg = JSON.parse(messages[i]);
				if (msg.jobId === pendingJob.id) {
					await redisClient.lRem(queueKey, 1, messages[i]);
					console.log('✅ Removed job from Redis queue');
					break;
				}
			} catch (e) {
				// Skip invalid messages
			}
		}

		// Check for more pending jobs
		const remainingJobs = await Job.countDocuments({ status: 'pending' });
		if (remainingJobs > 0) {
			console.log(`\n⚠️  There are still ${remainingJobs} pending jobs.`);
			console.log(
				'Run this script again to process the next job, or deploy the workers for automatic processing.'
			);
		}
	} catch (error) {
		console.error('\n❌ Error processing job:', error);

		// Try to mark job as failed
		try {
			const { Job } = await import('./dist/models/job.js');
			const job = await Job.findOne({ status: 'processing' });
			if (job) {
				job.status = 'failed';
				job.error = error.message;
				await job.save();
			}
		} catch (e) {
			// Ignore
		}
	} finally {
		// Cleanup
		if (mongoose.connection.readyState === 1) {
			await mongoose.disconnect();
		}
		if (redisClient) {
			await redisClient.disconnect();
		}
	}
}

// Run the processor
processPendingJob().catch(console.error);
