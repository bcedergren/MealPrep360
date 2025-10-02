import { connectDB } from '../services/database.js';
import { Recipe } from '../models/recipe.js';
import { logger } from '../services/logger.js';

async function isAzureBlobUrl(url: string): Promise<boolean> {
	return (
		url.includes('blob.core.windows.net') ||
		url.includes('?st=') ||
		url.includes('&sv=')
	);
}

async function urlToBase64(url: string): Promise<string> {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch image: ${response.statusText}`);
		}
                const buffer = Buffer.from(await response.arrayBuffer());
                return buffer.toString('base64');
	} catch (error) {
		logger.error(
			`Failed to convert URL to base64: ${
				error instanceof Error ? error.message : error
			}`
		);
		throw error;
	}
}

async function migrateImages() {
	try {
		logger.info('Starting image migration...');
		await connectDB();

		// First check total number of recipes
		const totalRecipes = await Recipe.countDocuments();
		logger.info(`Total recipes in database: ${totalRecipes}`);

		// Find all recipes with images
		const recipes = await Recipe.find({ images: { $exists: true } });
		logger.info(`Found ${recipes.length} recipes with images`);

		// Log the first recipe's structure if any exist
		if (recipes.length > 0) {
			logger.info('Sample recipe structure:');
			logger.info(JSON.stringify(recipes[0], null, 2));
		} else {
			// If no recipes with images, check if any recipes exist at all
			const allRecipes = await Recipe.find().limit(1);
			if (allRecipes.length > 0) {
				logger.info('Found recipes but none have images. Sample recipe:');
				logger.info(JSON.stringify(allRecipes[0], null, 2));
			} else {
				logger.info('No recipes found in database at all');
			}
		}

		let migratedCount = 0;
		let skippedCount = 0;
		let errorCount = 0;

		for (const recipe of recipes) {
			try {
				if (!recipe.images) continue;

				let needsMigration = false;
				const newImages: any = {};

				// Check main image
				if (recipe.images.main && (await isAzureBlobUrl(recipe.images.main))) {
					logger.info(`Migrating main image for recipe: ${recipe.title}`);
					newImages.main = await urlToBase64(recipe.images.main);
					needsMigration = true;
				} else {
					newImages.main = recipe.images.main;
				}

				// Check thumbnail
				if (
					recipe.images.thumbnail &&
					(await isAzureBlobUrl(recipe.images.thumbnail))
				) {
					logger.info(`Migrating thumbnail for recipe: ${recipe.title}`);
					newImages.thumbnail = await urlToBase64(recipe.images.thumbnail);
					needsMigration = true;
				} else {
					newImages.thumbnail = recipe.images.thumbnail;
				}

				// Check additional images
				if (recipe.images.additional && recipe.images.additional.length > 0) {
					newImages.additional = [];
					for (const image of recipe.images.additional) {
						if (await isAzureBlobUrl(image)) {
							logger.info(
								`Migrating additional image for recipe: ${recipe.title}`
							);
							newImages.additional.push(await urlToBase64(image));
							needsMigration = true;
						} else {
							newImages.additional.push(image);
						}
					}
				}

				if (needsMigration) {
					recipe.images = newImages;
					await recipe.save();
					migratedCount++;
					logger.info(
						`Successfully migrated images for recipe: ${recipe.title}`
					);
				} else {
					skippedCount++;
					logger.info(`Skipped recipe (already using base64): ${recipe.title}`);
				}
			} catch (error) {
				errorCount++;
				logger.error(
					`Failed to migrate recipe ${recipe.title}: ${
						error instanceof Error ? error.message : error
					}`
				);
			}
		}

		logger.info('Migration completed:');
		logger.info(`- Total recipes processed: ${recipes.length}`);
		logger.info(`- Successfully migrated: ${migratedCount}`);
		logger.info(`- Skipped (already base64): ${skippedCount}`);
		logger.info(`- Errors: ${errorCount}`);
	} catch (error) {
		logger.error(
			`Migration failed: ${error instanceof Error ? error.message : error}`
		);
		process.exit(1);
	} finally {
		process.exit(0);
	}
}

migrateImages();
