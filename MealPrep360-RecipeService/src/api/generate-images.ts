//import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../utils/db.js';
import { Recipe } from '../models/recipe.js';
import { logger } from '../services/logger.js';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { config } from '../config.js';
import { QueueService } from '../services/queueService.js';
import { Job } from '../models/job.js';

interface SpoonacularResponse {
	results: Array<{
		image: string;
	}>;
}

const openai = new OpenAI({
	apiKey: config.openai.apiKey,
});

// Constants for batch processing
const BATCH_SIZE = 3; // Process 3 recipes at a time
const RECIPE_TIMEOUT = 60000; // 60 seconds timeout per recipe
const BATCH_DELAY = 2000; // 2 seconds delay between batches

// Helper function to process a single recipe with timeout
async function processRecipeWithTimeout(
	recipe: any,
	traceId: string
): Promise<{ success: boolean; id: string; error?: string }> {
	const recipeId =
		typeof recipe === 'string' ? recipe : recipe._id || recipe.id;

	try {
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(
				() => reject(new Error('Recipe processing timeout')),
				RECIPE_TIMEOUT
			);
		});

		const processPromise = (async () => {
			if (!recipeId) {
				throw new Error('Recipe ID is missing');
			}

			const recipeDoc = await Recipe.findById(recipeId);
			if (!recipeDoc) {
				throw new Error('Recipe not found');
			}

			// Check if recipe already has images
			if (recipeDoc.images?.main) {
				logger.info(
					`[${traceId}] Recipe ${recipeId} already has images, skipping generation`
				);
				return { success: true, id: recipeId };
			}

			const images = await generateImages(recipeDoc, traceId);
			recipeDoc.images = images;
			await recipeDoc.save();

			return { success: true, id: recipeId };
		})();

		return (await Promise.race([processPromise, timeoutPromise])) as {
			success: true;
			id: string;
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error';
		logger.error(
			`[${traceId}] Error processing recipe ${recipeId}: ${errorMessage}`
		);
		return { success: false, id: recipeId, error: errorMessage };
	}
}

// Helper function to process recipes in batches
async function processBatch(recipes: any[], traceId: string) {
	const results = {
		success: [] as string[],
		failed: [] as { id: string; error: string }[],
	};

	for (let i = 0; i < recipes.length; i += BATCH_SIZE) {
		const batch = recipes.slice(i, i + BATCH_SIZE);
		logger.info(
			`[${traceId}] Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(recipes.length / BATCH_SIZE)}`
		);

		const batchResults = await Promise.all(
			batch.map((recipe) => processRecipeWithTimeout(recipe, traceId))
		);

		batchResults.forEach((result) => {
			if (result.success) {
				results.success.push(result.id);
			} else {
				results.failed.push({
					id: result.id,
					error: result.error || 'Unknown error',
				});
			}
		});

		// Add a delay between batches to prevent rate limiting
		if (i + BATCH_SIZE < recipes.length) {
			await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
		}
	}

	return results;
}

