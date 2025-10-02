import { connectDB } from '../services/database.js';
import { Recipe, IRecipe } from '../models/recipe.js';
import { RecipeGenerator } from '../services/recipeGenerator.js';
import { logger } from '../services/logger.js';
import { config } from '../config.js';
import mongoose from 'mongoose';
import { FREEZER_TITLE_PATTERNS } from '../constants/recipeTitles.js';
import { TAGS_TO_REMOVE } from '../constants/recipeConstants.js';
import { REQUIRED_FIELDS } from '../constants/recipeFields.js';

// Add these interfaces at the top of the file, after the imports
interface OpenAIResponse {
	choices: Array<{
		message: {
			content: string;
		};
	}>;
}

interface OpenAIError {
	error: {
		message: string;
		type: string;
		code: string;
	};
}

async function containsHtmlMarkup(text: string): Promise<boolean> {
	const htmlPattern = /<[^>]*>|&[a-zA-Z]+;|&#\d+;/;
	return htmlPattern.test(text);
}

function cleanRecipeTitle(title: string): string {
	return title.replace(/<[^>]*>|&[a-zA-Z]+;|&#\d+;/g, '');
}

function cleanRecipeDescription(description: string): string {
	return description.replace(/<[^>]*>|&[a-zA-Z]+;|&#\d+;/g, '');
}

function cleanRecipeIngredient(ingredient: {
	name: string;
	amount: string | number;
	unit: string;
}): { name: string; amount: string; unit: string } {
	return {
		name: ingredient.name.replace(/<[^>]*>|&[a-zA-Z]+;|&#\d+;/g, ''),
		amount: String(ingredient.amount).replace(
			/<[^>]*>|&[a-zA-Z]+;|&#\d+;/g,
			''
		),
		unit: ingredient.unit.replace(/<[^>]*>|&[a-zA-Z]+;|&#\d+;/g, ''),
	};
}

function cleanRecipeInstruction(instruction: string): string {
	return instruction.replace(/<[^>]*>|&[a-zA-Z]+;|&#\d+;/g, '');
}

function cleanRecipeTags(tags: string[]): string[] {
	return tags.filter((tag) => !TAGS_TO_REMOVE.includes(tag.toLowerCase()));
}

async function generateAllergenInfo(recipe: IRecipe): Promise<string[]> {
	const prompt = `Analyze this recipe and list all potential allergens. Consider all ingredients and cooking methods.

Recipe Title: ${recipe.title}
Ingredients: ${JSON.stringify(recipe.ingredients)}
Instructions: ${JSON.stringify([...recipe.prepInstructions, ...recipe.cookingInstructions])}

Requirements:
- List only confirmed allergens based on the ingredients
- Include common allergens like: tree nuts, peanuts, dairy, eggs, soy, gluten, fish, shellfish, sesame
- Be specific about which allergens are present
- Return as a JSON array of strings
- Each string should be in the format "Contains: [allergen]"
- If no allergens are found, return ["No common allergens detected"]

Example response format:
{
    "allergens": ["Contains: dairy", "Contains: wheat", "May contain: tree nuts"]
}

Return ONLY the JSON object with the "allergens" array, no additional text or explanation.`;

	try {
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
			},
			body: JSON.stringify({
				model: 'gpt-3.5-turbo',
				messages: [
					{
						role: 'system',
						content:
							'You are a food safety expert. Return only valid JSON objects with an "allergens" array.',
					},
					{
						role: 'user',
						content: prompt,
					},
				],
				temperature: 0.3,
				response_format: { type: 'json_object' },
			}),
		});

		if (!response.ok) {
			throw new Error(`OpenAI API error: ${response.statusText}`);
		}

		const data = (await response.json()) as OpenAIResponse;
		const content = data.choices[0].message.content;
		const parsed = JSON.parse(content);

		if (!parsed.allergens || !Array.isArray(parsed.allergens)) {
			throw new Error('Invalid response format from OpenAI');
		}

		return parsed.allergens;
	} catch (error) {
		logger.error('Error generating allergen info:', error);
		return ['Contains: Please check ingredients for allergens']; // Fallback
	}
}

async function generateDietaryInfo(recipe: IRecipe): Promise<string[]> {
	const prompt = `Analyze this recipe and list all relevant dietary considerations. Consider ingredients, cooking methods, and nutritional content.

Recipe Title: ${recipe.title}
Ingredients: ${JSON.stringify(recipe.ingredients)}
Instructions: ${JSON.stringify([...recipe.prepInstructions, ...recipe.cookingInstructions])}

Requirements:
- List all relevant dietary considerations
- Include categories like: vegetarian, vegan, gluten-free, dairy-free, low-carb, keto, paleo, low-sodium, high-protein
- Be specific about which dietary categories apply
- Return as a JSON array of strings
- Each string should be in the format "[category]: [explanation]"
- If no specific dietary considerations are found, return ["Standard diet"]

Example response format:
{
    "dietary": ["Vegetarian: Contains dairy and eggs", "High-Protein: Contains lean meats"]
}

Return ONLY the JSON object with the "dietary" array, no additional text or explanation.`;

	try {
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
			},
			body: JSON.stringify({
				model: 'gpt-3.5-turbo',
				messages: [
					{
						role: 'system',
						content:
							'You are a nutrition expert. Return only valid JSON objects with a "dietary" array.',
					},
					{
						role: 'user',
						content: prompt,
					},
				],
				temperature: 0.3,
				response_format: { type: 'json_object' },
			}),
		});

		if (!response.ok) {
			throw new Error(`OpenAI API error: ${response.statusText}`);
		}

		const data = (await response.json()) as OpenAIResponse;
		const content = data.choices[0].message.content;
		const parsed = JSON.parse(content);

		if (!parsed.dietary || !Array.isArray(parsed.dietary)) {
			throw new Error('Invalid response format from OpenAI');
		}

		return parsed.dietary;
	} catch (error) {
		logger.error('Error generating dietary info:', error);
		return ['Please check ingredients for dietary restrictions']; // Fallback
	}
}

