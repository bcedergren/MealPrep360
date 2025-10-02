require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

async function createProperTestJob() {
	const client = new MongoClient(process.env.MONGODB_URI);
	await client.connect();
	const db = client.db('mealprep360');

	console.log('🧹 Cleaning up existing jobs...');

	// Remove all existing jobs to start fresh
	const result = await db.collection('jobs').deleteMany({});
	console.log(`Removed ${result.deletedCount} existing jobs`);

	// Count current recipes
	const beforeCount = await db.collection('recipes').countDocuments();
	console.log(`Current recipes in database: ${beforeCount}`);

	console.log('\n🆕 Creating a proper test job...');

	const jobId = uuidv4();

	// Create job with correct structure matching the existing schema
	const newJob = {
		id: jobId, // This is the unique field, not _id
		type: 'recipe-generation',
		status: 'pending',
		progress: 0,
		data: {
			season: 'winter',
			preferences: ['healthy', 'quick'],
		},
		attempts: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	await db.collection('jobs').insertOne(newJob);

	console.log('✅ Created test job:');
	console.log('- Job ID:', newJob.id);
	console.log('- Season:', newJob.data.season);
	console.log('- Preferences:', newJob.data.preferences);
	console.log('- Status:', newJob.status);

	// Verify job was created
	const createdJob = await db.collection('jobs').findOne({ id: jobId });
	console.log('\n✅ Job verification:');
	console.log('- Found in database:', !!createdJob);
	console.log('- MongoDB _id:', createdJob._id);
	console.log('- Job id field:', createdJob.id);

	await client.close();

	return jobId;
}

createProperTestJob()
	.then((jobId) => {
		console.log(`\n🚀 Ready to process job: ${jobId}`);
		console.log('Run: node process-pending-jobs.js');
	})
	.catch(console.error);
