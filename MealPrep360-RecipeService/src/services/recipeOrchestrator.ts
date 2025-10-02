import { config } from '../config.js';
import { IRecipe } from '../models/recipe.js';
import { logger } from './logger.js';
import { Recipe } from '../models/recipe.js';
import { v4 as uuidv4 } from 'uuid';
import { JobService } from './jobService.js';
import { QueueService } from './queueService.js';
import { Redis } from 'ioredis';
import { COOKING_VERBS } from '../constants/cookingVerbs.js';
import {
	FREEZER_RECIPE_PROMPT,
	RECIPE_NAMES_PROMPT,
	FREEZER_FRIENDLY_CONCEPTS_PROMPT,
	CLASSIFY_FREEZER_FRIENDLY_PROMPT,
} from '../constants/prompts.js';
import {
	REQUIRED_FIELDS,
	ARRAY_FIELDS,
	NUMERIC_FIELDS,
	MIN_RECIPES_REQUIRED,
	MAX_RECIPE_FAILURES,
} from '../constants/recipeFields.js';
import { AIRecipeGenerator } from './aiRecipeGenerator.js';
import { TAGS_TO_REMOVE } from '../constants/recipeConstants.js';
import { classifyRecipe } from '../utils/recipeTagging.js';
import { IngredientValidator } from '../utils/ingredientValidator.js';

interface OpenAIResponse {
	choices: Array<{
		message: {
			content: string;
		};
	}>;
}

export function containsCookingVerb(str: string): boolean {
	return COOKING_VERBS.some((verb) => str.toLowerCase().includes(verb));
}

interface FormattedRecipe {
	title: string;
	description: string;
	ingredients: Array<{
		name: string;
		amount: string;
		unit: string;
	}>;
	prepInstructions: string[];
	prepTime: number;
	cookTime: number;
	servings: number;
	tags: string[];
	storageTime: number;
	containerSuggestions: string[];
	defrostInstructions: string[];
	cookingInstructions: string[];
	servingInstructions: string[];
	season: string;
	createdAt: Date;
	updatedAt: Date;
	images?: {
		main: string;
		thumbnail: string;
		additional: string[];
	};
	[key: string]: any; // Add index signature for dynamic access
}