async function rewriteDescription(recipe: IRecipe): Promise<string> {
	const prompt = `Rewrite this recipe description to be concise and informative while staying under 150 characters. Include key information about ingredients, cooking method, and freezer-friendly aspects.

Original description: "${recipe.description}"

Requirements:
- Must be under 150 characters
- Include main ingredients and cooking method
- Mention why it's freezer-friendly
- Include key benefits (e.g., quick prep, easy to reheat)
- No HTML markup
- Use plain text only

Return ONLY the rewritten description, no additional text or explanation.`;

	try {
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
			},
			body: JSON.stringify({
				model: 'gpt-3.5-turbo',
				messages: [
					{
						role: 'system',
						content:
							'You are a professional recipe writer. Return only the rewritten description.',
					},
					{
						role: 'user',
						content: prompt,
					},
				],
				temperature: 0.7,
				max_tokens: 200,
			}),
		});

		if (!response.ok) {
			throw new Error(`OpenAI API error: ${response.statusText}`);
		}

		const data = (await response.json()) as OpenAIResponse;
		const rewrittenDescription = data.choices[0].message.content.trim();

		if (rewrittenDescription.length > 150) {
			throw new Error('Rewritten description still exceeds 150 characters');
		}

		return rewrittenDescription;
	} catch (error) {
		logger.error('Error rewriting description:', error);
		// Fallback to truncation if rewriting fails
		return recipe.description.substring(0, 147) + '...';
	}
}

function removeFreezerTags(tags: string[]): string[] {
	return tags
		.filter((tag) => !TAGS_TO_REMOVE.includes(tag.toLowerCase()))
		.filter((tag) => tag.trim().length > 0)
		.map((tag) => tag.trim());
}

