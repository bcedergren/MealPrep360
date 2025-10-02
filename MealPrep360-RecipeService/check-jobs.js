import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkJobs() {
	try {
		console.log('Connecting to MongoDB...');
		await mongoose.connect(process.env.MONGODB_URI, {
			serverSelectionTimeoutMS: 5000,
			connectTimeoutMS: 5000,
		});

		console.log('Connected to MongoDB');

		// Import the Job model
		const { Job } = await import('./dist/models/job.js');

		// Get all jobs
		const jobs = await Job.find({}).sort({ createdAt: -1 }).limit(10);

		console.log(`Found ${jobs.length} jobs:`);
		jobs.forEach((job) => {
			console.log(
				`- Job ${job.id}: ${job.status} (${job.progress}/${job.total}) - ${job.type} - ${job.data?.season || 'N/A'} - Created: ${job.createdAt}`
			);
		});

		// Check for pending jobs
		const pendingJobs = await Job.find({ status: 'pending' });
		console.log(`\nPending jobs: ${pendingJobs.length}`);

		// Check for processing jobs
		const processingJobs = await Job.find({ status: 'processing' });
		console.log(`Processing jobs: ${processingJobs.length}`);

		// Check for completed jobs
		const completedJobs = await Job.find({ status: 'completed' });
		console.log(`Completed jobs: ${completedJobs.length}`);

		// Check for failed jobs
		const failedJobs = await Job.find({ status: 'failed' });
		console.log(`Failed jobs: ${failedJobs.length}`);

		// Check for recipes
		const { Recipe } = await import('./dist/models/recipe.js');
		const recipeCount = await Recipe.countDocuments();
		console.log(`\nTotal recipes in database: ${recipeCount}`);

		if (recipeCount > 0) {
			const recentRecipes = await Recipe.find({})
				.sort({ createdAt: -1 })
				.limit(5);
			console.log('Recent recipes:');
			recentRecipes.forEach((recipe) => {
				console.log(
					`- ${recipe.title} (${recipe.season}) - Created: ${recipe.createdAt}`
				);
			});
		}
	} catch (error) {
		console.error('Error:', error.message);
	} finally {
		await mongoose.disconnect();
	}
}

checkJobs();
