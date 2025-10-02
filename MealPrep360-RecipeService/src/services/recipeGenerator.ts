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
import { MealPrep360Service } from './mealPrep360Service.js';
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

export class RecipeGenerator {
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

	private static instance: RecipeGenerator;
	private apiKey: string;
	private scheduledTask: NodeJS.Timeout | null = null;
	private jobService: JobService;
	private queueService: QueueService;
	private mealPrep360Service: MealPrep360Service;

	private constructor() {
		this.apiKey = config.openai.apiKey || '';
		if (!this.apiKey) {
			throw new Error('OpenAI API key is not configured');
		}
		this.jobService = JobService.getInstance();
		this.queueService = QueueService.getInstance();
		this.mealPrep360Service = MealPrep360Service.getInstance();
	}

	public static getInstance(): RecipeGenerator {
		if (!RecipeGenerator.instance) {
			RecipeGenerator.instance = new RecipeGenerator();
		}
		return RecipeGenerator.instance;
	}

	public async generateRecipe(
		season: string,
		recipeName?: string
	): Promise<IRecipe> {
		logger.info(
			'[generateRecipe] Using MealPrep360 Service for freezer meal recipe generation...'
		);

		try {
			// Use the MealPrep360 service to generate the recipe
			const rawRecipe = await this.mealPrep360Service.generateRecipe({
				season,
				recipeName,
			});
			const auditResult = await this.mealPrep360Service.auditRecipe(rawRecipe);
			const recipeToReturn = auditResult.fixedRecipe || rawRecipe;

			// Convert MealPrep360 response to IRecipe format
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
				'[generateRecipe] Recipe generated with MealPrep360 Service: ' +
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
				'[generateRecipe] Error generating recipe with MealPrep360 Service: ' +
					(err instanceof Error ? err.message : err)
			);
			throw err;
		}
	}

	public async generateRecipeNames(season: string): Promise<string[]> {
		logger.info(
			'[generateRecipeNames] Using MealPrep360 Service for recipe name generation...'
		);

		try {
			// Use the MealPrep360 service to generate recipe names
			const mealPrep360Service = MealPrep360Service.getInstance();
			const recipeNames = await mealPrep360Service.generateRecipeNames(
				season,
				30
			);

			logger.info(
				`[generateRecipeNames] Generated ${recipeNames.length} recipe names with MealPrep360 Service`
			);

			return recipeNames;
		} catch (err) {
			logger.error(
				'[generateRecipeNames] Error generating recipe names with MealPrep360 Service: ' +
					(err instanceof Error ? err.message : err)
			);
			throw err;
		}
	}

	public async fetchRecipeFromSpoonacular(recipeName: string): Promise<any> {
		const traceId = uuidv4();
		logger.info(`[${traceId}] Fetching recipe from Spoonacular: ${recipeName}`);

		// Check if Spoonacular API key is configured
		if (!process.env.SPOONACULAR_API_KEY) {
			logger.warn(
				`[${traceId}] SPOONACULAR_API_KEY is not configured, falling back to OpenAI generation`
			);
			throw new Error('SPOONACULAR_API_KEY is not configured');
		}

		try {
			// Step 1: Use autocomplete to find exact recipe name
			const autocompleteUrl = `https://api.spoonacular.com/recipes/autocomplete?apiKey=${
				process.env.SPOONACULAR_API_KEY
			}&query=${encodeURIComponent(recipeName)}&number=5`;

			logger.info(`[${traceId}] Calling Spoonacular autocomplete API`);
			const autocompleteResponse = await fetch(autocompleteUrl);

			if (!autocompleteResponse.ok) {
				const errorText = await autocompleteResponse.text();
				logger.error(
					`[${traceId}] Spoonacular autocomplete API error: ${autocompleteResponse.status} ${autocompleteResponse.statusText} - ${errorText}`
				);
				throw new Error(
					`Spoonacular autocomplete API error: ${autocompleteResponse.statusText}`
				);
			}

			const autocompleteData = (await autocompleteResponse.json()) as any[];
			logger.info(
				`[${traceId}] Spoonacular autocomplete results: ${JSON.stringify(autocompleteData)}`
			);

			// Step 2: Search for the recipe with complex search
			let foundRecipe = null;
			if (autocompleteData && autocompleteData.length > 0) {
				const searchUrl = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${
					process.env.SPOONACULAR_API_KEY
				}&query=${encodeURIComponent(recipeName)}&addRecipeInformation=true&number=5`;

				logger.info(`[${traceId}] Calling Spoonacular search API`);
				const searchResponse = await fetch(searchUrl);

				if (!searchResponse.ok) {
					throw new Error(
						`Spoonacular search API error: ${searchResponse.statusText}`
					);
				}

				const searchData = (await searchResponse.json()) as any;
				logger.info(
					`[${traceId}] Spoonacular search results: ${JSON.stringify(searchData)}`
				);

				if (searchData.results && searchData.results.length > 0) {
					foundRecipe = searchData.results[0];
				}
			}

			// Step 3: Get detailed recipe information
			if (foundRecipe) {
				const recipeUrl = `https://api.spoonacular.com/recipes/${foundRecipe.id}/information?apiKey=${process.env.SPOONACULAR_API_KEY}`;
				logger.info(`[${traceId}] Calling Spoonacular recipe API for details`);
				const recipeResponse = await fetch(recipeUrl);

				if (!recipeResponse.ok) {
					throw new Error(
						`Spoonacular recipe API error: ${recipeResponse.statusText}`
					);
				}

				const recipeData = (await recipeResponse.json()) as any;
				logger.info(
					`[${traceId}] Successfully fetched recipe from Spoonacular: ${recipeData.title}`
				);
				return recipeData;
			}

			// If no exact match found, try direct search
			return await this.searchRecipeDirectly(recipeName, traceId);
		} catch (error) {
			logger.error(
				`[${traceId}] Error fetching recipe from Spoonacular: ${error}`
			);
			throw error;
		}
	}

	private async searchRecipeDirectly(
		recipeName: string,
		traceId: string
	): Promise<any> {
		logger.info(
			`[${traceId}] Attempting direct recipe search for: ${recipeName}`
		);

		const searchUrl = `https://api.spoonacular.com/recipes/search?apiKey=${
			process.env.SPOONACULAR_API_KEY
		}&query=${encodeURIComponent(recipeName)}&number=1`;

		const searchResponse = await fetch(searchUrl);
		if (!searchResponse.ok) {
			const errorText = await searchResponse.text();
			logger.error(
				`[${traceId}] Direct search API error: ${searchResponse.status} ${searchResponse.statusText} - ${errorText}`
			);
			throw new Error(`No Spoonacular match for: ${recipeName}`);
		}

		const searchData: any = await searchResponse.json();
		if (!searchData.results || searchData.results.length === 0) {
			logger.warn(`[${traceId}] No direct search results for: ${recipeName}`);
			throw new Error(`No Spoonacular match for: ${recipeName}`);
		}

		const recipe = searchData.results[0];
		logger.info(
			`[${traceId}] Found recipe through direct search: ${recipe.title}`
		);
		return recipe;
	}

	private generateNameVariations(recipeName: string): string[] {
		const variations: string[] = [recipeName];

		// Remove common prefixes/suffixes
		const prefixesToRemove = ['Freezer', 'Meal Prep', 'Batch', 'Make-Ahead'];
		const suffixesToRemove = ['Freezer', 'Meal Prep', 'Batch', 'Make-Ahead'];

		// Remove prefixes
		for (const prefix of prefixesToRemove) {
			if (recipeName.toLowerCase().startsWith(prefix.toLowerCase())) {
				variations.push(recipeName.substring(prefix.length).trim());
			}
		}

		// Remove suffixes
		for (const suffix of suffixesToRemove) {
			if (recipeName.toLowerCase().endsWith(suffix.toLowerCase())) {
				variations.push(
					recipeName.substring(0, recipeName.length - suffix.length).trim()
				);
			}
		}

		// Remove quantities (e.g., "4-Person", "6-Serving")
		const quantityPattern = /\d+[- ]?(Person|Serving|Portion|Batch)/i;
		if (quantityPattern.test(recipeName)) {
			variations.push(recipeName.replace(quantityPattern, '').trim());
		}

		// Remove cooking methods
		const cookingMethods = [
			'Slow Cooker',
			'Instant Pot',
			'Pressure Cooker',
			'Air Fryer',
			'Oven-Baked',
		];
		for (const method of cookingMethods) {
			if (recipeName.includes(method)) {
				variations.push(recipeName.replace(method, '').trim());
			}
		}

		// Remove dietary indicators
		const dietaryIndicators = [
			'Gluten-Free',
			'Low-Carb',
			'Keto',
			'Vegan',
			'Vegetarian',
		];
		for (const indicator of dietaryIndicators) {
			if (recipeName.includes(indicator)) {
				variations.push(recipeName.replace(indicator, '').trim());
			}
		}

		// Remove extra spaces and duplicates
		return [...new Set(variations.map((v) => v.replace(/\s+/g, ' ').trim()))];
	}

	private buildPrompt(season: string): string {
		return `Generate a freezer-prep recipe for ${season}. The recipe should be suitable for batch preparation and freezing.

Recipe Type Requirements:
- Must be a CROCK POT, SLOW COOKER, or CASSEROLE-TYPE recipe
- Suitable for batch cooking (making large quantities at once)
- Should be a one-pot meal, stew, soup, casserole, or similar dish
- Perfect for making ahead and freezing in portions

Requirements:
1. Title: A descriptive name for the recipe
   - DO NOT include season names (Spring, Summer, Fall, Winter, Autumn) in the title
   - DO NOT include batch-prep terms (batch, meal prep, freezer-friendly, etc.) in the title
   - Focus on the dish name and main ingredients
2. Description: A brief overview of the recipe
3. Ingredients: List of ingredients with amounts and units
4. Prep Instructions: Step-by-step instructions for preparing the meal for freezing (no cooking during prep)
5. Prep Time: Time in minutes to prepare the meal for freezing
6. Cook Time: Time in minutes to cook the meal after defrosting
7. Servings: Number of servings the recipe makes
8. Tags: Relevant tags focusing ONLY on cuisine type (e.g. "Italian"), main ingredients (e.g. "chicken"), dietary preferences (e.g. "low-carb"), or cooking methods (e.g. "baked"). DO NOT include any tags about freezing, meal prep, or storage - these are implied.
9. Storage Time: Maximum time in days the meal can be stored in the freezer
10. Container Suggestions: Types of containers suitable for storing the meal
11. Defrost Instructions: Step-by-step instructions for defrosting the meal
12. Cooking Instructions: Step-by-step instructions for cooking the meal after defrosting
13. Serving Instructions: How to serve the meal

Rules:
- No cooking should be done during prep, only assembly and freezing
- All ingredients should be raw or pre-cooked
- Include clear storage and defrosting instructions
- Ensure the recipe is suitable for batch preparation
- Include specific container recommendations
- Provide detailed defrosting and cooking instructions
- For tags, ONLY include descriptive aspects of the recipe itself - DO NOT include any tags about freezing, meal prep, or storage methods

Format the response as a JSON object with the following structure:
{
    "title": "string",
    "description": "string",
    "ingredients": [
        {
            "name": "string",
            "amount": "string",
            "unit": "string"
        }
    ],
    "prepInstructions": ["string"],
    "prepTime": number,
    "cookTime": number,
    "servings": number,
    "tags": ["string"],
    "storageTime": number,
    "containerSuggestions": ["string"],
    "defrostInstructions": ["string"],
    "cookingInstructions": ["string"],
    "servingInstructions": ["string"]
}

Return ONLY the JSON object, no additional text or explanation.`;
	}

	private async callOpenAI(
		prompt: string,
		maxTokens: number = 2000,
		model: string = config.openai.model
	): Promise<any> {
		const traceId = uuidv4();
		const maxRetries = 3;
		let attempt = 0;
		let lastError: any;

		while (attempt < maxRetries) {
			try {
				logger.info(
					`[${traceId}] [callOpenAI] Attempt ${attempt + 1}/${maxRetries} with model ${model}`
				);

				// Add timeout to fetch request
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

				const response = await fetch(
					'https://openrouter.ai/api/v1/chat/completions',
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${this.apiKey}`,
						},
						body: JSON.stringify({
							model,
							messages: [
								{
									role: 'system',
									content:
										'You are a professional chef specializing in freezer-prep meals, particularly crock pot, slow cooker, and casserole recipes. Focus on batch cooking recipes that are perfect for making large quantities. Return only valid JSON. Never include any text outside the JSON structure. Never use markdown formatting. Never include explanations or commentary. Do not include season names or batch-prep terms in recipe titles.',
								},
								{
									role: 'user',
									content: prompt,
								},
							],
							temperature: 0.7,
							max_tokens: maxTokens,
							response_format: { type: 'json_object' },
						}),
						signal: controller.signal,
					}
				);

				clearTimeout(timeoutId);

				if (!response.ok) {
					const errorText = await response.text();
					logger.error(
						`[${traceId}] [callOpenAI] API error: ${response.status} ${response.statusText} - ${errorText}`
					);
					throw new Error(
						`OpenRouter API error: ${response.status} ${response.statusText}`
					);
				}

				const data = (await response.json()) as OpenAIResponse;
				if (!data.choices || data.choices.length === 0) {
					throw new Error('OpenRouter returned no choices');
				}

				let content = data.choices[0].message.content;
				logger.info(`[${traceId}] [callOpenAI] Raw response: ${content}`);

				// Strip any markdown code fences if present
				content = content
					.replace(/```json/g, '')
					.replace(/```/g, '')
					.trim();

				// Parse JSON response
				try {
					const parsed = JSON.parse(content);
					logger.info(
						`[${traceId}] [callOpenAI] Successfully parsed JSON response`
					);
					return parsed;
				} catch (parseError) {
					logger.error(
						`[${traceId}] [callOpenAI] JSON parse error: ${parseError}`
					);
					logger.error(
						`[${traceId}] [callOpenAI] Invalid JSON content: ${content}`
					);
					throw new Error('Invalid JSON response from OpenAI');
				}
			} catch (error) {
				lastError = error;
				attempt++;
				if (attempt < maxRetries) {
					const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff with max 5s
					logger.info(
						`[${traceId}] [callOpenAI] Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`
					);
					await new Promise((resolve) => setTimeout(resolve, delay));
				}
			}
		}

		logger.error(
			`[${traceId}] [callOpenAI] Failed after ${maxRetries} attempts. Last error: ${lastError}`
		);
		throw new Error(
			`Failed after ${maxRetries} attempts. Last error: ${lastError}`
		);
	}

	private containsHtmlMarkup(text: string): boolean {
		// Check for common HTML tags and entities
		const htmlPattern = /<[^>]*>|&[a-zA-Z]+;|&#\d+;/;
		return htmlPattern.test(text);
	}

	private validateAndFormatRecipe(recipe: any, season: string): IRecipe {
		// Add missing required fields with defaults
		if (!recipe.season) {
			recipe.season = season;
		}

		// Fix cookTime if it's 0 or missing
		if (!recipe.cookTime || recipe.cookTime === 0) {
			recipe.cookTime = 1; // Default to 1 minute minimum
		}

		// First validate that all required fields exist
		const requiredFields = REQUIRED_FIELDS;
		const missingFields = requiredFields.filter((field) => !recipe[field]);

		if (missingFields.length > 0) {
			logger.error(
				`[validateAndFormatRecipe] Missing required fields: ${missingFields.join(', ')}`
			);
			throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
		}

		// Validate array fields
		const arrayFields = ARRAY_FIELDS;
		const invalidArrays = arrayFields.filter(
			(field) => !Array.isArray(recipe[field]) || recipe[field].length === 0
		);

		if (invalidArrays.length > 0) {
			logger.error(
				`[validateAndFormatRecipe] Invalid or empty arrays for fields: ${invalidArrays.join(', ')}`
			);
			throw new Error(
				`Invalid or empty arrays for fields: ${invalidArrays.join(', ')}`
			);
		}

		// Validate description
		if (
			typeof recipe.description !== 'string' ||
			recipe.description.length === 0
		) {
			throw new Error('Description is required and must be a non-empty string');
		}
		if (recipe.description.length > 150) {
			throw new Error('Description must be under 150 characters');
		}
		if (
			!recipe.description.includes('freezer') &&
			!recipe.description.includes('freeze')
		) {
			throw new Error('Description must mention freezer-friendly aspects');
		}
		if (this.containsHtmlMarkup(recipe.description)) {
			throw new Error('Description must not contain HTML markup');
		}

		// Validate title
		if (this.containsHtmlMarkup(recipe.title)) {
			throw new Error('Title must not contain HTML markup');
		}

		// Validate ingredients
		recipe.ingredients.forEach((ing: any) => {
			if (
				this.containsHtmlMarkup(ing.name) ||
				this.containsHtmlMarkup(ing.amount) ||
				this.containsHtmlMarkup(ing.unit)
			) {
				throw new Error('Ingredient fields must not contain HTML markup');
			}
		});

		// Validate all instruction arrays
		[
			'prepInstructions',
			'defrostInstructions',
			'cookingInstructions',
			'servingInstructions',
		].forEach((field) => {
			recipe[field].forEach((instruction: string) => {
				if (this.containsHtmlMarkup(instruction)) {
					throw new Error(`${field} must not contain HTML markup`);
				}
			});
		});

		// Validate tags and container suggestions
		['tags', 'containerSuggestions'].forEach((field) => {
			recipe[field].forEach((item: string) => {
				if (this.containsHtmlMarkup(item)) {
					throw new Error(`${field} must not contain HTML markup`);
				}
			});
		});

		// Convert the new format to the internal format with strict validation
		const formattedRecipe: IRecipe = {
			title: this.cleanRecipeTitle(recipe.title),
			description: recipe.description,
			ingredients: recipe.ingredients.map((ing: any) => ({
				name: ing.name,
				amount: ing.amount,
				unit: ing.unit,
			})),
			prepInstructions: recipe.prepInstructions,
			prepTime:
				typeof recipe.prepTime === 'number'
					? recipe.prepTime
					: this.parseTimeToMinutes(recipe.prepTime),
			cookTime:
				typeof recipe.cookTime === 'number'
					? recipe.cookTime
					: this.parseTimeToMinutes(recipe.cookTime),
			servings:
				typeof recipe.servings === 'number'
					? recipe.servings
					: parseInt(recipe.servings),
			storageTime:
				typeof recipe.storageTime === 'number'
					? recipe.storageTime
					: this.parseStorageTime(recipe.storageTime),
			containerSuggestions: recipe.containerSuggestions,
			defrostInstructions: recipe.defrostInstructions,
			cookingInstructions: recipe.cookingInstructions,
			servingInstructions: recipe.servingInstructions,
			season: season,
			createdAt: new Date(),
			updatedAt: new Date(),
			tags: (recipe.tags as string[])
				.filter(
					(tag: string) =>
						!TAGS_TO_REMOVE.includes(tag.toLowerCase()) && tag.trim().length > 0
				)
				.map((tag: string) => tag.trim()),
		};

		// Validate numeric fields
		if (formattedRecipe.prepTime <= 0 || formattedRecipe.prepTime > 720) {
			throw new Error('Invalid prep time: must be between 1 and 720 minutes');
		}
		if (formattedRecipe.cookTime <= 0 || formattedRecipe.cookTime > 720) {
			throw new Error('Invalid cook time: must be between 1 and 720 minutes');
		}
		if (formattedRecipe.servings <= 0 || formattedRecipe.servings > 50) {
			throw new Error('Invalid servings: must be between 1 and 50');
		}
		if (formattedRecipe.storageTime <= 0 || formattedRecipe.storageTime > 365) {
			throw new Error('Invalid storage time: must be between 1 and 365 days');
		}

		// Validate title length
		if (
			formattedRecipe.title.length < 3 ||
			formattedRecipe.title.length > 100
		) {
			throw new Error(
				'Invalid title length: must be between 3 and 100 characters'
			);
		}

		// Validate ingredients
		if (formattedRecipe.ingredients.length < 2) {
			throw new Error('Recipe must have at least 2 ingredients');
		}

		// Validate instructions arrays
		if (formattedRecipe.prepInstructions.length < 1) {
			throw new Error('Recipe must have at least 1 prep instruction');
		}
		if (formattedRecipe.cookingInstructions.length < 1) {
			throw new Error('Recipe must have at least 1 cooking instruction');
		}
		if (formattedRecipe.defrostInstructions.length < 1) {
			throw new Error('Recipe must have at least 1 defrost instruction');
		}
		if (formattedRecipe.servingInstructions.length < 1) {
			throw new Error('Recipe must have at least 1 serving instruction');
		}

		// Add required tags after filtering out freezer-related ones
		if (!formattedRecipe.tags.includes(season)) {
			formattedRecipe.tags.push(season);
		}
		if (!formattedRecipe.tags.includes('freezer-friendly')) {
			formattedRecipe.tags.push('freezer-friendly');
		}

		return formattedRecipe;
	}

	private parseTimeToMinutes(timeStr: string): number {
		const match = timeStr.match(/(\d+)\s*(minute|hour|hr|min)s?/i);
		if (!match) return 30; // Default to 30 minutes if parsing fails

		const value = parseInt(match[1]);
		const unit = match[2].toLowerCase();

		if (unit === 'hour' || unit === 'hr') {
			return value * 60;
		}
		return value;
	}

	private parseStorageTime(timeStr: string): number {
		const match = timeStr.match(/(\d+)\s*(day|month|week)s?/i);
		if (!match) return 30; // Default to 30 days if parsing fails

		const value = parseInt(match[1]);
		const unit = match[2].toLowerCase();

		if (unit === 'month') {
			return value * 30;
		} else if (unit === 'week') {
			return value * 7;
		}
		return value;
	}

	/**
	 * Step 1: Generate freezer-friendly meal concepts or ingredient sets using OpenAI
	 */
	public async generateFreezerFriendlyConcepts(
		season: string
	): Promise<string[]> {
		const prompt = FREEZER_FRIENDLY_CONCEPTS_PROMPT;
		const response = await this.callOpenAI(prompt);
		if (Array.isArray(response)) return response;
		if (typeof response === 'object' && Array.isArray(response.concepts))
			return response.concepts;
		throw new Error('Unexpected OpenAI response for freezer-friendly concepts');
	}

	/**
	 * Step 2: Search Spoonacular for recipes matching a concept/ingredient set
	 */
	public async searchSpoonacularRecipes(
		concept: string,
		number: number = 5
	): Promise<any[]> {
		if (!process.env.SPOONACULAR_API_KEY) {
			throw new Error('SPOONACULAR_API_KEY is not configured');
		}
		const searchUrl = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${
			process.env.SPOONACULAR_API_KEY
		}&query=${encodeURIComponent(
			concept
		)}&addRecipeInformation=true&fillIngredients=true&instructionsRequired=true&number=${number}`;
		const searchResponse = await fetch(searchUrl);
		if (!searchResponse.ok) {
			throw new Error(
				`Spoonacular search API error: ${searchResponse.statusText}`
			);
		}
		const searchData: any = await searchResponse.json();
		return searchData.results || [];
	}

	/**
	 * Step 3: Classify a Spoonacular recipe for freezer-friendliness using MealPrep360 Service
	 */
	public async classifyFreezerFriendly(
		recipe: any
	): Promise<{ freezerFriendly: boolean; reason: string }> {
		try {
			const mealPrep360Service = MealPrep360Service.getInstance();
			return await mealPrep360Service.classifyFreezerFriendly(recipe);
		} catch (error) {
			logger.error(
				`Error classifying recipe for freezer-friendliness: ${error}`
			);
			// Fallback to default response
			return { freezerFriendly: false, reason: 'Unable to classify recipe' };
		}
	}

	/**
	 * Main hybrid recipe generation method
	 */
	public async generateFreezerFriendlyRecipes(season: string): Promise<any[]> {
		const concepts = await this.generateFreezerFriendlyConcepts(season);
		const recipes: any[] = [];
		const maxRecipes = 30;
		for (const concept of concepts) {
			const found = await this.searchSpoonacularRecipes(concept, 5);
			for (const recipe of found) {
				const classification = await this.classifyFreezerFriendly(recipe);
				if (classification.freezerFriendly) {
					recipes.push({
						...recipe,
						freezerFriendlyReason: classification.reason,
					});
					if (recipes.length >= maxRecipes) return recipes;
				}
			}
			if (recipes.length >= maxRecipes) break;
		}
		return recipes;
	}

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
					await this.jobService.updateJobProgress(jobId, progress, 30); // Total is always 30 recipes
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

	private async acquireLock(): Promise<boolean> {
		const traceId = uuidv4();
		try {
			const redis = new Redis({
				host: process.env.REDIS_HOST,
				port: Number(process.env.REDIS_PORT),
				username: process.env.REDIS_USER,
				password: process.env.REDIS_PASSWORD,
				// tls: { rejectUnauthorized: false }, // Uncomment if your Redis requires TLS
			});

			// Try to acquire the lock using SET NX
			const result = await redis.set(
				RecipeGenerator.LOCK_KEY,
				process.pid.toString(),
				'EX',
				Math.floor(RecipeGenerator.LOCK_TTL / 1000), // Convert to seconds
				'NX'
			);

			if (result === 'OK') {
				logger.info(
					`[${traceId}] Acquired distributed lock for recipe count check`
				);
				return true;
			}

			logger.info(
				`[${traceId}] Failed to acquire distributed lock for recipe count check`
			);
			return false;
		} catch (error) {
			logger.error(`[${traceId}] Error acquiring distributed lock: ${error}`);
			return false;
		}
	}

	private async releaseLock(): Promise<void> {
		const traceId = uuidv4();
		try {
			const redis = new Redis({
				host: process.env.REDIS_HOST,
				port: Number(process.env.REDIS_PORT),
				username: process.env.REDIS_USER,
				password: process.env.REDIS_PASSWORD,
				// tls: { rejectUnauthorized: false }, // Uncomment if your Redis requires TLS
			});

			// Only release if we own the lock
			const currentOwner = await redis.get(RecipeGenerator.LOCK_KEY);
			if (currentOwner === process.pid.toString()) {
				await redis.del(RecipeGenerator.LOCK_KEY);
				logger.info(
					`[${traceId}] Released distributed lock for recipe count check`
				);
			}
		} catch (error) {
			logger.error(`[${traceId}] Error releasing distributed lock: ${error}`);
		}
	}

	public async ensureRecipeCount(): Promise<void> {
		const traceId = uuidv4();
		logger.info(`[${traceId}] Starting recipe count check`);

		// Try to acquire the distributed lock
		const lockAcquired = await this.acquireLock();
		if (!lockAcquired) {
			logger.info(
				`[${traceId}] Another instance is already checking recipe count`
			);
			return;
		}

		try {
			const count = await Recipe.countDocuments();
			logger.info(`[${traceId}] Current recipe count: ${count}`);

			if (count < 100) {
				const currentSeason = this.getCurrentSeason();
				const recipesNeeded = 100 - count;
				const batchSize = Math.min(30, recipesNeeded);

				logger.info(
					`[${traceId}] Generating ${batchSize} recipes for ${currentSeason} season`
				);

				    const jobId = await this.queueService.enqueue('jobs', {
					type: 'recipe_count_ensure',
					total: batchSize,
					season: currentSeason,
				});

				logger.info(
					`[${traceId}] Created job ${jobId} for recipe count ensure`
				);
			}
		} catch (error) {
			logger.error(`[${traceId}] Error in ensureRecipeCount: ${error}`);
			throw error;
		} finally {
			// Always release the lock
			await this.releaseLock();
		}
	}

	private getCurrentSeason(): string {
		// Default to current season based on date
		const month = new Date().getMonth();
		if (month >= 2 && month <= 4) return 'spring';
		if (month >= 5 && month <= 7) return 'summer';
		if (month >= 8 && month <= 10) return 'fall';
		return 'winter';
	}

	private async validateAndCompleteRecipe(recipe: any): Promise<IRecipe> {
		const missingFields: string[] = [];
		const requiredFields = REQUIRED_FIELDS;

		// Check for missing fields
		for (const field of requiredFields) {
			if (!(field in recipe) || !recipe[field as keyof IRecipe]) {
				missingFields.push(field);
			}
		}

		if (missingFields.length > 0) {
			logger.info(
				`Missing fields for recipe ${recipe.title}: ${missingFields.join(', ')}`
			);

			// Generate missing data using OpenAI
			const prompt = `Complete the following recipe by providing the missing fields: ${missingFields.join(', ')}.
			Current recipe data:
			${JSON.stringify(recipe, null, 2)}
			
			Return a JSON object with ONLY the missing fields. Ensure all values are properly formatted according to the schema.`;

			const completion = await this.callOpenAI(prompt);

			// Merge the generated data with the existing recipe
			recipe = {
				...recipe,
				...completion,
			};
		}

		// Validate and format the complete recipe
		return this.validateAndFormatRecipe(
			recipe,
			recipe.season || this.getCurrentSeason()
		);
	}

	// Add new method to start scheduled task
	public startScheduledTask(intervalHours: number = 24): void {
		// Only start scheduled task in API server process, not in worker
		if (process.env.IS_WORKER === 'true') {
			logger.info('Running in worker process, skipping scheduled task start');
			return;
		}

		if (this.scheduledTask) {
			logger.info('Scheduled task already running');
			return;
		}

		logger.info(
			`Starting scheduled recipe count check every ${intervalHours} hours`
		);

		// Run immediately on startup
		this.runScheduledTask();

		// Then schedule regular runs
		this.scheduledTask = setInterval(
			() => {
				this.runScheduledTask();
			},
			intervalHours * 60 * 60 * 1000
		);
	}

	// Add new method to stop scheduled task
	public stopScheduledTask(): void {
		if (this.scheduledTask) {
			clearInterval(this.scheduledTask);
			this.scheduledTask = null;
			logger.info('Stopped scheduled recipe count check');
		}
	}

	// Add new method to run the scheduled task
	private async runScheduledTask(): Promise<void> {
		const traceId = uuidv4();
		logger.info(`[${traceId}] Starting scheduled recipe count check`);

		try {
			// Removed: await this.ensureRecipeCount();
		} catch (error) {
			logger.error(
				`[${traceId}] Error in scheduled recipe count check: ${error}`
			);
		}
	}

	private async checkRateLimit(): Promise<void> {
		const now = Date.now();
		// Remove old entries from the queue
		RecipeGenerator.rateLimitQueue = RecipeGenerator.rateLimitQueue.filter(
			(entry: { timestamp: number; count: number }) =>
				now - entry.timestamp < RecipeGenerator.RATE_LIMIT.window
		);

		// Count requests in the current window
		const currentCount = RecipeGenerator.rateLimitQueue.reduce(
			(sum: number, entry: { timestamp: number; count: number }) =>
				sum + entry.count,
			0
		);

		if (currentCount >= RecipeGenerator.RATE_LIMIT.requests) {
			const oldestEntry = RecipeGenerator.rateLimitQueue[0];
			const waitTime =
				RecipeGenerator.RATE_LIMIT.window - (now - oldestEntry.timestamp);
			logger.info(`Rate limit reached, waiting ${waitTime}ms`);
			await new Promise((resolve) => setTimeout(resolve, waitTime));
			return this.checkRateLimit();
		}

		// Add current request to queue
		RecipeGenerator.rateLimitQueue.push({ timestamp: now, count: 1 });
	}

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
			const cachedImages = RecipeGenerator.imageCache.get(cacheKey);
			if (
				cachedImages &&
				Date.now() - cachedImages.timestamp < RecipeGenerator.CACHE_TTL
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
				// Use MealPrep360Service to generate the image prompt
				const mealPrep360Service = MealPrep360Service.getInstance();
				const mainImagePrompt = await mealPrep360Service.createImagePrompt(
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
				// Use MealPrep360Service to generate the additional image prompt
				const mealPrep360Service = MealPrep360Service.getInstance();
				const additionalPrompt = await mealPrep360Service.createImagePrompt(
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
			RecipeGenerator.imageCache.set(cacheKey, {
				images,
				timestamp: Date.now(),
			});

			// Clean up old cache entries
			const now = Date.now();
			for (const [key, value] of RecipeGenerator.imageCache.entries()) {
				if (now - value.timestamp > RecipeGenerator.CACHE_TTL) {
					RecipeGenerator.imageCache.delete(key);
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

	private async generateRecipeFromName(
		recipeName: string,
		season: string,
		traceId: string
	): Promise<IRecipe> {
		logger.info(`[${traceId}] Generating recipe from name: ${recipeName}`);

		try {
			// Skip Spoonacular and use OpenAI generation directly
			logger.info(`[${traceId}] Using OpenAI generation for: ${recipeName}`);
			const recipe = await this.generateRecipe(season, undefined);

			// Override the title with the requested recipe name (cleaned)
			recipe.title = this.cleanRecipeTitle(recipeName);

			return recipe;
		} catch (error) {
			logger.error(
				`[${traceId}] Error generating recipe with OpenAI: ${error}`
			);
			throw error;
		}
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
}