async function condenseInstructions(instructions: string[]): Promise<string[]> {
	if (
		!instructions ||
		!Array.isArray(instructions) ||
		instructions.length === 0
	) {
		logger.warn('No instructions provided to condense');
		return instructions;
	}

	const prompt = `Condense these recipe instructions into clear, concise steps. Remove any redundant information and focus on the essential actions.

Original instructions:
${JSON.stringify(instructions)}

Requirements:
- Each step should be a single, clear action
- Remove any freezer-specific language
- Keep only essential information
- No HTML markup
- Use plain text only
- Return as a JSON object with an "instructions" array
- Each instruction should be a complete sentence
- Keep the same order as the original instructions
- Maintain all critical cooking steps
- Do not add any new steps
- Do not remove any essential steps

Example response format:
{
    "instructions": [
        "Preheat the oven to 350°F",
        "Mix all ingredients in a large bowl",
        "Pour the mixture into a baking dish",
        "Bake for 30 minutes until golden brown"
    ]
}

Return ONLY the JSON object with the "instructions" array, no additional text or explanation.`;

	try {
		logger.info(`Attempting to condense ${instructions.length} instructions`);

		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
			},
			body: JSON.stringify({
				model: 'gpt-3.5-turbo',
				messages: [
					{
						role: 'system',
						content:
							'You are a professional recipe writer. You must return a valid JSON object with an "instructions" array containing strings. Do not include any other text or explanation.',
					},
					{
						role: 'user',
						content: prompt,
					},
				],
				temperature: 0.3,
				response_format: { type: 'json_object' },
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			logger.error(`OpenAI API error (${response.status}): ${errorText}`);
			return instructions;
		}

		const data = (await response.json()) as OpenAIResponse;
		if (!data.choices?.[0]?.message?.content) {
			logger.error('Invalid OpenAI response structure:', JSON.stringify(data));
			return instructions;
		}

		const content = data.choices[0].message.content;
		logger.debug('Received OpenAI response:', content);

		try {
			const parsed = JSON.parse(content);
			if (!parsed.instructions || !Array.isArray(parsed.instructions)) {
				logger.error(
					'Invalid response format - missing instructions array:',
					content
				);
				return instructions;
			}

			// Validate each instruction is a string
			const validInstructions = parsed.instructions.filter(
				(instruction: any) =>
					typeof instruction === 'string' && instruction.trim().length > 0
			);

			if (validInstructions.length === 0) {
				logger.error('No valid instructions in response:', content);
				return instructions;
			}

			// Verify we haven't lost any critical information
			if (validInstructions.length < instructions.length * 0.5) {
				logger.warn(
					`Condensed instructions reduced by more than 50% (${validInstructions.length} vs ${instructions.length})`
				);
				return instructions;
			}

			logger.info(
				`Successfully condensed ${instructions.length} instructions to ${validInstructions.length} instructions`
			);
			return validInstructions;
		} catch (parseError) {
			logger.error('Failed to parse OpenAI response:', {
				error: parseError,
				content: content,
			});
			return instructions;
		}
	} catch (error) {
		logger.error('Error condensing instructions:', {
			error: error instanceof Error ? error.message : error,
			stack: error instanceof Error ? error.stack : undefined,
		});
		return instructions;
	}
}

// Utility to build a trimmed context for OpenAI
function buildOpenAIContext(recipe: any) {
	return {
		title: recipe.title,
		description: recipe.description,
		ingredients: recipe.ingredients,
		instructions: recipe.instructions,
		tags: recipe.tags,
		categories: recipe.categories,
		difficulty: recipe.difficulty,
		servings: recipe.servings,
		prepTime: recipe.prepTime,
		cookTime: recipe.cookTime,
		// Add more if needed, but avoid images, embeddings, etc.
	};
}

// Utility to auto-generate a missing field using OpenAI
async function generateField(field: string, recipe: any): Promise<any> {
	const context = buildOpenAIContext(recipe);
	const prompt = `Given the following recipe data, generate a value for the missing field: "${field}".\n\nRecipe data:\n${JSON.stringify(context, null, 2)}\n\nReturn ONLY the value for the field '${field}' in valid JSON format.`;
	try {
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
			},
			body: JSON.stringify({
				model: 'gpt-3.5-turbo',
				messages: [
					{
						role: 'system',
						content: `You are a helpful assistant that generates missing recipe fields. Return ONLY the value for the requested field in valid JSON format. Do not include any explanation.`,
					},
					{
						role: 'user',
						content: prompt,
					},
				],
				temperature: 0.3,
				response_format: { type: 'json_object' },
			}),
		});
		if (!response.ok) {
			const errorText = await response.text();
			logger.error(
				`OpenAI API error (${response.status}) while generating ${field}: ${errorText}`
			);
			return null;
		}
		const data = (await response.json()) as OpenAIResponse;
		if (!data.choices?.[0]?.message?.content) {
			logger.error(
				`Invalid OpenAI response structure while generating ${field}:`,
				JSON.stringify(data)
			);
			return null;
		}
		const content = data.choices[0].message.content;
		try {
			const parsed = JSON.parse(content);
			logger.info(`Auto-generated '${field}':`, parsed);
			return parsed;
		} catch (parseError) {
			logger.error(`Failed to parse OpenAI response for ${field}:`, {
				error: parseError,
				content,
			});
			return null;
		}
	} catch (error) {
		logger.error(`Error generating field ${field}:`, error);
		return null;
	}
}

