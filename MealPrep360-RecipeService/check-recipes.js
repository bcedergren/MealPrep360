import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '.env.local') });

async function checkRecipes() {
	const client = new MongoClient(process.env.MONGODB_URI);
	try {
		await client.connect();
		console.log('Connected to MongoDB');

		const db = client.db('mealprep360');
		const recipes = await db.collection('recipes').find({}).toArray();

		console.log(`Found ${recipes.length} recipes:`);
		recipes.forEach((recipe) => {
			console.log(`- ${recipe.title}`);
		});
	} catch (error) {
		console.error('Error:', error);
	} finally {
		await client.close();
	}
}

checkRecipes();
