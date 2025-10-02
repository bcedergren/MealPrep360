require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkJobs() {
	const client = new MongoClient(process.env.MONGODB_URI);
	await client.connect();
	const db = client.db('mealprep360');

	const jobs = await db.collection('jobs').find({}).toArray();
	console.log('📋 Current jobs:');

	if (jobs.length === 0) {
		console.log('No jobs found');
	} else {
		jobs.forEach((job) => {
			console.log(`- ID: ${job.id}`);
			console.log(`  Type: ${job.type}`);
			console.log(`  Status: ${job.status}`);
			console.log(`  Progress: ${job.progress}/${job.total}`);
			console.log(`  Season: ${job.data?.season}`);
			console.log(`  Created: ${job.createdAt}`);
			if (job.error) {
				console.log(`  Error: ${job.error}`);
			}
			console.log('');
		});
	}

	await client.close();
}

checkJobs().catch(console.error);
