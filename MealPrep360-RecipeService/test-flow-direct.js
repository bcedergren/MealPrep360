import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testFlowDirect() {
	console.log('🧪 Testing Complete Recipe Generation Flow (Direct)\n');

	try {
		// Connect to MongoDB
		console.log('🔌 Connecting to MongoDB...');
		await mongoose.connect(process.env.MONGODB_URI, {
			serverSelectionTimeoutMS: 5000,
			connectTimeoutMS: 5000,
		});
		console.log('✅ Connected to MongoDB');

		// Import services
		const { QueueService } = await import('./dist/services/queueService.js');
		const { Job } = await import('./dist/models/job.js');
		const { Recipe } = await import('./dist/models/recipe.js');

		// Step 1: Create a new recipe generation job
		console.log('\n📝 Step 1: Creating new recipe generation job...');
		const queueService = QueueService.getInstance();

		const jobId = await queueService.enqueueJob({
			type: 'recipe-generation',
			total: 30,
			season: 'spring',
		});

		console.log(`✅ Job created with ID: ${jobId}`);

		// Step 2: Monitor job progress
		console.log('\n📊 Step 2: Monitoring job progress...');

		let attempts = 0;
		const maxAttempts = 60; // 5 minutes with 5-second intervals

		while (attempts < maxAttempts) {
			attempts++;

			const job = await Job.findOne({ id: jobId });
			if (!job) {
				console.log('❌ Job not found in database');
				break;
			}

			console.log(
				`⏳ Attempt ${attempts}/${maxAttempts}: Job ${job.status} (${job.progress}/${job.total})`
			);

			if (job.status === 'completed') {
				console.log('🎉 Job completed successfully!');

				// Check for recipes in database
				const recipeCount = await Recipe.countDocuments();
				console.log(`📚 Total recipes in database: ${recipeCount}`);

				if (recipeCount > 0) {
					const recentRecipes = await Recipe.find({})
						.sort({ createdAt: -1 })
						.limit(5);
					console.log('🍽️  Recent recipes:');
					recentRecipes.forEach((recipe, index) => {
						console.log(
							`  ${index + 1}. ${recipe.title} (${recipe.season}) - Created: ${recipe.createdAt}`
						);
					});
				}

				console.log('\n✅ Complete flow test: SUCCESS!');
				break;
			} else if (job.status === 'failed') {
				console.log(`❌ Job failed: ${job.error || 'Unknown error'}`);
				console.log('\n❌ Complete flow test: FAILED');
				break;
			}

			// Wait 5 seconds before next check
			await new Promise((resolve) => setTimeout(resolve, 5000));
		}

		if (attempts >= maxAttempts) {
			console.log('⏰ Timeout: Job did not complete within 5 minutes');
			console.log('\n⚠️  Complete flow test: TIMEOUT');
		}
	} catch (error) {
		console.error('❌ Test failed:', error.message);
		console.error('Stack:', error.stack);
	} finally {
		await mongoose.disconnect();
	}
}

testFlowDirect();
