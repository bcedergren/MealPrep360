import fetch from 'node-fetch';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testCompleteFlow() {
	console.log('🧪 Testing Complete Recipe Generation Flow\n');

	try {
		// Step 1: Create a new recipe generation job
		console.log('📝 Step 1: Creating new recipe generation job...');
		const startTime = Date.now();

		const response = await fetch('http://localhost:3000/api/recipe/generate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': process.env.API_KEY || 'test-key',
			},
			body: JSON.stringify({
				season: 'winter',
			}),
		});

		const apiResponseTime = Date.now() - startTime;
		console.log(`✅ API Response Time: ${apiResponseTime}ms`);
		console.log(`Status: ${response.status}`);

		if (!response.ok) {
			const errorText = await response.text();
			console.error('❌ API Error:', errorText);
			return;
		}

		const data = await response.json();
		console.log('📋 Job Created:', JSON.stringify(data, null, 2));

		if (data.status !== 'accepted') {
			console.error('❌ Unexpected API response status');
			return;
		}

		const jobId = data.job.id;
		console.log(`✅ Job created successfully with ID: ${jobId}\n`);

		// Step 2: Monitor job progress
		console.log('📊 Step 2: Monitoring job progress...');

		// Connect to MongoDB
		await mongoose.connect(process.env.MONGODB_URI, {
			serverSelectionTimeoutMS: 5000,
			connectTimeoutMS: 5000,
		});

		const { Job } = await import('./dist/models/job.js');
		const { Recipe } = await import('./dist/models/recipe.js');

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
						.limit(3);
					console.log('🍽️  Recent recipes:');
					recentRecipes.forEach((recipe, index) => {
						console.log(`  ${index + 1}. ${recipe.title} (${recipe.season})`);
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
	} finally {
		await mongoose.disconnect();
	}
}

testCompleteFlow();
