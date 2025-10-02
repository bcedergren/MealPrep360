import OpenAI from 'openai';
import { logger } from './logger.js';
import { v4 as uuidv4 } from 'uuid';
import { IngredientValidator } from '../utils/ingredientValidator.js';

interface CircuitBreakerState {
	failures: number;
	lastFailure: number;
	isOpen: boolean;
	nextAttempt: number;
}

interface MealPrep360Recipe {
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
	allergenInfo?: string[];
	dietaryInfo?: string[];
	season: string;
}

interface AuditResult {
	isValid: boolean;
	issues: string[];
	fixedRecipe?: MealPrep360Recipe;
}

export class AIRecipeGenerator {
	private static instance: AIRecipeGenerator;
	private openai: OpenAI;
	private circuitBreaker: CircuitBreakerState = {
		failures: 0,
		lastFailure: 0,
		isOpen: false,
		nextAttempt: 0,
	};
	private readonly maxFailures = 10; // Increased from 5
	private readonly timeout = 30000; // 30 seconds
	private readonly halfOpenTimeout = 60000; // 1 minute for half-open state

	private constructor() {
		this.openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
			timeout: 60000, // 60 second timeout
		});
	}

	public static getInstance(): AIRecipeGenerator {
		if (!AIRecipeGenerator.instance) {
			AIRecipeGenerator.instance = new AIRecipeGenerator();
		}
		return AIRecipeGenerator.instance;
	}

	public resetCircuitBreaker(): void {
		this.circuitBreaker = {
			failures: 0,
			lastFailure: 0,
			isOpen: false,
			nextAttempt: 0,
		};
		logger.info('Circuit breaker has been manually reset');
	}

	private checkCircuitBreaker(): void {
		const now = Date.now();

		// If circuit is open, check if we should try again
		if (this.circuitBreaker.isOpen) {
			if (now < this.circuitBreaker.nextAttempt) {
				throw new Error('Circuit breaker is open');
			} else {
				// Enter half-open state
				logger.info('Circuit breaker entering half-open state');
				this.circuitBreaker.isOpen = false;
			}
		}
	}

	private recordSuccess(): void {
		// Reset failures on success
		this.circuitBreaker.failures = 0;
		logger.info('Circuit breaker: Success recorded, failures reset');
	}

	private recordFailure(): void {
		this.circuitBreaker.failures++;
		this.circuitBreaker.lastFailure = Date.now();

		logger.warn(
			`Circuit breaker: Failure recorded (${this.circuitBreaker.failures}/${this.maxFailures})`
		);

		if (this.circuitBreaker.failures >= this.maxFailures) {
			this.circuitBreaker.isOpen = true;
			this.circuitBreaker.nextAttempt = Date.now() + this.timeout;
			logger.error(
				`Circuit breaker opened due to ${this.circuitBreaker.failures} failures. Will retry after ${this.timeout}ms`
			);
		}
	}

	public async generateRecipe(params: {
		season: string;
		recipeName?: string;
	}): Promise<MealPrep360Recipe> {
		this.checkCircuitBreaker();

		try {
			const { season, recipeName } = params;

			// Rate limiting - wait 8 seconds between requests
			await new Promise((resolve) => setTimeout(resolve, 8000));

			const prompt = recipeName
				? `Create a detailed freezer-friendly meal prep recipe for "${recipeName}" suitable for ${season} season. The recipe should be optimized for batch cooking and freezing.

Requirements:
- Title: Creative name for the recipe
- Description: Brief, appetizing description (2-3 sentences)
- Ingredients: List with specific amounts and units
- Prep Instructions: Step-by-step preparation before cooking
- Cook Time: Total cooking time in minutes
- Prep Time: Preparation time in minutes
- Servings: Number of servings (4-8)
- Tags: Relevant tags (healthy, comfort food, etc.)
- Storage Time: How long it keeps frozen (in days)
- Container Suggestions: Best containers for freezing
- Defrost Instructions: How to safely defrost
- Cooking Instructions: How to cook from frozen/thawed
- Serving Instructions: Final preparation and serving tips

Format as valid JSON with these exact field names: title, description, ingredients (array of {name, amount, unit}), prepInstructions (array), prepTime, cookTime, servings, tags (array), storageTime, containerSuggestions (array), defrostInstructions (array), cookingInstructions (array), servingInstructions (array), allergenInfo (array), dietaryInfo (array), season.`
				: `Create a detailed freezer-friendly meal prep recipe suitable for ${season} season. The recipe should be optimized for batch cooking and freezing.

Requirements:
- Title: Creative name for the recipe
- Description: Brief, appetizing description (2-3 sentences)
- Ingredients: List with specific amounts and units
- Prep Instructions: Step-by-step preparation before cooking
- Cook Time: Total cooking time in minutes
- Prep Time: Preparation time in minutes
- Servings: Number of servings (4-8)
- Tags: Relevant tags (healthy, comfort food, etc.)
- Storage Time: How long it keeps frozen (in days)
- Container Suggestions: Best containers for freezing
- Defrost Instructions: How to safely defrost
- Cooking Instructions: How to cook from frozen/thawed
- Serving Instructions: Final preparation and serving tips

Format as valid JSON with these exact field names: title, description, ingredients (array of {name, amount, unit}), prepInstructions (array), prepTime, cookTime, servings, tags (array), storageTime, containerSuggestions (array), defrostInstructions (array), cookingInstructions (array), servingInstructions (array), allergenInfo (array), dietaryInfo (array), season.`;

			const completion = await this.openai.chat.completions.create({
				model: 'gpt-4-turbo-preview',
				messages: [
					{
						role: 'system',
						content:
							'You are a professional meal prep chef specializing in freezer-friendly recipes. Always respond with valid JSON only.',
					},
					{
						role: 'user',
						content: prompt,
					},
				],
				temperature: 0.8,
				max_tokens: 2000,
			});

			const content = completion.choices[0]?.message?.content;
			if (!content) {
				throw new Error('No response from OpenAI');
			}

			// Parse JSON response
			let recipe: MealPrep360Recipe;
			try {
				// Clean the response to extract JSON
				const jsonMatch = content.match(/\{[\s\S]*\}/);
				if (!jsonMatch) {
					throw new Error('No JSON found in response');
				}
				recipe = JSON.parse(jsonMatch[0]);
			} catch (parseError) {
				logger.error('Failed to parse OpenAI response:', content);
				throw new Error('Invalid JSON response from OpenAI');
			}

			// Validate and format the recipe
			const validatedRecipe = this.validateAndFormatRecipe(recipe, season);

			this.recordSuccess();
			return validatedRecipe;
		} catch (error) {
			this.recordFailure();
			logger.error('Error generating recipe with AI:', error);
			throw error;
		}
	}

	public async auditRecipe(recipe: MealPrep360Recipe): Promise<AuditResult> {
		this.checkCircuitBreaker();

		try {
			// Rate limiting
			await new Promise((resolve) => setTimeout(resolve, 8000));

			const prompt = `Audit this freezer meal prep recipe and fix any issues:

${JSON.stringify(recipe, null, 2)}

Check for:
1. Realistic cooking/prep times
2. Proper ingredient amounts and units
3. Clear, actionable instructions
4. Appropriate storage time for freezing
5. Missing or unclear steps
6. Allergen and dietary information accuracy

If issues are found, provide a corrected version. Respond with JSON in this format:
{
  "isValid": boolean,
  "issues": ["list of issues found"],
  "fixedRecipe": {corrected recipe object if needed}
}`;

			const completion = await this.openai.chat.completions.create({
				model: 'gpt-4-turbo-preview',
				messages: [
					{
						role: 'system',
						content:
							'You are a professional recipe auditor. Always respond with valid JSON only.',
					},
					{
						role: 'user',
						content: prompt,
					},
				],
				temperature: 0.3,
				max_tokens: 2500,
			});

			const content = completion.choices[0]?.message?.content;
			if (!content) {
				throw new Error('No response from OpenAI');
			}

			// Parse JSON response
			let auditResult: AuditResult;
			try {
				const jsonMatch = content.match(/\{[\s\S]*\}/);
				if (!jsonMatch) {
					throw new Error('No JSON found in audit response');
				}
				auditResult = JSON.parse(jsonMatch[0]);
			} catch (parseError) {
				logger.error('Failed to parse audit response:', content);
				throw new Error('Invalid JSON response from audit');
			}

			// If a fixed recipe is provided, validate it
			if (auditResult.fixedRecipe) {
				auditResult.fixedRecipe = this.validateAndFormatRecipe(
					auditResult.fixedRecipe,
					recipe.season
				);
			}

			this.recordSuccess();
			return auditResult;
		} catch (error) {
			this.recordFailure();
			logger.error('Error auditing recipe:', error);
			throw error;
		}
	}

	public async generateRecipeNames(
		season: string,
		count: number = 30
	): Promise<string[]> {
		this.checkCircuitBreaker();

		try {
			// Rate limiting
			await new Promise((resolve) => setTimeout(resolve, 8000));

			const prompt = `Generate ${count} creative names for freezer-friendly meal prep recipes suitable for ${season} season. 

Requirements:
- Focus on comfort foods and hearty meals perfect for meal prep
- Include variety: soups, stews, casseroles, grain bowls, protein dishes
- Names should be appetizing and descriptive
- Suitable for batch cooking and freezing
- Seasonal appropriate ingredients for ${season}

Respond with a JSON array of recipe names only: ["Recipe Name 1", "Recipe Name 2", ...]`;

			const completion = await this.openai.chat.completions.create({
				model: 'gpt-4-turbo-preview',
				messages: [
					{
						role: 'system',
						content:
							'You are a creative meal prep chef. Always respond with valid JSON only.',
					},
					{
						role: 'user',
						content: prompt,
					},
				],
				temperature: 0.9,
				max_tokens: 1500,
			});

			const content = completion.choices[0]?.message?.content;
			if (!content) {
				throw new Error('No response from OpenAI');
			}

			// Parse JSON response
			let recipeNames: string[];
			try {
				const jsonMatch = content.match(/\[[\s\S]*\]/);
				if (!jsonMatch) {
					throw new Error('No JSON array found in response');
				}
				recipeNames = JSON.parse(jsonMatch[0]);
			} catch (parseError) {
				logger.error('Failed to parse recipe names response:', content);
				throw new Error('Invalid JSON response from OpenAI');
			}

			if (!Array.isArray(recipeNames)) {
				throw new Error('Response is not an array');
			}

			this.recordSuccess();
			return recipeNames.filter(
				(name) => typeof name === 'string' && name.trim().length > 0
			);
		} catch (error) {
			this.recordFailure();
			logger.error('Error generating recipe names:', error);
			throw error;
		}
	}

	public async createImagePrompt(recipeTitle: string): Promise<string> {
		return `A professional food photography shot of ${recipeTitle}, beautifully plated and styled, warm lighting, appetizing presentation, high quality, restaurant-style presentation`;
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

		// Validate arrays
		const arrayFields = [
			'prepInstructions',
			'tags',
			'containerSuggestions',
			'defrostInstructions',
			'cookingInstructions',
			'servingInstructions',
		];

		for (const field of arrayFields) {
			if (!Array.isArray(recipe[field]) || recipe[field].length === 0) {
				throw new Error(`${field} must be a non-empty array`);
			}
		}

		// Validate numeric fields
		const numericFields = ['prepTime', 'cookTime', 'servings', 'storageTime'];
		for (const field of numericFields) {
			if (typeof recipe[field] !== 'number' || recipe[field] <= 0) {
				throw new Error(`${field} must be a positive number`);
			}
		}

		// Ensure optional fields have default values
		if (!recipe.allergenInfo) {
			recipe.allergenInfo = [];
		}
		if (!recipe.dietaryInfo) {
			recipe.dietaryInfo = [];
		}

		// Set season
		recipe.season = season;

		return recipe as MealPrep360Recipe;
	}
}