function cleanDietaryInfo(dietaryInfo: string[]): string[] {
	if (!Array.isArray(dietaryInfo)) return [];
	return dietaryInfo
		.map((entry) => {
			// Remove anything after a colon or dash (and trim)
			return entry.split(/:|–|—|-/)[0].trim();
		})
		.filter(Boolean);
}

function cleanAllergenInfo(allergenInfo: string[]): string[] {
	if (!Array.isArray(allergenInfo)) return [];
	return allergenInfo
		.map((entry) => {
			// Remove 'Contains', colons, dashes, and explanations
			let cleaned = entry.replace(/^contains:?\s*/i, '');
			cleaned = cleaned.split(/:|–|—|-/)[0].trim();
			// Capitalize first letter
			if (cleaned.length > 0) {
				cleaned =
					cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
			}
			return cleaned;
		})
		.filter(Boolean);
}

async function isFreezerFriendly(recipe: any): Promise<boolean> {
	const context = buildOpenAIContext(recipe);
	const prompt = `Given the following recipe data, answer with ONLY "yes" or "no": Is this dish suitable for freezing and reheating later?\n\nRecipe data:\n${JSON.stringify(context, null, 2)}\n\nAnswer with only "yes" or "no".`;
	try {
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
			},
			body: JSON.stringify({
				model: 'gpt-3.5-turbo',
				messages: [
					{
						role: 'system',
						content:
							'You are a professional chef. Answer only with "yes" or "no".',
					},
					{
						role: 'user',
						content: prompt,
					},
				],
				temperature: 0.1,
			}),
		});
		if (!response.ok) {
			const errorText = await response.text();
			logger.error(
				`OpenAI API error (${response.status}) while checking freezer suitability: ${errorText}`
			);
			return false;
		}
		const data = (await response.json()) as OpenAIResponse;
		const content = data.choices?.[0]?.message?.content?.trim().toLowerCase();
		if (content === 'yes') return true;
		if (content === 'no') return false;
		logger.warn(
			'Unexpected response from OpenAI for freezer suitability:',
			content
		);
		return false;
	} catch (error) {
		logger.error('Error checking freezer suitability:', error);
		return false;
	}
}

function splitPrepAndCookingInstructions(
	prepInstructions: string[],
	cookingInstructions: string[]
): { prep: string[]; cooking: string[] } {
	const cookingVerbs = [
		'bake',
		'roast',
		'boil',
		'sauté',
		'saute',
		'fry',
		'grill',
		'cook',
		'simmer',
		'steam',
		'poach',
		'broil',
		'sear',
		'blanch',
		'microwave',
		'pressure cook',
		'slow cook',
		'deep fry',
		'stir-fry',
		'barbecue',
		'braise',
		'stew',
		'toast',
		'char',
		'parboil',
		'reduce',
		'preheat',
		'heat oven',
		'bring to a boil',
		'keep warm',
		'keep hot',
	];
	const prep: string[] = [];
	const cooking: string[] = [...cookingInstructions];
	for (const step of prepInstructions) {
		const lower = step.toLowerCase();
		if (cookingVerbs.some((verb) => lower.includes(verb))) {
			cooking.push(step);
		} else {
			prep.push(step);
		}
	}
	return { prep, cooking };
}

