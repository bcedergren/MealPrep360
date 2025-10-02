import { createClient } from 'redis';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

const API_URL = 'https://recipes.mealprep360.com';

async function checkProductionStatus() {
	console.log('🔍 PRODUCTION ENVIRONMENT DIAGNOSTIC\n');
	console.log('=====================================\n');

	let redisClient;
	let allHealthy = true;

	try {
		// 1. Check API Health
		console.log('1️⃣ Checking API Health...');
		try {
			const response = await fetch(`${API_URL}/api/health`);
			const data = await response.json();
			console.log('✅ API Status:', data.status);
			console.log('   Version:', data.version);
			console.log('   Environment:', data.environment);
		} catch (error) {
			console.log('❌ API Health Check Failed:', error.message);
			allHealthy = false;
		}

		// 2. Check MongoDB Connection
		console.log('\n2️⃣ Checking MongoDB...');
		try {
			await mongoose.connect(process.env.MONGODB_URI, {
				serverSelectionTimeoutMS: 5000,
			});
			console.log('✅ MongoDB Connected');

			// Import models
			const { Job } = await import('./dist/models/job.js');
			const { Recipe } = await import('./dist/models/recipe.js');

			// Get job statistics
			const pendingJobs = await Job.find({ status: 'pending' }).sort({
				createdAt: -1,
			});
			const processingJobs = await Job.find({ status: 'processing' });
			const completedJobs = await Job.countDocuments({ status: 'completed' });
			const failedJobs = await Job.find({ status: 'failed' })
				.sort({ createdAt: -1 })
				.limit(5);

			console.log(`\n   📊 Job Statistics:`);
			console.log(`   - Pending: ${pendingJobs.length}`);
			console.log(`   - Processing: ${processingJobs.length}`);
			console.log(`   - Completed: ${completedJobs}`);
			console.log(`   - Failed: ${failedJobs.length}`);

			if (pendingJobs.length > 0) {
				console.log(`\n   ⚠️  PENDING JOBS (Latest 5):`);
				pendingJobs.slice(0, 5).forEach((job) => {
					const age = Math.round(
						(Date.now() - new Date(job.createdAt).getTime()) / 1000 / 60
					);
					console.log(
						`   - ${job.id} (${job.type}) - Created ${age} minutes ago`
					);
				});
				allHealthy = false;
			}

			if (processingJobs.length > 0) {
				console.log(`\n   🔄 PROCESSING JOBS:`);
				processingJobs.forEach((job) => {
					console.log(
						`   - ${job.id} (${job.type}) - Progress: ${job.progress}/${job.total}`
					);
				});
			}

			if (failedJobs.length > 0) {
				console.log(`\n   ❌ RECENT FAILED JOBS:`);
				failedJobs.forEach((job) => {
					console.log(
						`   - ${job.id} (${job.type}) - Error: ${job.error || 'Unknown'}`
					);
				});
			}

			// Check recipe count
			const recipeCount = await Recipe.countDocuments();
			console.log(`\n   📚 Total Recipes: ${recipeCount}`);
		} catch (error) {
			console.log('❌ MongoDB Check Failed:', error.message);
			allHealthy = false;
		}

		// 3. Check Redis Queue
		console.log('\n3️⃣ Checking Redis Queue...');
		try {
			redisClient = createClient({
				username: process.env.REDIS_USER,
				password: process.env.REDIS_PASSWORD,
				socket: {
					host: process.env.REDIS_HOST,
					port: Number(process.env.REDIS_PORT),
				},
			});

			await redisClient.connect();
			console.log('✅ Redis Connected');

			// Check queue lengths
			const recipeQueueLength = await redisClient.lLen(
				'recipe-generation-queue'
			);
			const imageQueueLength = await redisClient.lLen('image-generation-queue');

			console.log(`\n   📬 Queue Status:`);
			console.log(
				`   - Recipe Generation Queue: ${recipeQueueLength} messages`
			);
			console.log(`   - Image Generation Queue: ${imageQueueLength} messages`);

			if (recipeQueueLength > 0 || imageQueueLength > 0) {
				console.log(
					'\n   ⚠️  QUEUED MESSAGES FOUND - Workers may not be running!'
				);
				allHealthy = false;
			}

			// Check for messages in queues
			if (recipeQueueLength > 0) {
				const messages = await redisClient.lRange(
					'recipe-generation-queue',
					0,
					4
				);
				console.log('\n   Recipe Queue Messages:');
				messages.forEach((msg, i) => {
					try {
						const parsed = JSON.parse(msg);
						console.log(
							`   ${i + 1}. Job: ${parsed.jobId}, Season: ${parsed.season}`
						);
					} catch (e) {
						console.log(`   ${i + 1}. ${msg}`);
					}
				});
			}
		} catch (error) {
			console.log('❌ Redis Check Failed:', error.message);
			allHealthy = false;
		}

		// 4. Summary and Recommendations
		console.log('\n=====================================');
		console.log('📋 SUMMARY\n');

		if (allHealthy) {
			console.log('✅ All systems operational!');
		} else {
			console.log('❌ Issues detected!\n');
			console.log('🔧 RECOMMENDATIONS:\n');

			const { Job } = await import('./dist/models/job.js');
			const pendingCount = await Job.countDocuments({ status: 'pending' });

			if (pendingCount > 0) {
				console.log('1. Background workers appear to be NOT RUNNING');
				console.log('   - Jobs are stuck in "pending" status');
				console.log('   - Workers need to be started to process the queue\n');
				console.log(
					'   To fix this, the workers need to be deployed and running:'
				);
				console.log('   - Option 1: Run workers on a separate server/VM');
				console.log(
					'   - Option 2: Use a service like Railway, Render, or Heroku'
				);
				console.log(
					'   - Option 3: Use PM2 on a VPS to keep workers running\n'
				);
				console.log('   Start command: npm run worker:all:prod');
			}
		}
	} catch (error) {
		console.error('\n❌ Diagnostic Error:', error);
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

// Run the diagnostic
checkProductionStatus().catch(console.error);
