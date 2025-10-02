import express, { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase } from '../utils/db.js';
import { Recipe } from '../models/recipe.js';
import {
	validateRecipe,
	updateRecipe,
} from '../scripts/validateAndUpdateRecipes.js';
import { AIRecipeGenerator } from '../services/aiRecipeGenerator.js';

const router = express.Router();

// API key authentication middleware
router.use((req: Request, res: Response, next: NextFunction) => {
	const apiKey = req.headers['x-api-key'];
	if (!apiKey || apiKey !== process.env.API_KEY) {
		return res.status(401).json({
			status: 'error',
			message: 'Invalid or missing API key',
		});
	}
	next();
});

// List recipes endpoint
router.get('/', async (req: Request, res: Response) => {
	const traceId = uuidv4();
	logger.info(`[${traceId}] Listing recipes`);

	try {
		await connectToDatabase();

		// Parse query parameters
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 10;
		const season = req.query.season as string;
		const search = req.query.search as string;

		// Build query
		const query: any = {};
		if (season) {
			query.season = season;
		}
		if (search) {
			query.$or = [
				{ title: { $regex: search, $options: 'i' } },
				{ description: { $regex: search, $options: 'i' } },
				{ tags: { $regex: search, $options: 'i' } },
			];
		}

		// Execute query with pagination
		const [recipes, total] = await Promise.all([
			Recipe.find(query)
				.sort({ createdAt: -1 })
				.skip((page - 1) * limit)
				.limit(limit),
			Recipe.countDocuments(query),
		]);

		res.json({
			status: 'success',
			data: {
				recipes,
				pagination: {
					page,
					limit,
					total,
					pages: Math.ceil(total / limit),
				},
			},
		});
	} catch (error) {
		logger.error(`[${traceId}] Error listing recipes: ${error}`);
		res.status(500).json({
			status: 'error',
			message: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// Validate and update recipes endpoint
router.post('/validate', async (req: Request, res: Response) => {
	const traceId = uuidv4();
	logger.info(`[${traceId}] Starting recipe validation`);

	try {
		await connectToDatabase();

		const recipes = await Recipe.find().lean();
		logger.info(`[${traceId}] Found ${recipes.length} recipes to validate`);

		let updatedCount = 0;
		let errorCount = 0;
		let skippedCount = 0;
		const results: Array<{
			title: string;
			updated: boolean;
			issues?: string[];
			error?: string;
		}> = [];

		for (const recipe of recipes) {
			try {
				const validation = await validateRecipe(recipe);
				if (!validation.isValid) {
					logger.info(`[${traceId}] Processing recipe: ${recipe.title}`);
					logger.info(
						`[${traceId}] Issues found: ${validation.issues.join(', ')}`
					);
					await updateRecipe(recipe as any);
					updatedCount++;
					results.push({
						title: recipe.title,
						updated: true,
						issues: validation.issues,
					});
				} else {
					logger.info(
						`[${traceId}] Skipping recipe (no issues found): ${recipe.title}`
					);
					skippedCount++;
					results.push({
						title: recipe.title,
						updated: false,
					});
				}
			} catch (error) {
				logger.error(
					`[${traceId}] Error processing recipe ${recipe.title}: ${error}`
				);
				errorCount++;
				results.push({
					title: recipe.title,
					updated: false,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}
		}

		res.json({
			status: 'success',
			data: {
				summary: {
					total: recipes.length,
					updated: updatedCount,
					skipped: skippedCount,
					errors: errorCount,
				},
				results,
			},
		});
	} catch (error) {
		logger.error(`[${traceId}] Error in validation process: ${error}`);
		res.status(500).json({
			status: 'error',
			message: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

const aiRecipeGenerator = AIRecipeGenerator.getInstance();

router.post('/audit-recipe', async (req, res) => {
	try {
		const recipe = req.body;
		const auditResult = await aiRecipeGenerator.auditRecipe(recipe);

		if (auditResult.isValid || auditResult.fixedRecipe) {
			res.json({
				valid: auditResult.isValid,
				fixed: !!auditResult.fixedRecipe,
				recipe: auditResult.fixedRecipe || recipe,
				issues: auditResult.issues,
			});
		} else {
			res.status(400).json({
				error: 'Recipe validation failed',
				issues: auditResult.issues,
			});
		}
	} catch (err) {
		res
			.status(500)
			.json({ error: err instanceof Error ? err.message : 'Unknown error' });
	}
});

export default router;