export async function validateRecipe(
	recipe: IRecipe
): Promise<{ isValid: boolean; issues: string[] }> {
	const issues: string[] = [];

	// Check for HTML markup in text fields
	if (await containsHtmlMarkup(recipe.title)) {
		issues.push('Title contains HTML markup');
	}
	if (await containsHtmlMarkup(recipe.description)) {
		issues.push('Description contains HTML markup');
	}

	// Validate description length
	if (recipe.description.length > 150) {
		issues.push('Description exceeds 150 characters');
	}

	// Validate ingredients
	if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
		issues.push('Ingredients array is empty or invalid');
	} else {
		for (const ingredient of recipe.ingredients) {
			if (!ingredient.name || !ingredient.amount || !ingredient.unit) {
				issues.push('Invalid ingredient format');
				break;
			}
			if (
				(await containsHtmlMarkup(ingredient.name)) ||
				(await containsHtmlMarkup(ingredient.amount)) ||
				(await containsHtmlMarkup(ingredient.unit))
			) {
				issues.push('Ingredients contain HTML markup');
				break;
			}
		}
	}

	// Validate all instruction arrays
	const instructionArrays = [
		{ field: 'prepInstructions', name: 'Prep instructions' },
		{ field: 'defrostInstructions', name: 'Defrost instructions' },
		{ field: 'cookingInstructions', name: 'Cooking instructions' },
		{ field: 'servingInstructions', name: 'Serving instructions' },
	] as const;

	for (const { field, name } of instructionArrays) {
		const instructions = recipe[field];
		if (!Array.isArray(instructions) || instructions.length === 0) {
			issues.push(`${name} array is empty or invalid`);
		} else {
			for (const instruction of instructions) {
				if (typeof instruction !== 'string') {
					issues.push(`Invalid ${name.toLowerCase()} format`);
					break;
				}
				if (await containsHtmlMarkup(instruction)) {
					issues.push(`${name} contain HTML markup`);
					break;
				}
			}
		}
	}

	// Validate tags
	if (!Array.isArray(recipe.tags) || recipe.tags.length === 0) {
		issues.push('Tags array is empty or invalid');
	} else {
		for (const tag of recipe.tags) {
			if (typeof tag !== 'string') {
				issues.push('Invalid tag format');
				break;
			}
			if (await containsHtmlMarkup(tag)) {
				issues.push('Tags contain HTML markup');
				break;
			}
		}
	}

	// Validate numeric ranges
	if (recipe.prepTime < 5 || recipe.prepTime > 120) {
		issues.push('Prep time must be between 5 and 120 minutes');
	}
	if (recipe.cookTime < 5 || recipe.cookTime > 180) {
		issues.push('Cook time must be between 5 and 180 minutes');
	}
	if (recipe.servings < 1 || recipe.servings > 12) {
		issues.push('Servings must be between 1 and 12');
	}
	if (recipe.storageTime < 1 || recipe.storageTime > 180) {
		issues.push('Storage time must be between 1 and 180 days');
	}

	// Validate required fields
	if (!recipe.title) issues.push('Title is required');
	if (!recipe.description) issues.push('Description is required');
	if (!recipe.season) issues.push('Season is required');
	if (!recipe.originalLanguage) issues.push('Original language is required');

	// Validate arrays
	if (!Array.isArray(recipe.allergenInfo) || recipe.allergenInfo.length === 0) {
		issues.push('Allergen info is missing or empty');
	} else {
		for (const allergen of recipe.allergenInfo) {
			if (typeof allergen !== 'string') {
				issues.push('Invalid allergen info format');
				break;
			}
			if (await containsHtmlMarkup(allergen)) {
				issues.push('Allergen info contains HTML markup');
				break;
			}
		}
	}

	if (!Array.isArray(recipe.dietaryInfo) || recipe.dietaryInfo.length === 0) {
		issues.push('Dietary info is missing or empty');
	} else {
		for (const dietary of recipe.dietaryInfo) {
			if (typeof dietary !== 'string') {
				issues.push('Invalid dietary info format');
				break;
			}
			if (await containsHtmlMarkup(dietary)) {
				issues.push('Dietary info contains HTML markup');
				break;
			}
		}
	}

	return { isValid: issues.length === 0, issues };
}

