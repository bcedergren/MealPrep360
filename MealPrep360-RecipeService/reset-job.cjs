require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function resetJob() {
	const client = new MongoClient(process.env.MONGODB_URI);
	await client.connect();
	const db = client.db('mealprep360');

	await db
		.collection('jobs')
		.updateOne(
			{ id: '48436ad6-e18f-4255-9a52-34a2679ed00b' },
			{ $set: { status: 'pending', progress: 0 } }
		);

	console.log('✅ Job reset to pending status');
	await client.close();
}

resetJob().catch(console.error);
