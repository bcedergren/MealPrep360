import express from 'express';
import { connectToDatabase } from '../utils/db.js';
import { HealthService } from '../services/health.js';
import { logger } from '../services/logger.js';
import { Job } from '../models/job.js';
import recipeRoutes from '../routes/recipeRoutes.js';
import { QueueService } from '../services/queueService.js';
import mongoose from 'mongoose';
import { RecipeOrchestrator } from '../services/recipeOrchestrator.js';
import { v4 as uuidv4 } from 'uuid';
import { withRetry } from '../utils/retry.js';
import { SearchAPI } from './search.js';
import { RecommendationsAPI } from './recommendations.js';
import { CategorizationAPI } from './categorization.js';

const app = express();

// Add middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.header(
		'Access-Control-Allow-Headers',
		'X-Requested-With, Content-Type, Accept, x-api-key'
	);
	next();
});

// Database connection middleware
app.use(async (req, res, next) => {
	try {
		if (mongoose.connection.readyState !== 1) {
			await connectToDatabase();
		}
		next();
	} catch (error) {
		logger.error(`Database connection error: ${error}`);
		res.status(503).json({
			status: 'error',
			message: 'Service temporarily unavailable - Database connection error',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
	try {
		const healthService = HealthService.getInstance();
		const health = await healthService.checkDatabaseHealth();

		// If health check fails, attempt recovery
		if (health.status === 'unhealthy') {
			logger.warn('Health check failed, attempting recovery...');
			const recovered = await healthService.attemptRecovery();
			if (recovered) {
				logger.info('Recovery successful, rechecking health...');
				const newHealth = await healthService.checkDatabaseHealth();
				return res.json(newHealth);
			}
		}

		res.json(health);
	} catch (error) {
		logger.error(`Health check failed: ${error}`);
		res.status(503).json({
			status: 'error',
			message: 'Service temporarily unavailable - Health check failed',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// Performance metrics endpoint
app.get('/api/performance', async (req, res) => {
	try {
		const healthService = HealthService.getInstance();
		const poolStats = await healthService.getPoolStats();
		const health = await healthService.checkDatabaseHealth();

		res.json({
			status: 'success',
			metrics: {
				database: {
					...health.metrics,
					pool: poolStats,
				},
				system: {
					uptime: process.uptime(),
					memory: process.memoryUsage(),
					cpu: process.cpuUsage(),
				},
			},
		});
	} catch (error) {
		logger.error(`Performance check failed: ${error}`);
		res.status(500).json({
			status: 'error',
			message: 'Performance check failed',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// Recipe Generation endpoints
// Removed duplicate /api/generate endpoint

app.get('/api/generate/status/:jobId', async (req, res) => {
	try {
		const { jobId } = req.params;
		logger.info(`Checking status for job: ${jobId}`);

		const jobStatus = await withRetry(
			async () => {
				return await Job.findOne({ id: jobId })
					.maxTimeMS(30000)
					.lean()
					.allowDiskUse(true)
					.exec();
			},
			{
				maxAttempts: 3,
				initialDelayMs: 1000,
				maxDelayMs: 5000,
			}
		);

		if (!jobStatus) {
			logger.warn(`Job not found: ${jobId}`);
			return res.status(404).json({
				status: 'error',
				message: 'Job not found',
			});
		}

		logger.info(`Found job status: ${JSON.stringify(jobStatus)}`);

		res.json({
			status: 'success',
			job: {
				id: jobStatus.id,
				type: jobStatus.type,
				status: jobStatus.status,
				progress: jobStatus.progress,
				total: jobStatus.total,
				data: jobStatus.data,
				error: jobStatus.error,
				attempts: jobStatus.attempts,
				createdAt: jobStatus.createdAt,
				updatedAt: jobStatus.updatedAt,
			},
		});
	} catch (error) {
		logger.error('Job status check failed:', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		});

		// Check if it's a timeout error
		const isTimeout =
			error instanceof Error &&
			(error.message.includes('timed out') ||
				error.message.includes('buffering timed out'));

		res.status(500).json({
			status: 'error',
			message: 'Failed to get job status',
			error: isTimeout
				? 'Database operation timed out after multiple attempts, please try again later'
				: error instanceof Error
					? error.message
					: 'Unknown error',
		});
	}
});

// Job Management endpoints
app.get('/api/jobs/:jobId', async (req, res) => {
	try {
		await connectToDatabase();
		const { jobId } = req.params;
		const jobDetails = await Job.findOne({ id: jobId });
		if (!jobDetails) {
			return res.status(404).json({
				status: 'error',
				message: 'Job not found',
			});
		}
		res.json({
			status: 'success',
			job: jobDetails,
		});
	} catch (error) {
		logger.error(`Job retrieval failed: ${error}`);
		res.status(500).json({
			status: 'error',
			message: 'Failed to get job details',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

app.get('/api/jobs', async (req, res) => {
	try {
		const limit = parseInt(req.query.limit as string) || 10;
		const jobs = await Job.find().sort({ createdAt: -1 }).limit(limit);

		res.json({
			status: 'success',
			jobs,
		});
	} catch (error) {
		logger.error(`Jobs list retrieval failed: ${error}`);
		res.status(500).json({
			status: 'error',
			message: 'Failed to get jobs list',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

app.post('/api/jobs/:jobId/retry', async (req, res) => {
	try {
		const { jobId } = req.params;
		const job = await Job.findOne({ id: jobId });

		if (!job) {
			return res.status(404).json({
				status: 'error',
				message: 'Job not found',
			});
		}

		if (job.status !== 'failed') {
			return res.status(400).json({
				status: 'error',
				message: 'Only failed jobs can be retried',
			});
		}

		const queueService = QueueService.getInstance();
		const retriedJob = await queueService.enqueueJob({
			type: job.type,
			total: job.total,
			season: job.data.season,
		});

		res.status(202).json({
			status: 'accepted',
			message: 'Job retry started',
			job: {
				id: retriedJob,
				status: 'queued',
				progress: 0,
				total: job.total,
				season: job.data.season,
				createdAt: new Date(),
			},
		});
	} catch (error) {
		logger.error(`Job retry failed: ${error}`);
		res.status(500).json({
			status: 'error',
			message: 'Failed to retry job',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// Root endpoint
app.get('/', async (req, res) => {
	res.json({
		status: 'ok',
		message: 'MealPrep360 Recipe Service API',
		version: '1.0.0',
	});
});

// Mount routes
app.use('/api/recipes', recipeRoutes);

// Phase 7 API Endpoints
const searchAPI = new SearchAPI();
const recommendationsAPI = new RecommendationsAPI();
const categorizationAPI = new CategorizationAPI();

// Search endpoints
app.post('/api/search/recipes', (req, res) => searchAPI.searchRecipes(req, res));
app.get('/api/search/suggestions', (req, res) => searchAPI.getSearchSuggestions(req, res));
app.get('/api/search/ingredients', (req, res) => searchAPI.getIngredientSuggestions(req, res));
app.get('/api/search/cuisines', (req, res) => searchAPI.getCuisineSuggestions(req, res));

// Recommendation endpoints
app.get('/api/recommendations/personalized/:userId', (req, res) => recommendationsAPI.getPersonalizedRecommendations(req, res));
app.post('/api/recommendations/contextual', (req, res) => recommendationsAPI.getContextualRecommendations(req, res));
app.get('/api/recommendations/similar/:recipeId', (req, res) => recommendationsAPI.getSimilarRecipes(req, res));
app.get('/api/recommendations/trending', (req, res) => recommendationsAPI.getTrendingRecipes(req, res));
app.post('/api/recommendations/ingredients', (req, res) => recommendationsAPI.getRecipesByIngredients(req, res));

// Categorization endpoints
app.post('/api/categorization/recipe', (req, res) => categorizationAPI.categorizeRecipe(req, res));
app.get('/api/categorization/cuisine/:cuisine', (req, res) => categorizationAPI.getRecipesByCuisine(req, res));
app.get('/api/categorization/category/:category', (req, res) => categorizationAPI.getRecipesByCategory(req, res));
app.get('/api/categorization/dietary', (req, res) => categorizationAPI.getRecipesByDietaryFlags(req, res));
app.get('/api/categorization/cuisines', (req, res) => categorizationAPI.getAvailableCuisines(req, res));
app.get('/api/categorization/categories', (req, res) => categorizationAPI.getAvailableCategories(req, res));
app.get('/api/categorization/dietary-flags', (req, res) => categorizationAPI.getAvailableDietaryFlags(req, res));

// Add new endpoint for React component
app.post('/api/recipe/generate', async (req, res) => {
	const traceId = uuidv4();
	logger.info(`[${traceId}] Starting recipe generation request`);

	try {
		const { season } = req.body;
		if (!season) {
			logger.warn(`[${traceId}] Missing season parameter`);
			return res.status(400).json({
				status: 'error',
				message: 'Season is required',
			});
		}

		// Ensure DB connection
		await connectToDatabase();

		// Enqueue the job instead of processing directly
		const queueService = QueueService.getInstance();
		const jobId = await queueService.enqueueJob({
			type: 'recipe-generation',
			total: 30,
			season,
		});

		// Get the job details
		const job = await Job.findOne({ id: jobId });
		if (!job) {
			throw new Error('Failed to create job');
		}

		logger.info(`[${traceId}] Enqueued recipe generation job: ${jobId}`);

		res.status(202).json({
			status: 'accepted',
			message: 'Recipe generation started',
			job: {
				id: job.id,
				status: job.status,
				progress: job.progress,
				total: job.total,
				season: job.data?.season || season,
				createdAt: job.createdAt,
			},
		});
	} catch (error) {
		logger.error(`[${traceId}] Error enqueueing recipe generation: ${error}`);
		res.status(500).json({
			status: 'error',
			message:
				error instanceof Error
					? error.message
					: 'Failed to start recipe generation',
		});
	}
});

// MealPrep360 GPT endpoint for direct recipe generation
app.post('/api/gpt/recipe', async (req, res) => {
	const traceId = uuidv4();
	logger.info(
		`[${traceId}] Starting MealPrep360 GPT recipe generation request`
	);

	try {
		const {
			season,
			recipeName,
			ingredients,
			dietaryRestrictions,
			cuisine,
			servings,
		} = req.body;

		if (!season) {
			logger.warn(`[${traceId}] Missing season parameter`);
			return res.status(400).json({
				status: 'error',
				message: 'Season is required',
			});
		}

		// Import and use the GPT service
		const { GPTService } = await import('../services/gptService.js');
		const gptService = GPTService.getInstance();

		// Generate recipe using MealPrep360 GPT
		const recipe = await gptService.generateRecipe({
			season,
			recipeName,
			ingredients,
			dietaryRestrictions,
			cuisine,
			servings,
		});

		logger.info(
			`[${traceId}] Successfully generated recipe with MealPrep360 GPT: ${recipe.title}`
		);

		res.json({
			status: 'success',
			message: 'Recipe generated successfully using MealPrep360 GPT',
			recipe,
			traceId,
		});
	} catch (error) {
		logger.error(
			`[${traceId}] Error generating recipe with MealPrep360 GPT: ${error}`
		);
		res.status(500).json({
			status: 'error',
			message:
				error instanceof Error ? error.message : 'Failed to generate recipe',
			traceId,
		});
	}
});

// MealPrep360 GPT endpoint for recipe names generation
app.post('/api/gpt/recipe-names', async (req, res) => {
	const traceId = uuidv4();
	logger.info(
		`[${traceId}] Starting MealPrep360 GPT recipe names generation request`
	);

	try {
		const { season, count = 30 } = req.body;

		if (!season) {
			logger.warn(`[${traceId}] Missing season parameter`);
			return res.status(400).json({
				status: 'error',
				message: 'Season is required',
			});
		}

		// Import and use the GPT service
		const { GPTService } = await import('../services/gptService.js');
		const gptService = GPTService.getInstance();

		// Generate recipe names using MealPrep360 GPT
		const recipeNames = await gptService.generateRecipeNames(season, count);

		logger.info(
			`[${traceId}] Successfully generated ${recipeNames.length} recipe names with MealPrep360 GPT`
		);

		res.json({
			status: 'success',
			message: 'Recipe names generated successfully using MealPrep360 GPT',
			recipeNames,
			count: recipeNames.length,
			traceId,
		});
	} catch (error) {
		logger.error(
			`[${traceId}] Error generating recipe names with MealPrep360 GPT: ${error}`
		);
		res.status(500).json({
			status: 'error',
			message:
				error instanceof Error
					? error.message
					: 'Failed to generate recipe names',
			traceId,
		});
	}
});

// Debug endpoint to test MongoDB connection
app.get('/api/mongo-test', async (req, res) => {
	try {
		const mongoose = require('mongoose');
		await mongoose.connect(process.env.MONGODB_URI, {
			serverSelectionTimeoutMS: 10000,
		});
		res
			.status(200)
			.json({ status: 'success', message: 'Connected to MongoDB!' });
	} catch (error: unknown) {
		res.status(500).json({
			status: 'error',
			message: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// Export the Express API
export default app;