export async function updateRecipe(
	recipe: IRecipe & { _id: mongoose.Types.ObjectId }
): Promise<void> {
	try {
		if (!(await isFreezerFriendly(recipe))) {
			logger.warn(
				`Recipe ${recipe._id} is not suitable for freezing. Skipping.`
			);
			return;
		}

		logger.info(
			`Starting update for recipe: ${recipe.title} (ID: ${recipe._id})`
		);

		// Check and auto-generate missing required fields
		for (const field of REQUIRED_FIELDS) {
			if (
				!(recipe as any)[field] ||
				(Array.isArray((recipe as any)[field]) &&
					(recipe as any)[field].length === 0)
			) {
				logger.warn(
					`Recipe ${recipe._id} is missing required field: ${field}. Attempting to auto-generate.`
				);
				const generated = await generateField(field, recipe);
				if (generated !== null && generated !== undefined) {
					// Handle type conversion for new fields
					if (field === 'cuisines') {
						(recipe as any)[field] = Array.isArray(generated)
							? generated
							: [String(generated)];
					} else if (['kidFriendly', 'quickMeals', 'healthy'].includes(field)) {
						if (typeof generated === 'boolean') {
							(recipe as any)[field] = generated;
						} else if (typeof generated === 'string') {
							(recipe as any)[field] = generated.toLowerCase() === 'true';
						} else {
							(recipe as any)[field] = Boolean(generated);
						}
					} else {
						(recipe as any)[field] = generated;
					}
				} else {
					logger.error(
						`Failed to auto-generate required field: ${field} for recipe ${recipe._id}`
					);
				}
			}
		}

		// Validate required fields
		if (
			!recipe.ingredients ||
			!Array.isArray(recipe.ingredients) ||
			recipe.ingredients.length === 0
		) {
			logger.error(`Recipe ${recipe._id} is missing ingredients`);
			return;
		}

		if (
			!recipe.cookingInstructions ||
			!Array.isArray(recipe.cookingInstructions) ||
			recipe.cookingInstructions.length === 0
		) {
			logger.error(`Recipe ${recipe._id} is missing cooking instructions`);
			return;
		}

		// Clean and remove HTML markup from title
		const cleanTitle = cleanRecipeTitle(recipe.title);

		// Clean and remove HTML markup from description
		const cleanDescription = cleanRecipeDescription(recipe.description);

		// Clean and remove HTML markup from ingredients
		const cleanIngredients = recipe.ingredients.map((ingredient) =>
			cleanRecipeIngredient(ingredient)
		);

		// Clean and remove HTML markup from instructions
		const cleanPrepInstructions = recipe.prepInstructions.map((instruction) =>
			cleanRecipeInstruction(instruction)
		);
		const cleanDefrostInstructions = recipe.defrostInstructions.map(
			(instruction) => cleanRecipeInstruction(instruction)
		);
		const cleanCookingInstructions = recipe.cookingInstructions.map(
			(instruction) => cleanRecipeInstruction(instruction)
		);
		const cleanServingInstructions = recipe.servingInstructions.map(
			(instruction) => cleanRecipeInstruction(instruction)
		);

		// Clean tags
		const cleanTags = cleanRecipeTags(recipe.tags);

		// Generate allergen and dietary information
		logger.info(
			`Generating allergen and dietary info for recipe: ${recipe.title}`
		);
		const allergenInfo = await generateAllergenInfo(recipe);
		const dietaryInfo = await generateDietaryInfo(recipe);

		// Clean dietary info
		const cleanedDietaryInfo = cleanDietaryInfo(dietaryInfo);

		// Clean allergen info
		const cleanedAllergenInfo = cleanAllergenInfo(allergenInfo);

		// Check if recipe has images
		const hasImages =
			recipe.images?.main?.startsWith('data:image') ||
			recipe.images?.thumbnail?.startsWith('data:image') ||
			recipe.images?.additional?.some((img: string) =>
				img.startsWith('data:image')
			);

		// Prepare update data
		const { prep: finalPrepInstructions, cooking: finalCookingInstructions } =
			splitPrepAndCookingInstructions(
				cleanPrepInstructions,
				cleanCookingInstructions
			);
		if (finalPrepInstructions.length !== cleanPrepInstructions.length) {
			logger.info(
				`Moved ${cleanPrepInstructions.length - finalPrepInstructions.length} cooking steps from prepInstructions to cookingInstructions for recipe: ${recipe.title}`
			);
		}
		const updateData = {
			title: cleanTitle,
			description: cleanDescription,
			ingredients: cleanIngredients,
			prepInstructions: finalPrepInstructions,
			defrostInstructions: cleanDefrostInstructions,
			cookingInstructions: finalCookingInstructions,
			servingInstructions: cleanServingInstructions,
			tags: cleanTags,
			allergenInfo: cleanedAllergenInfo,
			dietaryInfo: cleanedDietaryInfo,
			hasImage: hasImages,
			images: recipe.images,
			updatedAt: new Date(),
		};

		// Log the update (excluding Base64 image data)
		const logData = {
			...updateData,
			images: {
				main: recipe.images?.main?.startsWith('data:image')
					? '[Base64 Image Data]'
					: recipe.images?.main,
				thumbnail: recipe.images?.thumbnail?.startsWith('data:image')
					? '[Base64 Image Data]'
					: recipe.images?.thumbnail,
				additional: recipe.images?.additional?.map((img: string) =>
					img.startsWith('data:image') ? '[Base64 Image Data]' : img
				),
			},
		};
		logger.info(`Updating recipe: ${recipe.title}`, logData);

		// Update the recipe
		await Recipe.findByIdAndUpdate(recipe._id, updateData);

		// Log success with masked image data
		const successLogData = {
			...logData,
			_id: recipe._id,
			title: cleanTitle,
			ingredients: cleanIngredients,
			cookingInstructions: finalCookingInstructions,
		};
		logger.info(`Successfully updated recipe: ${recipe.title}`, successLogData);
	} catch (error) {
		logger.error(`Error updating recipe ${recipe._id}:`, {
			error: error instanceof Error ? error.message : error,
			stack: error instanceof Error ? error.stack : undefined,
			recipe: {
				_id: recipe._id,
				title: recipe.title,
				ingredientsCount: recipe.ingredients?.length,
				cookingInstructionsCount: recipe.cookingInstructions?.length,
			},
		});
		throw error;
	}
}

