require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkRecipeCount() {
	const client = new MongoClient(process.env.MONGODB_URI);
	await client.connect();
	const db = client.db('mealprep360');

	const count = await db.collection('recipes').countDocuments();
	console.log('📊 Total recipes:', count);

	const recentCount = await db.collection('recipes').countDocuments({
		createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
	});
	console.log('🆕 Recent recipes (24h):', recentCount);

	// Show recent recipes
	const recentRecipes = await db
		.collection('recipes')
		.find({}, { title: 1, createdAt: 1 })
		.sort({ createdAt: -1 })
		.limit(10)
		.toArray();

	console.log('\n📝 Recent recipes:');
	recentRecipes.forEach((recipe, i) => {
		console.log(
			`${i + 1}. ${recipe.title} (${recipe.createdAt.toLocaleString()})`
		);
	});

	await client.close();
}

checkRecipeCount().catch(console.error);
