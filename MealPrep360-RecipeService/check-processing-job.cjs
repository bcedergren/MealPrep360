require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkProcessingJob() {
	const client = new MongoClient(process.env.MONGODB_URI);
	await client.connect();
	const db = client.db('mealprep360');

	console.log('🔍 Checking processing job details...');

	const processingJob = await db
		.collection('jobs')
		.findOne({ status: 'processing' });
	if (processingJob) {
		console.log('📊 Processing Job Details:');
		console.log('- Job ID:', processingJob._id);
		console.log('- Status:', processingJob.status);
		console.log(
			'- Progress:',
			processingJob.completedRecipes || 0,
			'/',
			processingJob.totalRecipes
		);
		console.log('- Started:', processingJob.processingStarted);
		console.log('- Last Updated:', processingJob.updatedAt);
		console.log('- Season:', processingJob.season);
		console.log('- Type:', processingJob.type);
		console.log('- Preferences:', processingJob.preferences);

		// Check if there are any recent recipes for this job
		const recentRecipes = await db
			.collection('recipes')
			.find({
				jobId: processingJob._id.toString(),
			})
			.sort({ createdAt: -1 })
			.limit(5)
			.toArray();

		console.log('\n🍳 Recent recipes for this job:', recentRecipes.length);
		recentRecipes.forEach((recipe, i) => {
			console.log(`${i + 1}. ${recipe.title} - ${recipe.createdAt}`);
		});

		// Check total recipes in database
		const totalRecipes = await db.collection('recipes').countDocuments();
		console.log('\n📈 Total recipes in database:', totalRecipes);

		// Check recent recipes (last 10)
		const allRecentRecipes = await db
			.collection('recipes')
			.find({})
			.sort({ createdAt: -1 })
			.limit(10)
			.toArray();

		console.log('\n🕐 Last 10 recipes in database:');
		allRecentRecipes.forEach((recipe, i) => {
			console.log(
				`${i + 1}. ${recipe.title} (${recipe.season}) - ${recipe.createdAt}`
			);
		});
	} else {
		console.log('❌ No processing job found');
	}

	await client.close();
}

checkProcessingJob().catch(console.error);
