import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });
dotenv.config({ path: resolve(__dirname, '.env.local') });

// MongoDB Schema
const recipeSchema = new mongoose.Schema({
	title: String,
	images: {
		main: String,
		thumbnail: String,
		additional: [String],
	},
});

const Recipe = mongoose.model('Recipe', recipeSchema);

async function checkMissingImages() {
	try {
		console.log('Connecting to MongoDB...');
		await mongoose.connect(process.env.MONGODB_URI, {
			bufferCommands: true,
			maxPoolSize: 20,
			minPoolSize: 5,
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 10000,
			connectTimeoutMS: 5000,
			heartbeatFrequencyMS: 5000,
			retryWrites: true,
			retryReads: true,
			waitQueueTimeoutMS: 5000,
		});
		console.log('Connected to MongoDB');

		const recipes = await Recipe.find({});
		console.log(`Found ${recipes.length} total recipes`);

		const missingImages = recipes.filter((recipe) => !recipe.images?.main);
		console.log(`\nRecipes missing images (${missingImages.length}):`);
		missingImages.forEach((recipe) => {
			console.log(`- ${recipe.title}`);
		});

		const hasImages = recipes.filter((recipe) => recipe.images?.main);
		console.log(`\nRecipes with images (${hasImages.length}):`);
		hasImages.forEach((recipe) => {
			console.log(`- ${recipe.title}`);
		});

		await mongoose.disconnect();
		process.exit(0);
	} catch (error) {
		console.error('Error:', error);
		process.exit(1);
	}
}

checkMissingImages();