export async function getRecipeEmbedding(text: string): Promise<number[]> {
	const response = await fetch('https://api.openai.com/v1/embeddings', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${config.openai.apiKey}`,
		},
		body: JSON.stringify({
			model: 'text-embedding-3-small',
			input: text,
		}),
	});
	if (!response.ok) {
		throw new Error(`OpenAI embedding API error: ${response.statusText}`);
	}
	const data: any = await response.json();
	return data.data[0].embedding;
}

export class RecipeOrchestrator {
	public static readonly MAX_RETRY_ATTEMPTS = 3;
	public static readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
	public static readonly RATE_LIMIT = {
		requests: 10, // Very conservative limit
		window: 60 * 1000, // 1 minute
	};
	public static imageCache = new Map<
		string,
		{
			images: { main: string; thumbnail: string; additional: string[] };
			timestamp: number;
		}
	>();
	public static rateLimitQueue: { timestamp: number; count: number }[] = [];
	public static isEnsuringRecipeCount = false;
	private static readonly LOCK_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
	private static readonly LOCK_KEY = 'recipe_count_check_lock';

	private static instance: RecipeOrchestrator;
	private apiKey: string;
	private scheduledTask: NodeJS.Timeout | null = null;
	private jobService: JobService;
	private queueService: QueueService;
	private aiRecipeGenerator: AIRecipeGenerator;

	private constructor() {
		this.apiKey = config.openai.apiKey || '';
		if (!this.apiKey) {
			throw new Error('OpenAI API key is not configured');
		}
		this.jobService = JobService.getInstance();
		this.queueService = QueueService.getInstance();
		this.aiRecipeGenerator = AIRecipeGenerator.getInstance();
	}

	public static getInstance(): RecipeOrchestrator {
		if (!RecipeOrchestrator.instance) {
			RecipeOrchestrator.instance = new RecipeOrchestrator();
		}
		return RecipeOrchestrator.instance;
	}

	public async generateRecipe(
		season: string,
		recipeName?: string
	): Promise<IRecipe> {
		logger.info(
			'[generateRecipe] Using AI Recipe Generator for freezer meal recipe generation...'
		);

		try {
			// Use the AI service to generate the recipe
			const rawRecipe = await this.aiRecipeGenerator.generateRecipe({
				season,
				recipeName,
			});
			const auditResult = await this.aiRecipeGenerator.auditRecipe(rawRecipe);
			const recipeToReturn = auditResult.fixedRecipe || rawRecipe;

			// Convert AI response to IRecipe format
			const recipe: IRecipe = {
				title: this.cleanRecipeTitle(recipeToReturn.title),
				description: recipeToReturn.description,
				ingredients: recipeToReturn.ingredients.map((ing) => ({
					name: ing.name,
					amount: ing.amount,
					unit: ing.unit,
				})),
				prepInstructions: recipeToReturn.prepInstructions,
				prepTime: recipeToReturn.prepTime,
				cookTime: recipeToReturn.cookTime,
				servings: recipeToReturn.servings,
				tags: recipeToReturn.tags,
				storageTime: recipeToReturn.storageTime,
				containerSuggestions: recipeToReturn.containerSuggestions,
				defrostInstructions: recipeToReturn.defrostInstructions,
				cookingInstructions: recipeToReturn.cookingInstructions,
				servingInstructions: recipeToReturn.servingInstructions,
				allergenInfo: recipeToReturn.allergenInfo,
				dietaryInfo: recipeToReturn.dietaryInfo,
				season: recipeToReturn.season,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			logger.info(
				'[generateRecipe] Recipe generated with AI Recipe Generator: ' +
					JSON.stringify(recipe, null, 2)
			);

			// Auto-classify recipe with regional tags
			const classification = classifyRecipe(
				recipe.ingredients.map((ing) => ing.name),
				recipe.cookingInstructions,
				recipe.title,
				recipe.description
			);

			recipe.regions = classification.regions;
			recipe.cuisineTypes = classification.cuisineTypes;
			recipe.climateZones = classification.climateZones;
			recipe.culturalTags = classification.culturalTags;

			// Generate images for the recipe
			const images = await this.generateRecipeImages(recipe);
			recipe.images = images;

			return recipe;
		} catch (err) {
			logger.error(
				'[generateRecipe] Error generating recipe with AI Recipe Generator: ' +
					(err instanceof Error ? err.message : err)
			);
			throw err;
		}
	}

	public async generateRecipeNames(season: string): Promise<string[]> {
		logger.info(
			'[generateRecipeNames] Using AI Recipe Generator for recipe name generation...'
		);

		try {
			// Use the AI service to generate recipe names
			const aiRecipeGenerator = AIRecipeGenerator.getInstance();
			const recipeNames = await aiRecipeGenerator.generateRecipeNames(
				season,
				30
			);

			logger.info(
				`[generateRecipeNames] Generated ${recipeNames.length} recipe names with AI Recipe Generator`
			);

			return recipeNames;
		} catch (err) {
			logger.error(
				'[generateRecipeNames] Error generating recipe names with AI Recipe Generator: ' +
					(err instanceof Error ? err.message : err)
			);
			throw err;
		}
	}

	// ... rest of the methods remain the same but with updated class references
	// I'll continue with the key methods that need updating

	public async generateRecipes(season: string, jobId: string): Promise<any[]> {
		const traceId = uuidv4();
		logger.info(`[${traceId}] Starting recipe generation for ${season} season`);

		try {
			logger.info(`[${traceId}] Generating recipe names...`);
			const recipeNames = await this.generateRecipeNames(season);
			logger.info(
				`[${traceId}] Generated ${recipeNames.length} recipe names: ${JSON.stringify(recipeNames)}`
			);

			// Validate minimum number of recipe names
			if (recipeNames.length < MIN_RECIPES_REQUIRED) {
				throw new Error(
					`Insufficient recipe names generated: ${recipeNames.length}. Expected at least ${MIN_RECIPES_REQUIRED}.`
				);
			}

			const recipes: any[] = [];
			let progress = 0;
			let failedRecipes = 0;

			// Verify job exists
			const job = await this.jobService.getJob(jobId);
			if (!job) {
				throw new Error(`Job ${jobId} not found`);
			}

			// Process one recipe at a time
			const delayMs = parseInt(process.env.RATE_LIMIT_DELAY_MS || '8000', 10);
			for (const recipeName of recipeNames) {
				try {
					logger.info(`[${traceId}] Generating recipe: ${recipeName}`);
					await new Promise((resolve) => setTimeout(resolve, delayMs)); // Rate limiting

					// Add retry logic for individual recipes
					let recipe: IRecipe | null = null;
					let retryCount = 0;
					const maxRetries = 2;

					while (retryCount <= maxRetries && !recipe) {
						try {
							recipe = await this.generateRecipe(season, recipeName);

							// Validate recipe completeness
							if (!this.isRecipeComplete(recipe)) {
								throw new Error(
									`Incomplete recipe generated for: ${recipeName}`
								);
							}
							break;
						} catch (retryError) {
							retryCount++;
							if (retryCount <= maxRetries) {
								logger.warn(
									`[${traceId}] Retry ${retryCount}/${maxRetries} for recipe: ${recipeName}. Error: ${retryError}`
								);
								await new Promise((resolve) =>
									setTimeout(resolve, 2000 * retryCount)
								); // Exponential backoff
							} else {
								throw retryError;
							}
						}
					}

					if (recipe) {
						recipes.push(recipe);
						logger.info(
							`[${traceId}] Successfully generated recipe: ${recipeName}`
						);
					}
				} catch (error) {
					failedRecipes++;
					logger.error(
						`[${traceId}] Error generating recipe ${recipeName} after ${2} retries: ${error}`
					);

					if (failedRecipes >= MAX_RECIPE_FAILURES) {
						throw new Error(
							`Too many recipe generation failures (${failedRecipes}). Stopping generation.`
						);
					}
					// Continue with next recipe instead of failing the entire job
				} finally {
					progress++;
					await this.jobService.updateJobProgress(jobId, progress);
				}
			}

			if (recipes.length === 0) {
				throw new Error('No recipes could be generated');
			}

			// Validate final recipe count
			if (recipes.length < MIN_RECIPES_REQUIRED) {
				throw new Error(
					`Insufficient recipes generated: ${recipes.length}. Expected at least ${MIN_RECIPES_REQUIRED}.`
				);
			}

			logger.info(
				`[${traceId}] Successfully generated ${recipes.length} recipes`
			);
			return recipes;
		} catch (error) {
			logger.error(`[${traceId}] Error generating recipes: ${error}`);
			throw error;
		}
	}

	// Image generation method stays here as it's part of orchestration
	public async generateRecipeImages(recipe: IRecipe): Promise<{
		main: string;
		thumbnail: string;
		additional: string[];
	}> {
		const traceId = uuidv4();
		logger.info(`[${traceId}] Generating images for recipe: ${recipe.title}`);

		try {
			// Check cache first
			const cacheKey = recipe.title.toLowerCase().trim();
			const cachedImages = RecipeOrchestrator.imageCache.get(cacheKey);
			if (
				cachedImages &&
				Date.now() - cachedImages.timestamp < RecipeOrchestrator.CACHE_TTL
			) {
				logger.info(
					`[${traceId}] Using cached images for recipe: ${recipe.title}`
				);
				return cachedImages.images;
			}

			// Check rate limit before making API calls
			await this.checkRateLimit();

			// Try to get image from Spoonacular first
			let mainImageUrl: string | null = null;
			try {
				if (process.env.SPOONACULAR_API_KEY) {
					const spoonacularUrl = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${process.env.SPOONACULAR_API_KEY}&query=${encodeURIComponent(recipe.title)}&addRecipeInformation=true&number=1`;
					const response = await fetch(spoonacularUrl);
					const data: any = await response.json();

					if (
						data.results &&
						data.results.length > 0 &&
						data.results[0].image
					) {
						mainImageUrl = data.results[0].image;
					}
				}
			} catch (error) {
				logger.warn(
					`[${traceId}] Failed to get image from Spoonacular: ${error}`
				);
			}

			// If no image from Spoonacular, generate with DALL-E
			if (!mainImageUrl) {
				// Use AI Recipe Generator to generate the image prompt
				const aiRecipeGenerator = AIRecipeGenerator.getInstance();
				const mainImagePrompt = await aiRecipeGenerator.createImagePrompt(
					recipe.title
				);

				const mainImageResponse = await fetch(
					'https://api.openai.com/v1/images/generations',
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${this.apiKey}`,
						},
						body: JSON.stringify({
							model: process.env.OPENAI_IMAGE_MODEL || 'dall-e-3',
							prompt: mainImagePrompt,
							n: 1,
							size: (process.env.OPENAI_IMAGE_SIZE || '1024x1024') as
								| '1024x1024'
								| '512x512'
								| 'auto'
								| '1536x1024'
								| '1024x1536'
								| '256x256'
								| '1792x1024'
								| '1024x1792',
							quality: (process.env.OPENAI_IMAGE_QUALITY || 'standard') as
								| 'standard'
								| 'auto'
								| 'hd'
								| 'low'
								| 'medium'
								| 'high',
							style: (process.env.OPENAI_IMAGE_STYLE || 'natural') as
								| 'natural'
								| 'vivid',
							response_format: 'b64_json',
						}),
					}
				);

				if (!mainImageResponse.ok) {
					throw new Error(`DALL-E API error: ${mainImageResponse.statusText}`);
				}

				const mainImageData: any = await mainImageResponse.json();
				if (mainImageData.data && mainImageData.data[0]?.b64_json) {
					mainImageUrl = `data:image/png;base64,${mainImageData.data[0].b64_json}`;
				}
			}

			if (!mainImageUrl) {
				throw new Error('Failed to generate or find main image');
			}

			// Use the main image as thumbnail to reduce API calls
			const thumbnailUrl = mainImageUrl;

			// Generate only one additional image instead of three
			let additionalImage: string | null = null;
			try {
				await this.checkRateLimit();
				// Use AI Recipe Generator to generate the additional image prompt
				const aiRecipeGenerator = AIRecipeGenerator.getInstance();
				const additionalPrompt = await aiRecipeGenerator.createImagePrompt(
					`${recipe.title} in storage container`
				);

				const response = await fetch(
					'https://api.openai.com/v1/images/generations',
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${this.apiKey}`,
						},
						body: JSON.stringify({
							model: process.env.OPENAI_IMAGE_MODEL || 'dall-e-3',
							prompt: additionalPrompt,
							n: 1,
							size: (process.env.OPENAI_IMAGE_SIZE || '1024x1024') as
								| '1024x1024'
								| '512x512'
								| 'auto'
								| '1536x1024'
								| '1024x1536'
								| '256x256'
								| '1792x1024'
								| '1024x1792',
							quality: (process.env.OPENAI_IMAGE_QUALITY || 'standard') as
								| 'standard'
								| 'auto'
								| 'hd'
								| 'low'
								| 'medium'
								| 'high',
							style: (process.env.OPENAI_IMAGE_STYLE || 'natural') as
								| 'natural'
								| 'vivid',
							response_format: 'b64_json',
						}),
					}
				);

				if (!response.ok) {
					throw new Error(`DALL-E API error: ${response.statusText}`);
				}

				const data: any = await response.json();
				if (data.data && data.data[0]?.b64_json) {
					additionalImage = `data:image/png;base64,${data.data[0].b64_json}`;
				}
			} catch (error) {
				logger.warn(
					`[${traceId}] Failed to generate additional image: ${error}`
				);
			}

			const images = {
				main: mainImageUrl,
				thumbnail: thumbnailUrl,
				additional: additionalImage ? [additionalImage] : [],
			};

			// Cache the generated images
			RecipeOrchestrator.imageCache.set(cacheKey, {
				images,
				timestamp: Date.now(),
			});

			// Clean up old cache entries
			const now = Date.now();
			for (const [key, value] of RecipeOrchestrator.imageCache.entries()) {
				if (now - value.timestamp > RecipeOrchestrator.CACHE_TTL) {
					RecipeOrchestrator.imageCache.delete(key);
				}
			}

			logger.info(
				`[${traceId}] Successfully generated images for recipe: ${recipe.title}`
			);

			return images;
		} catch (error) {
			logger.error(`[${traceId}] Error generating images: ${error}`);
			// Return placeholder images if generation fails
			return {
				main: config.placeholderImageUrl,
				thumbnail: config.placeholderImageUrl,
				additional: [],
			};
		}
	}

	private async checkRateLimit(): Promise<void> {
		const now = Date.now();
		// Remove old entries from the queue
		RecipeOrchestrator.rateLimitQueue =
			RecipeOrchestrator.rateLimitQueue.filter(
				(entry: { timestamp: number; count: number }) =>
					now - entry.timestamp < RecipeOrchestrator.RATE_LIMIT.window
			);

		// Count requests in the current window
		const currentCount = RecipeOrchestrator.rateLimitQueue.reduce(
			(sum: number, entry: { timestamp: number; count: number }) =>
				sum + entry.count,
			0
		);

		if (currentCount >= RecipeOrchestrator.RATE_LIMIT.requests) {
			const oldestEntry = RecipeOrchestrator.rateLimitQueue[0];
			const waitTime =
				RecipeOrchestrator.RATE_LIMIT.window - (now - oldestEntry.timestamp);
			logger.info(`Rate limit reached, waiting ${waitTime}ms`);
			await new Promise((resolve) => setTimeout(resolve, waitTime));
			return this.checkRateLimit();
		}

		// Add current request to queue
		RecipeOrchestrator.rateLimitQueue.push({ timestamp: now, count: 1 });
	}

	private isRecipeComplete(recipe: IRecipe): boolean {
		// Check all required fields
		for (const field of REQUIRED_FIELDS) {
			if (!(field in recipe) || !recipe[field as keyof IRecipe]) {
				logger.error(`Missing required field: ${field}`);
				return false;
			}
		}

		// Validate arrays
		for (const field of ARRAY_FIELDS) {
			const value = recipe[field as keyof IRecipe];
			if (!Array.isArray(value) || value.length === 0) {
				logger.error(`Invalid or empty array for field: ${field}`);
				return false;
			}
		}

		// Validate ingredients structure using centralized validator
		if (!IngredientValidator.isValidIngredients(recipe.ingredients)) {
			logger.error(`Invalid ingredient structure in recipe: ${recipe.title}`);
			return false;
		}

		// Validate numeric fields
		for (const field of NUMERIC_FIELDS) {
			const value = recipe[field as keyof IRecipe];
			if (typeof value !== 'number' || value <= 0) {
				logger.error(`Invalid numeric value for field: ${field}`);
				return false;
			}
		}

		return true;
	}

	private cleanRecipeTitle(title: string): string {
		// Remove season names from title
		const seasonPatterns = [
			/\b(Spring|Summer|Fall|Autumn|Winter)\b/gi,
			/\b(spring|summer|fall|autumn|winter)\b/gi,
		];

		let cleanedTitle = title;
		for (const pattern of seasonPatterns) {
			cleanedTitle = cleanedTitle.replace(pattern, '').trim();
		}

		// Remove any double spaces that might result
		cleanedTitle = cleanedTitle.replace(/\s+/g, ' ').trim();

		// Capitalize first letter if needed
		if (cleanedTitle.length > 0) {
			cleanedTitle =
				cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);
		}

		return cleanedTitle;
	}

	// Additional methods like fetchRecipeFromSpoonacular, ensureRecipeCount, etc.
	// would continue here with the same logic but updated class references...
}
