import OpenAI from 'openai';
import { logger } from './logger.js';
import { v4 as uuidv4 } from 'uuid';
import { IngredientValidator } from '../utils/ingredientValidator.js';

export interface MealPrep360Recipe {
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
	allergenInfo: string[];
	dietaryInfo: string[];
	season: string;
}

export interface MealPrep360Request {
	season: string;
	recipeName?: string;
	ingredients?: string[];
	dietaryRestrictions?: string[];
	cuisine?: string;
	servings?: number;
}

export interface RecipeAuditResult {
	isValid: boolean;
	missingFields: string[];
	fixedRecipe?: MealPrep360Recipe;
	auditNotes: string[];
}

export class MealPrep360Service {
	private static instance: MealPrep360Service;
	private openai: OpenAI;
	private requestQueue: Array<() => Promise<any>> = [];
	private isProcessingQueue = false;
	private circuitBreaker = {
		failureCount: 0,
		lastFailureTime: 0,
		isOpen: false,
		threshold: 10, // Increased from 5 to 10
		timeout: 30000, // Reduced from 60s to 30s for faster recovery
	};
	private rateLimiter = {
		lastRequestTime: 0,
		minInterval: 100, // 100ms between requests
	};

	private constructor() {
		this.openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});
	}

	public static getInstance(): MealPrep360Service {
		if (!MealPrep360Service.instance) {
			MealPrep360Service.instance = new MealPrep360Service();
		}
		return MealPrep360Service.instance;
	}

	// Add method to reset circuit breaker manually
	public resetCircuitBreaker(): void {
		this.circuitBreaker.isOpen = false;
		this.circuitBreaker.failureCount = 0;
		this.circuitBreaker.lastFailureTime = 0;
		logger.info('Circuit breaker manually reset');
	}

	private async waitForRateLimit(): Promise<void> {
		const now = Date.now();
		const timeSinceLastRequest = now - this.rateLimiter.lastRequestTime;

		if (timeSinceLastRequest < this.rateLimiter.minInterval) {
			const waitTime = this.rateLimiter.minInterval - timeSinceLastRequest;
			await new Promise((resolve) => setTimeout(resolve, waitTime));
		}

		this.rateLimiter.lastRequestTime = Date.now();
	}

	private async executeWithRetry<T>(
		operation: () => Promise<T>,
		maxRetries: number = 3,
		baseDelay: number = 1000
	): Promise<T> {
		let lastError: Error;

		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				// Check circuit breaker with improved recovery logic
				if (this.circuitBreaker.isOpen) {
					const timeSinceLastFailure =
						Date.now() - this.circuitBreaker.lastFailureTime;
					if (timeSinceLastFailure < this.circuitBreaker.timeout) {
						// Allow one test request after half the timeout period
						if (
							timeSinceLastFailure > this.circuitBreaker.timeout / 2 &&
							attempt === 0
						) {
							logger.info('Circuit breaker half-open: allowing test request');
							// Don't throw error, allow the request to proceed as a test
						} else {
							throw new Error('Circuit breaker is open');
						}
					} else {
						// Reset circuit breaker after timeout
						this.circuitBreaker.isOpen = false;
						this.circuitBreaker.failureCount = 0;
						logger.info('Circuit breaker reset after timeout');
					}
				}

				// Wait for rate limit
				await this.waitForRateLimit();

				const result = await operation();

				// Reset circuit breaker on success
				this.circuitBreaker.failureCount = 0;
				this.circuitBreaker.isOpen = false;

				return result;
			} catch (error) {
				lastError = error as Error;

				// Increment failure count
				this.circuitBreaker.failureCount++;
				this.circuitBreaker.lastFailureTime = Date.now();

				if (this.circuitBreaker.failureCount >= this.circuitBreaker.threshold) {
					this.circuitBreaker.isOpen = true;
					logger.warn(
						`Circuit breaker opened due to repeated failures (${this.circuitBreaker.failureCount}/${this.circuitBreaker.threshold})`
					);
					logger.warn(
						`Circuit breaker will reset in ${this.circuitBreaker.timeout / 1000} seconds`
					);
				}

				if (attempt === maxRetries) {
					break;
				}

				// Exponential backoff
				const delay = baseDelay * Math.pow(2, attempt);
				logger.warn(
					`Attempt ${attempt + 1} failed, retrying in ${delay}ms: ${error}`
				);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}

		throw lastError!;
	}

	private stripMarkdownCodeFences(content: string): string {
		// Remove markdown code fences (```json, ```, etc.)
		return content
			.replace(/```json\s*/g, '')
			.replace(/```\s*/g, '')
			.trim();
	}

	private extractJSONFromResponse(response: string): any {
		// First try to parse as-is
		try {
			return JSON.parse(response);
		} catch (error) {
			// Try to extract JSON from the response
			const jsonMatch = response.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				try {
					return JSON.parse(jsonMatch[0]);
				} catch (parseError) {
					logger.warn('Failed to parse extracted JSON:', parseError);
				}
			}

			// Try to fix common JSON issues
			let fixedResponse = response
				.replace(/,\s*}/g, '}') // Remove trailing commas
				.replace(/,\s*]/g, ']') // Remove trailing commas in arrays
				.replace(/([a-zA-Z0-9_]+):/g, '"$1":') // Quote unquoted keys
				.replace(/:\s*'([^']*)'/g, ':"$1"') // Quote single-quoted strings
				.replace(/:\s*([^",\{\}\[\]\s][^,\{\}\[\]]*[^",\{\}\[\]\s])/g, ':"$1"'); // Quote unquoted values

			try {
				return JSON.parse(fixedResponse);
			} catch (finalError) {
				throw new Error(
					`Failed to parse JSON response: ${response.substring(0, 200)}...`
				);
			}
		}
	}

	private getSystemPrompt(): string {
		return `
You are MealPrep360, a professional chef and nutrition expert specializing in freezer-friendly meal preparation. You have extensive knowledge of freezer meal preparation techniques, food safety and storage guidelines, seasonal ingredient availability, dietary restrictions and allergen considerations, batch cooking and meal prep strategies, and container selection and storage optimization.

RECIPE TYPE FOCUS:
- Specialize in CROCK POT, SLOW COOKER, and CASSEROLE-TYPE recipes
- Create one-pot meals, stews, soups, casseroles, and braised dishes
- Ensure all recipes are suitable for batch cooking (large quantities)
- Design recipes that freeze and reheat well

CRITICAL RULES:
- NO COOKING during prep, only assembly and freezing
- All ingredients must freeze well (avoid lettuce, cucumbers, cream-based sauces)
- Use seasonal ingredients available in the specified season
- Include clear storage and defrosting instructions
- Provide specific container recommendations
- Ensure batch preparation suitability
- All fields are required and must be properly formatted
- NO HTML markup allowed in any text fields
- Use plain text only, no formatting or special characters
- All numeric values must be within specified ranges
- All arrays must have at least one element
- Description must be under 150 characters
- Always include allergen and dietary information
- Return ONLY valid JSON, no additional text or explanations
- Never use markdown formatting
- Never include commentary outside the JSON structure
- DO NOT include season names (Spring, Summer, Fall, Winter, Autumn) in the recipe title
- DO NOT include batch-prep terms (batch, meal prep, freezer-friendly, etc.) in the title

Respond ONLY in valid JSON format using the following schema:
{
  "title": "string (3-100 characters, descriptive name without seasons or batch-prep terms)",
  "description": "string (under 150 characters, includes main ingredients, cooking method, freezer-friendly benefits)",
  "ingredients": [{"name": "string", "amount": "string", "unit": "string"}],
  "prepInstructions": ["string (step-by-step prep for freezing, NO COOKING)"],
  "prepTime": "number (1-720 minutes)",
  "cookTime": "number (1-720 minutes, minimum 1 even for no-cook)",
  "servings": "number (1-50)",
  "tags": ["string (must include season)"],
  "storageTime": "number (1-365 days)",
  "containerSuggestions": ["string (specific container types)"],
  "defrostInstructions": ["string (step-by-step defrosting)"],
  "cookingInstructions": ["string (step-by-step cooking after defrosting)"],
  "servingInstructions": ["string (how to serve)"],
  "allergenInfo": ["string (e.g., 'Contains: dairy, nuts')"],
  "dietaryInfo": ["string (e.g., 'Vegetarian', 'Gluten-Free')"],
  "season": "string (spring/summer/fall/winter)"
}

Make sure the response is valid JSON with no commentary or markdown.
		`;
	}

	private buildUserPrompt(request: MealPrep360Request): string {
		let prompt = `Generate a detailed freezer-friendly recipe for ${request.season} season.`;

		if (request.recipeName) {
			prompt += `\nRecipe name: ${request.recipeName}`;
		}

		if (request.ingredients && request.ingredients.length > 0) {
			prompt += `\nMust include these ingredients: ${request.ingredients.join(', ')}`;
		}

		if (request.dietaryRestrictions && request.dietaryRestrictions.length > 0) {
			prompt += `\nDietary restrictions: ${request.dietaryRestrictions.join(', ')}`;
		}

		if (request.cuisine) {
			prompt += `\nCuisine style: ${request.cuisine}`;
		}

		if (request.servings) {
			prompt += `\nServings: ${request.servings}`;
		}

		return prompt;
	}

	public async generateRecipe(
		request: MealPrep360Request
	): Promise<MealPrep360Recipe> {
		const traceId = uuidv4();
		logger.info(
			`[${traceId}] Generating recipe with MealPrep360 logic for ${request.season} season`
		);

		return this.executeWithRetry(async () => {
			const systemPrompt = this.getSystemPrompt();
			const userPrompt = this.buildUserPrompt(request);

			const completion = await this.openai.chat.completions.create({
				model: 'gpt-4',
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt },
				],
				temperature: 0.7,
				max_tokens: 4000,
			});

			const reply = completion.choices[0]?.message?.content;

			if (!reply) {
				throw new Error('No content received from OpenAI');
			}

			logger.info(`[${traceId}] Raw OpenAI response: ${reply}`);

			// Parse the JSON response with improved parsing
			let recipe: any;
			try {
				const cleanedReply = this.stripMarkdownCodeFences(reply);
				recipe = this.extractJSONFromResponse(cleanedReply);
			} catch (parseError) {
				logger.error(
					`[${traceId}] Failed to parse OpenAI response as JSON: ${parseError}`
				);
				throw new Error('Invalid JSON response from OpenAI');
			}

			// Validate and format the recipe
			const validatedRecipe = this.validateAndFormatRecipe(
				recipe,
				request.season
			);

			logger.info(
				`[${traceId}] Successfully generated recipe: ${validatedRecipe.title}`
			);
			return validatedRecipe;
		});
	}

	public async generateRecipeNames(
		season: string,
		count: number = 30
	): Promise<string[]> {
		const traceId = uuidv4();
		logger.info(
			`[${traceId}] Generating ${count} recipe names for ${season} season`
		);

		return this.executeWithRetry(async () => {
			const systemPrompt = `
You are MealPrep360, a professional chef specializing in batch cooking and freezer-friendly meals.
Generate recipe names that are perfect for crock pot, slow cooker, casserole, and one-pot cooking.

CRITICAL RULES:
- DO NOT include season names (Spring, Summer, Fall, Winter, Autumn) in any recipe title
- DO NOT include batch-prep terms (batch, meal prep, freezer-friendly, etc.) in any title
- Focus on the dish itself and main ingredients
- Emphasize hearty, comfort food recipes

Return only a JSON array of recipe names as strings.
Example: ["Beef and Barley Stew", "Chicken Enchilada Casserole", "Mediterranean Lentil Soup"]
			`.trim();

			const userPrompt = `Generate ${count} recipe names suitable for ${season} seasonal ingredients. Focus on crock pot, slow cooker, casserole, and one-pot meals that freeze well. Do NOT include the season name in any recipe title.`;

			const completion = await this.openai.chat.completions.create({
				model: 'gpt-4',
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt },
				],
				temperature: 0.8,
				max_tokens: 2000,
			});

			const reply = completion.choices[0]?.message?.content;

			if (!reply) {
				throw new Error('No content received from OpenAI');
			}

			let result: any;
			try {
				const cleanedReply = this.stripMarkdownCodeFences(reply);
				result = this.extractJSONFromResponse(cleanedReply);
			} catch (parseError) {
				logger.error(
					`[${traceId}] Failed to parse OpenAI response as JSON: ${parseError}`
				);
				throw new Error('Invalid JSON response from OpenAI');
			}

			// Handle different response formats
			let recipeNames: string[] = [];
			if (Array.isArray(result)) {
				recipeNames = result;
			} else if (result.recipes && Array.isArray(result.recipes)) {
				recipeNames = result.recipes;
			} else if (result.names && Array.isArray(result.names)) {
				recipeNames = result.names;
			} else {
				logger.error(
					`[${traceId}] Unexpected response format: ${JSON.stringify(result)}`
				);
				throw new Error('Unexpected response format from OpenAI');
			}

			logger.info(`[${traceId}] Generated ${recipeNames.length} recipe names`);
			return recipeNames;
		});
	}

	public async createImagePrompt(recipeTitle: string): Promise<string> {
		const traceId = uuidv4();
		logger.info(`[${traceId}] Creating image prompt for: ${recipeTitle}`);

		return this.executeWithRetry(async () => {
			const systemPrompt = `
You are MealPrep360, a professional chef. Create detailed DALL-E image generation prompts for recipe photography.
Focus on professional food photography style with proper lighting and composition.
IMPORTANT: The images must NOT contain any text, labels, numbers, or symbols. Generate only realistic food photography.
			`.trim();

			const userPrompt = `Create a DALL-E prompt for a "${recipeTitle}" recipe. The image should be well-lit, appetizing, and showcase the dish in a professional food photography style. Do NOT include any text, labels, numbers, or symbols in the image - just the food itself with appropriate plating and styling. Style: clean, modern, high-end food photography.`;

			const completion = await this.openai.chat.completions.create({
				model: 'gpt-4',
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt },
				],
				temperature: 0.7,
				max_tokens: 500,
			});

			const reply = completion.choices[0]?.message?.content;

			if (!reply) {
				throw new Error('No content received from OpenAI');
			}

			// Add explicit instruction to avoid text
			const finalPrompt = `${reply} The image must not contain any text, labels, numbers, or symbols - only the food and its presentation.`;

			logger.info(`[${traceId}] Generated image prompt: ${finalPrompt}`);
			return finalPrompt;
		});
	}

	public async classifyFreezerFriendly(
		recipe: any
	): Promise<{ freezerFriendly: boolean; reason: string }> {
		const traceId = uuidv4();
		logger.info(
			`[${traceId}] Classifying recipe for freezer-friendliness: ${recipe.title}`
		);

		return this.executeWithRetry(async () => {
			const systemPrompt = `
You are MealPrep360, a professional chef. Analyze recipes for freezer-friendliness.
Consider ingredients, cooking methods, and storage requirements.
Return a JSON object with freezerFriendly (boolean) and reason (string) fields.
			`.trim();

			const userPrompt = `Is this recipe suitable for freezing? Title: "${recipe.title}" Ingredients: ${recipe.extendedIngredients?.map((i: any) => i.original).join(', ')} Instructions: ${recipe.instructions}`;

			const completion = await this.openai.chat.completions.create({
				model: 'gpt-4',
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt },
				],
				temperature: 0.3,
				max_tokens: 500,
			});

			const reply = completion.choices[0]?.message?.content;

			if (!reply) {
				throw new Error('No content received from OpenAI');
			}

			let result: any;
			try {
				const cleanedReply = this.stripMarkdownCodeFences(reply);
				result = this.extractJSONFromResponse(cleanedReply);
			} catch (parseError) {
				logger.error(
					`[${traceId}] Failed to parse OpenAI response as JSON: ${parseError}`
				);
				throw new Error('Invalid JSON response from OpenAI');
			}

			if (typeof result.freezerFriendly === 'boolean' && result.reason) {
				logger.info(
					`[${traceId}] Classification result: ${result.freezerFriendly} - ${result.reason}`
				);
				return result;
			}

			throw new Error('Invalid classification response format');
		});
	}

	public async auditRecipe(recipe: any): Promise<RecipeAuditResult> {
		const traceId = uuidv4();
		logger.info(`[${traceId}] Auditing recipe: ${recipe.title || 'Unknown'}`);

		const auditResult: RecipeAuditResult = {
			isValid: true,
			missingFields: [],
			auditNotes: [],
		};

		// Check required fields (allergenInfo and dietaryInfo are optional)
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
		];

		for (const field of requiredFields) {
			if (!recipe[field]) {
				auditResult.missingFields.push(field);
				auditResult.isValid = false;
			}
		}

		// Check data quality
		if (
			recipe.ingredients &&
			(!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0)
		) {
			auditResult.auditNotes.push('Ingredients array is empty or invalid');
			auditResult.isValid = false;
		}

		if (
			recipe.prepTime &&
			(typeof recipe.prepTime !== 'number' || recipe.prepTime <= 0)
		) {
			auditResult.auditNotes.push('Prep time must be a positive number');
			auditResult.isValid = false;
		}

		if (
			recipe.cookTime &&
			(typeof recipe.cookTime !== 'number' || recipe.cookTime <= 0)
		) {
			auditResult.auditNotes.push('Cook time must be a positive number');
			auditResult.isValid = false;
		}

		// If recipe is invalid, try to fix it
		if (!auditResult.isValid) {
			try {
				auditResult.fixedRecipe = await this.fixRecipe(
					recipe,
					auditResult.missingFields
				);
				auditResult.auditNotes.push('Recipe was automatically fixed');
			} catch (error) {
				auditResult.auditNotes.push(`Failed to fix recipe: ${error}`);
			}
		}

		logger.info(
			`[${traceId}] Audit complete. Valid: ${auditResult.isValid}, Missing fields: ${auditResult.missingFields.length}`
		);
		return auditResult;
	}

	private async fixRecipe(
		recipe: any,
		missingFields: string[]
	): Promise<MealPrep360Recipe> {
		const traceId = uuidv4();
		logger.info(
			`[${traceId}] Attempting to fix recipe with missing fields: ${missingFields.join(', ')}`
		);

		return this.executeWithRetry(async () => {
			const systemPrompt = `
You are MealPrep360, a professional chef. Fix incomplete recipe data by filling in missing fields.
Only provide the missing fields in JSON format, maintaining the existing structure.
			`.trim();

			const userPrompt = `
Fix this incomplete recipe by adding the missing fields: ${missingFields.join(', ')}.

Current recipe data:
${JSON.stringify(recipe, null, 2)}

Return only the missing fields in JSON format. For example, if missing "prepTime" and "cookTime", return:
{
  "prepTime": 30,
  "cookTime": 45
}
			`.trim();

			const completion = await this.openai.chat.completions.create({
				model: 'gpt-4',
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt },
				],
				temperature: 0.3,
				max_tokens: 2000,
			});

			const reply = completion.choices[0]?.message?.content;

			if (!reply) {
				throw new Error('No content received from OpenAI');
			}

			let fixes: any;
			try {
				const cleanedReply = this.stripMarkdownCodeFences(reply);
				fixes = this.extractJSONFromResponse(cleanedReply);
			} catch (parseError) {
				logger.error(
					`[${traceId}] Failed to parse fixes as JSON: ${parseError}`
				);
				throw new Error('Invalid JSON response for recipe fixes');
			}

			// Merge fixes with original recipe
			const fixedRecipe = { ...recipe, ...fixes };

			// Validate the fixed recipe
			return this.validateAndFormatRecipe(
				fixedRecipe,
				recipe.season || 'winter'
			);
		});
	}

	private validateAndFormatRecipe(
		recipe: any,
		season: string
	): MealPrep360Recipe {
		// Validate required fields (allergenInfo and dietaryInfo are optional)
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
		];

		for (const field of requiredFields) {
			if (!recipe[field]) {
				throw new Error(`Missing required field: ${field}`);
			}
		}

		// Provide default values for optional fields
		if (!recipe.allergenInfo) {
			recipe.allergenInfo = [];
		}
		if (!recipe.dietaryInfo) {
			recipe.dietaryInfo = [];
		}

		// Validate and normalize ingredients using centralized validator
		try {
			recipe.ingredients = IngredientValidator.validateIngredients(
				recipe.ingredients
			);
		} catch (error) {
			throw new Error(
				`Invalid ingredient structure: ${error instanceof Error ? error.message : error}`
			);
		}

		// Validate numeric fields
		const numericFields = ['prepTime', 'cookTime', 'servings', 'storageTime'];
		for (const field of numericFields) {
			if (typeof recipe[field] !== 'number' || recipe[field] <= 0) {
				throw new Error(`Invalid numeric value for field: ${field}`);
			}
		}

		// Validate arrays
		const arrayFields = [
			'tags',
			'containerSuggestions',
			'prepInstructions',
			'defrostInstructions',
			'cookingInstructions',
			'servingInstructions',
			'allergenInfo',
			'dietaryInfo',
		];
		for (const field of arrayFields) {
			if (!Array.isArray(recipe[field]) || recipe[field].length === 0) {
				throw new Error(`Invalid or empty array for field: ${field}`);
			}
		}

		// Format the recipe
		return {
			title: recipe.title,
			description: recipe.description,
			ingredients: recipe.ingredients,
			prepInstructions: recipe.prepInstructions,
			prepTime: recipe.prepTime,
			cookTime: recipe.cookTime,
			servings: recipe.servings,
			tags: recipe.tags,
			storageTime: recipe.storageTime,
			containerSuggestions: recipe.containerSuggestions,
			defrostInstructions: recipe.defrostInstructions,
			cookingInstructions: recipe.cookingInstructions,
			servingInstructions: recipe.servingInstructions,
			allergenInfo: recipe.allergenInfo,
			dietaryInfo: recipe.dietaryInfo,
			season: season,
		};
	}
}