export default async function handler(req: any, res: any) {
	if (req.method !== 'POST') {
		return res.status(405).json({
			status: 'error',
			message: 'Method Not Allowed. This endpoint only accepts POST requests.',
			allowedMethods: ['POST'],
		});
	}

	// API key check
	const apiKey = req.headers['x-api-key'];
	if (!apiKey || apiKey !== process.env.API_KEY) {
		return res.status(401).json({
			status: 'error',
			message: 'Invalid or missing API key',
		});
	}

	const traceId = uuidv4();
	logger.info(`[${traceId}] Starting recipe image generation`);

	try {
		// Handle both single recipe and bulk recipe requests
		const { recipeId, recipes } = req.body;

		// Ensure DB connection
		await connectToDatabase();

		// Handle bulk recipe request
		if (recipes && Array.isArray(recipes)) {
			logger.info(`[${traceId}] Processing ${recipes.length} recipes in bulk`);

			// Create and enqueue the job
			const queueService = QueueService.getInstance();
			const jobId = await queueService.enqueueJob({
				type: 'generate-images',
				total: recipes.length,
				season: 'bulk',
				data: {
					recipes: recipes.map((r) => ({
						id: typeof r === 'string' ? r : r._id || r.id,
						original: r,
					})),
				},
			});

			// Get the job details
			const job = await Job.findOne({ id: jobId });
			if (!job) {
				throw new Error('Failed to create job');
			}

			// Store the jobId in each recipe document
			await Promise.all(
				recipes.map((recipe) => {
					const recipeId =
						typeof recipe === 'string' ? recipe : recipe._id || recipe.id;
					return Recipe.findByIdAndUpdate(recipeId, {
						$set: {
							imageGenerationJobId: jobId,
						},
					});
				})
			);

			return res.status(202).json({
				status: 'success',
				message: 'Image generation job created',
				data: {
					jobId: jobId,
					total: recipes.length,
					status: 'pending',
				},
			});
		}

		// Handle single recipe request
		if (!recipeId) {
			return res.status(400).json({
				status: 'error',
				message: 'Recipe ID is required',
			});
		}

		// For single recipe, process immediately
		const recipeDoc = await Recipe.findById(recipeId);
		if (!recipeDoc) {
			return res.status(404).json({
				status: 'error',
				message: 'Recipe not found',
			});
		}

		// Create and enqueue the job
		const queueService = QueueService.getInstance();
		const jobId = await queueService.enqueueJob({
			type: 'generate-images',
			total: 1,
			season: 'single',
			data: {
				recipes: [
					{
						id: recipeId,
						original: recipeDoc,
					},
				],
			},
		});

		// Get the job details
		const job = await Job.findOne({ id: jobId });
		if (!job) {
			throw new Error('Failed to create job');
		}

		// Store the jobId in the recipe document
		await Recipe.findByIdAndUpdate(recipeId, {
			$set: {
				imageGenerationJobId: jobId,
			},
		});

		return res.status(202).json({
			status: 'success',
			message: 'Image generation job created',
			data: {
				jobId: jobId,
				total: 1,
				status: 'pending',
			},
		});
	} catch (error: any) {
		logger.error(`[${traceId}] Error in recipe image generation: ${error}`);
		return res.status(500).json({
			status: 'error',
			message: error instanceof Error ? error.message : 'Unknown error',
		});
	}
}

// Export the generateImages function for use by the worker
export async function generateImages(recipe: any, traceId: string) {
	// Try to get image from Spoonacular first
	let imageBase64: string | null = null;
	try {
		if (process.env.SPOONACULAR_API_KEY) {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000);

			const spoonacularUrl = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${process.env.SPOONACULAR_API_KEY}&query=${encodeURIComponent(recipe.title)}&addRecipeInformation=true&number=1`;
			const response = await fetch(spoonacularUrl, {
				signal: controller.signal,
			});
			clearTimeout(timeoutId);
			const data = (await response.json()) as SpoonacularResponse;

			if (data.results && data.results.length > 0 && data.results[0].image) {
				// Convert image URL to base64
				const imageController = new AbortController();
				const imageTimeoutId = setTimeout(() => imageController.abort(), 10000);
				const imageResponse = await fetch(data.results[0].image, {
					signal: imageController.signal,
				});
				clearTimeout(imageTimeoutId);
				const imageBuffer = await imageResponse.arrayBuffer();
				imageBase64 = `data:image/jpeg;base64,${Buffer.from(imageBuffer).toString('base64')}`;
			}
		}
	} catch (error) {
		logger.warn(`[${traceId}] Failed to get image from Spoonacular: ${error}`);
	}

	// If no image from Spoonacular, generate with DALL-E
	if (!imageBase64) {
		try {
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
				imageBase64 = `data:image/png;base64,${response.data[0].b64_json}`;
			}
		} catch (error) {
			logger.error(
				`[${traceId}] Failed to generate image with DALL-E: ${error}`
			);
			throw new Error('Failed to generate recipe image');
		}
	}

	if (!imageBase64) {
		throw new Error('Failed to generate or find recipe image');
	}

	return {
		main: imageBase64,
		thumbnail: imageBase64, // Use the same image for thumbnail
		additional: [], // Don't generate additional images to reduce API calls
	};
}
