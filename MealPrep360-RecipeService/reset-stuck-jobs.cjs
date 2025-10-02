const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function resetStuckJobs() {
	console.log('🔄 Resetting stuck processing jobs to pending...');

	const client = new MongoClient(process.env.MONGODB_URI);
	await client.connect();
	const db = client.db('mealprep360');

	// Reset processing jobs to pending
	const result = await db.collection('jobs').updateMany(
		{ status: 'processing' },
		{
			$set: { status: 'pending' },
			$unset: { processingStarted: 1 },
		}
	);

	console.log(`✅ Reset ${result.modifiedCount} stuck jobs to pending`);

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

resetStuckJobs().catch(console.error);
