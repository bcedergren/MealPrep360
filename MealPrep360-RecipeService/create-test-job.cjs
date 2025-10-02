require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

async function createTestJob() {
	const client = new MongoClient(process.env.MONGODB_URI);
	await client.connect();
	const db = client.db('mealprep360');

	console.log('🧹 Cleaning up corrupted jobs...');

	// Remove the corrupted processing job
	await db.collection('jobs').deleteMany({
		status: 'processing',
		$or: [{ totalRecipes: { $exists: false } }, { season: { $exists: false } }],
	});

	console.log('✅ Corrupted jobs removed');

	console.log('🆕 Creating new test job...');

	// Create a proper test job matching the current job model
	const jobId = uuidv4();
	const newJob = {
		id: jobId, // Use 'id' field, not '_id'
		type: 'recipe-generation',
		status: 'pending',
		progress: 0, // Use 'progress' instead of 'completedRecipes'
		total: 5, // Use 'total' instead of 'totalRecipes'
		data: {
			// Required 'data' field containing job-specific data
			season: 'winter',
			preferences: ['healthy', 'quick', 'meal-prep'],
		},
		attempts: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	await db.collection('jobs').insertOne(newJob);

	console.log('✅ Created new test job:');
	console.log('- Job ID:', newJob.id);
	console.log('- Season:', newJob.data.season);
	console.log('- Preferences:', newJob.data.preferences);
	console.log('- Total recipes to generate:', newJob.total);

	// Show current job status
	const jobs = await db.collection('jobs').find({}).toArray();
	console.log('\n📊 Current job status:');
	const statusCounts = {};
	jobs.forEach((job) => {
		statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
	});

	Object.entries(statusCounts).forEach(([status, count]) => {
		console.log(`  ${status}: ${count} jobs`);
	});

	await client.close();
}

createTestJob().catch(console.error);
