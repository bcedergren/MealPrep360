import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import OpenAI from 'openai';

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

// Initialize OpenAI
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

async function generateImage(recipe) {
	try {
		console.log(`Generating image for recipe: ${recipe.title}`);

		// Try Spoonacular first if API key is available
		if (process.env.SPOONACULAR_API_KEY) {
			try {
				const spoonacularUrl = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${process.env.SPOONACULAR_API_KEY}&query=${encodeURIComponent(recipe.title)}&addRecipeInformation=true&number=1`;
				const response = await fetch(spoonacularUrl);
				const data = await response.json();

				if (data.results && data.results.length > 0 && data.results[0].image) {
					const imageResponse = await fetch(data.results[0].image);
					const imageBuffer = await imageResponse.arrayBuffer();
					return {
						main: `data:image/jpeg;base64,${Buffer.from(imageBuffer).toString('base64')}`,
						thumbnail: `data:image/jpeg;base64,${Buffer.from(imageBuffer).toString('base64')}`,
						additional: [],
					};
				}
			} catch (error) {
				console.warn(
					`Failed to get image from Spoonacular for ${recipe.title}:`,
					error
				);
			}
		}

		// Fall back to DALL-E
		const prompt = `A professional food photography style image of ${recipe.title}. The image should be appetizing and well-lit, showing the dish in an appealing way. The image must not contain any text, labels, numbers, or symbols - only the food itself with professional plating and styling. Focus on creating a clean, realistic photograph of the dish.`;

		const response = await openai.images.generate({
			model: process.env.OPENAI_IMAGE_MODEL || 'dall-e-3',
			prompt: prompt,
			n: 1,
			size: '1024x1024',
			quality: 'standard',
			style: 'natural',
			response_format: 'b64_json',
		});

		if (response.data && response.data[0]?.b64_json) {
			const imageBase64 = `data:image/png;base64,${response.data[0].b64_json}`;
			return {
				main: imageBase64,
				thumbnail: imageBase64,
				additional: [],
			};
		}

		throw new Error('Failed to generate image');
	} catch (error) {
		console.error(`Error generating image for ${recipe.title}:`, error);
		throw error;
	}
}

async function generateMissingImages() {
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

		const recipes = await Recipe.find({ 'images.main': { $exists: false } });
		console.log(`Found ${recipes.length} recipes missing images`);

		for (const recipe of recipes) {
			try {
				const images = await generateImage(recipe);
				recipe.images = images;
				await recipe.save();
				console.log(
					`Successfully generated and saved images for ${recipe.title}`
				);
			} catch (error) {
				console.error(`Failed to generate images for ${recipe.title}:`, error);
			}
			// Add a delay between requests to avoid rate limits
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}

		console.log('Finished generating images');
		await mongoose.disconnect();
		process.exit(0);
	} catch (error) {
		console.error('Error:', error);
		process.exit(1);
	}
}

generateMissingImages();
