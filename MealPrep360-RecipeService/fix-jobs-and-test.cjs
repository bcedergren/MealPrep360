require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

async function resetAndCreateGoodJob() {
	const client = new MongoClient(process.env.MONGODB_URI);
	await client.connect();
	const db = client.db('mealprep360');

	console.log('🧹 Cleaning up problematic jobs...');

	// Remove jobs with 3+ attempts (they'll fail anyway)
	const result = await db.collection('jobs').deleteMany({
		attempts: { $gte: 3 },
	});
	console.log(`Removed ${result.deletedCount} failed jobs`);

	// Remove processing jobs that are stuck
	const stuckResult = await db.collection('jobs').deleteMany({
		status: 'processing',
	});
	console.log(`Removed ${stuckResult.deletedCount} stuck processing jobs`);

	// Count current recipes
	const beforeCount = await db.collection('recipes').countDocuments();
	console.log(`Current recipes in database: ${beforeCount}`);

	console.log('\n🆕 Creating a simple test job...');

	const jobId = uuidv4();
	const newJob = {
		id: jobId, // Custom id field required by Job model
		type: 'recipe-generation',
		status: 'pending',
		progress: 0,
		total: 3,
		attempts: 0,
		data: {
			season: 'winter',
			preferences: ['healthy', 'quick'],
		},
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	await db.collection('jobs').insertOne(newJob);

	console.log('✅ Created test job:');
	console.log('- Job ID:', newJob.id);
	console.log('- Season:', newJob.data.season);
	console.log('- Total recipes:', newJob.total);

	// Show current job status
	const jobs = await db.collection('jobs').find({}).toArray();
	console.log('\n📊 Current jobs:');
	jobs.forEach((job) => {
		console.log(
			`- ${job.id || job._id}: ${job.status} (${job.type}) - ${job.data?.season || 'no season'}`
		);
	});

	await client.close();
}

resetAndCreateGoodJob().catch(console.error);
