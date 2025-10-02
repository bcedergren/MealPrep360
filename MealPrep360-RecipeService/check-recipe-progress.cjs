require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkRecipeProgress() {
	const client = new MongoClient(process.env.MONGODB_URI);
	await client.connect();
	const db = client.db('mealprep360');

	const totalRecipes = await db.collection('recipes').countDocuments();
	console.log('📊 Total recipes in database:', totalRecipes);

	// Get the most recent recipes
	const recentRecipes = await db
		.collection('recipes')
		.find({})
		.sort({ createdAt: -1 })
		.limit(5)
		.toArray();

	console.log('\n🕐 Most recent recipes:');
	recentRecipes.forEach((recipe, i) => {
		const date = recipe.createdAt
			? new Date(recipe.createdAt).toLocaleString()
			: 'No date';
		console.log(`${i + 1}. ${recipe.title} (${recipe.season}) - ${date}`);
	});

	// Check job status
	const currentJob = await db
		.collection('jobs')
		.findOne({ status: 'processing' });
	if (currentJob) {
		console.log('\n📋 Current job status:');
		console.log('- Job ID:', currentJob.id);
		console.log('- Progress:', currentJob.progress || 0);
		console.log('- Total:', currentJob.total || 'unknown');
		console.log('- Status:', currentJob.status);
		console.log('- Season:', currentJob.data?.season);
	} else {
		console.log('\n✅ No processing jobs found');

		// Check for completed jobs
		const completedJob = await db
			.collection('jobs')
			.findOne({ status: 'completed' });
		if (completedJob) {
			console.log('📋 Last completed job:');
			console.log('- Job ID:', completedJob.id);
			console.log('- Progress:', completedJob.progress || 0);
			console.log('- Total:', completedJob.total || 'unknown');
			console.log('- Season:', completedJob.data?.season);
		}
	}

	await client.close();
}

checkRecipeProgress().catch(console.error);
