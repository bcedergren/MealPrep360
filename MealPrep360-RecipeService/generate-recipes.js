import { MongoClient } from 'mongodb';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '.env.local') });

// Initialize OpenAI
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// MongoDB setup
const client = new MongoClient(process.env.MONGODB_URI, {
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

// Required fields for validation
const requiredFields = [
	'title',
	'description',
	'ingredients',
	'prepInstructions',
	'prepTime',
	'cookTime',
	'servings',
	'tags',
	'storageTime',
	'containerSuggestions',
	'defrostInstructions',
	'cookingInstructions',
	'servingInstructions',
	'allergenInfo',
	'dietaryInfo',
	'season',
];

function validateRecipe(recipe) {
	// Check required fields
	const missingFields = requiredFields.filter((field) => !recipe[field]);
	if (missingFields.length > 0) {
		throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
	}

	// Validate numeric fields
	if (typeof recipe.prepTime !== 'number' || recipe.prepTime <= 0) {
		throw new Error('Invalid prepTime: must be a positive number');
	}
	if (typeof recipe.cookTime !== 'number' || recipe.cookTime <= 0) {
		throw new Error('Invalid cookTime: must be a positive number');
	}
	if (typeof recipe.servings !== 'number' || recipe.servings <= 0) {
		throw new Error('Invalid servings: must be a positive number');
	}
	if (typeof recipe.storageTime !== 'number' || recipe.storageTime <= 0) {
		throw new Error('Invalid storageTime: must be a positive number');
	}

	// Validate arrays
	if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
		throw new Error('Invalid ingredients: must be a non-empty array');
	}
	if (
		!Array.isArray(recipe.prepInstructions) ||
		recipe.prepInstructions.length === 0
	) {
		throw new Error('Invalid prepInstructions: must be a non-empty array');
	}
	if (
		!Array.isArray(recipe.cookingInstructions) ||
		recipe.cookingInstructions.length === 0
	) {
		throw new Error('Invalid cookingInstructions: must be a non-empty array');
	}

	// Validate ingredients structure
	recipe.ingredients.forEach((ingredient, index) => {
		if (!ingredient.name || !ingredient.amount || !ingredient.unit) {
			throw new Error(
				`Invalid ingredient at index ${index}: must have name, amount, and unit`
			);
		}
	});

	return true;
}

async function isDuplicate(db, recipe) {
	const existingRecipe = await db.collection('recipes').findOne({
		title: { $regex: new RegExp('^' + recipe.title + '$', 'i') },
	});
	return !!existingRecipe;
}

async function generateRecipe(season, retries = 3) {
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			const completion = await openai.chat.completions.create({
				model: 'gpt-4',
				messages: [
					{
						role: 'system',
						content: `You are a professional chef specializing in meal prep recipes, particularly crock pot, slow cooker, and casserole recipes. Generate a complete recipe suitable for ${season} season that can be frozen and reheated later. Focus on batch cooking recipes that make large quantities. Include all details like ingredients, prep instructions, cooking time, storage instructions, etc. The recipe should be unique and not a common variation. DO NOT include season names or batch-prep terms in the recipe title.`,
					},
					{
						role: 'user',
						content:
							'Generate a complete recipe in JSON format with the following fields: title (unique and creative, no season names or batch-prep terms), description, ingredients (array of {name, amount, unit}), prepInstructions (array), prepTime (minutes, number), cookTime (minutes, number), servings (number), tags (array), storageTime (days, number), containerSuggestions (array), defrostInstructions (array), cookingInstructions (array), servingInstructions (array), allergenInfo (array), dietaryInfo (array), season (string)',
					},
				],
				temperature: 0.8, // Increased for more creativity
				max_tokens: 2000,
			});

			const recipeData = JSON.parse(completion.choices[0].message.content);
			console.log(`Generated recipe: ${recipeData.title}`);

			// Validate recipe
			validateRecipe(recipeData);

			return recipeData;
		} catch (error) {
			if (error instanceof SyntaxError) {
				console.error(`Attempt ${attempt}: Invalid JSON response from OpenAI`);
			} else {
				console.error(
					`Attempt ${attempt}: Error generating recipe:`,
					error.message
				);
			}

			if (attempt === retries) {
				throw error;
			}

			// Exponential backoff
			const delay = Math.pow(2, attempt) * 1000;
			console.log(`Waiting ${delay / 1000} seconds before retry...`);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}
}

async function saveRecipe(recipeData) {
	try {
		const db = client.db('mealprep360');

		// Check for duplicates
		if (await isDuplicate(db, recipeData)) {
			throw new Error(`Recipe with title "${recipeData.title}" already exists`);
		}

		const recipes = db.collection('recipes');
		const result = await recipes.insertOne(recipeData);
		console.log(
			`Saved recipe: ${recipeData.title} with ID: ${result.insertedId}`
		);
		return result;
	} catch (error) {
		console.error('Error saving recipe:', error.message);
		throw error;
	}
}

async function generateAndSaveRecipes(season, count) {
	console.log(`Starting recipe generation for ${season} season...`);
	let successCount = 0;

	try {
		await client.connect();
		console.log('Connected to MongoDB');

		for (let i = 0; i < count; i++) {
			try {
				console.log(`\nGenerating recipe ${i + 1}/${count}`);
				const recipeData = await generateRecipe(season);
				await saveRecipe(recipeData);
				console.log(
					`Successfully generated and saved recipe ${i + 1}/${count}`
				);
				successCount++;

				// Add a delay between recipes with some randomness to avoid patterns
				const delay = 2000 + Math.random() * 1000;
				await new Promise((resolve) => setTimeout(resolve, delay));
			} catch (error) {
				console.error(
					`Failed to generate/save recipe ${i + 1}:`,
					error.message
				);
				// If it's a duplicate, try again with the same index
				if (error.message.includes('already exists')) {
					i--;
					console.log('Retrying with a new recipe...');
				}
				continue;
			}
		}

		console.log(`\nCompleted generating recipes for ${season} season`);
		console.log(
			`Successfully generated and saved ${successCount}/${count} recipes`
		);
	} catch (error) {
		console.error('Fatal error:', error.message);
	} finally {
		await client.close();
	}
}

// Get season from command line argument, default to 'summer'
const season = process.argv[2] || 'summer';
const count = parseInt(process.argv[3]) || 30;

generateAndSaveRecipes(season, count).catch(console.error);
