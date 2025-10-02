require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function cleanupJobs() {
	const client = new MongoClient(process.env.MONGODB_URI);
	await client.connect();
	const db = client.db('mealprep360');

	console.log('🧹 Cleaning ALL jobs...');
	const result = await db.collection('jobs').deleteMany({});
	console.log(`✅ Deleted ${result.deletedCount} jobs`);

	await client.close();
}

cleanupJobs().catch(console.error);