async function main() {
	try {
		logger.info('Starting database connection...');
		await connectDB();
		logger.info('Database connection state after connectDB:', {
			readyState: mongoose.connection.readyState,
			host: mongoose.connection.host,
			name: mongoose.connection.name,
			port: mongoose.connection.port,
		});

		// Verify connection is still active before proceeding
		if (!isConnected(mongoose.connection.readyState)) {
			throw new Error(
				`Database not connected. ReadyState: ${mongoose.connection.readyState}`
			);
		}

		const recipes = await Recipe.find().lean();
		logger.info(`Found ${recipes.length} recipes to validate`);

		let updatedCount = 0;
		let errorCount = 0;
		let skippedCount = 0;

		for (const recipe of recipes) {
			try {
				// Check connection state before each recipe
				if (!isConnected(mongoose.connection.readyState)) {
					logger.error(
						'Database connection lost during processing. Attempting to reconnect...'
					);
					await connectDB();
					if (!isConnected(mongoose.connection.readyState)) {
						throw new Error('Failed to reconnect to database');
					}
				}

				const validation = await validateRecipe(recipe);
				if (!validation.isValid) {
					logger.info(`Processing recipe: ${recipe.title}`);
					logger.info(`Issues found: ${validation.issues.join(', ')}`);
					await updateRecipe(recipe as any);
					updatedCount++;
				} else {
					logger.info(`Skipping recipe (no issues found): ${recipe.title}`);
					skippedCount++;
				}
			} catch (error) {
				logger.error(`Error processing recipe ${recipe.title}: ${error}`);
				errorCount++;
			}
		}

		logger.info(
			'Validation complete:\n' +
				`- Total recipes: ${recipes.length}\n` +
				`- Recipes updated: ${updatedCount}\n` +
				`- Recipes skipped: ${skippedCount}\n` +
				`- Errors encountered: ${errorCount}`
		);
	} catch (error) {
		logger.error(`Error in main process: ${error}`);
	} finally {
		// Ensure we properly close the connection
		try {
			if (isConnected(mongoose.connection.readyState)) {
				await mongoose.disconnect();
				logger.info('Database connection closed');
			}
		} catch (error) {
			logger.error('Error closing database connection:', error);
		}
		process.exit(0);
	}
}

// Helper function to check connection state
const isConnected = (state: number): boolean => state === 1;

// Run the script
main();
