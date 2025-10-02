import { createClient } from 'redis';
import mongoose from 'mongoose';
import { logger } from '../services/logger.js';
import { RecipeOrchestrator } from '../services/recipeOrchestrator.js';
import { Recipe } from '../models/recipe.js';
import { Job, IJob } from '../models/job.js';
import { config } from '../config.js';
import { connectToDatabase } from '../utils/db.js';

interface QueueMessage {
	jobId: string;
	season: string;
}

interface RedisRetryStrategyOptions {
	error?: Error & { code?: string };
	total_retry_time: number;
	attempt: number;
}

export class RecipeGenerationWorker {
	private static instance: RecipeGenerationWorker;
	private redis: ReturnType<typeof createClient>;
	private isShuttingDown = false;
	private readonly POLL_INTERVAL = 5000; // 5 seconds between polls
	private shutdownPromise: Promise<void> | null = null;
	private shutdownResolve: (() => void) | null = null;
	private isProcessing = false;
	private readonly QUEUE_KEY = 'Queue3:queue';

	private constructor() {
		// Initialize Redis client with flexible configuration
		const redisConfig = {
			url: process.env.REDIS_URL,
			socket:
				process.env.NODE_ENV === 'production'
					? {
							tls: true as const,
							host: new URL(process.env.REDIS_URL || '').hostname,
							rejectUnauthorized: false,
						}
					: undefined,
			password: process.env.REDIS_TOKEN,
			retry_strategy: (options: RedisRetryStrategyOptions) => {
				if (options.error?.code === 'ECONNREFUSED') {
					logger.error('Redis connection refused. Retrying in 5s...');
					return 5000;
				}
				if (options.total_retry_time > 1000 * 60 * 60) {
					logger.error('Redis retry time exhausted');
					return new Error('Redis retry time exhausted');
				}
				if (options.attempt > 10) {
					logger.error('Redis maximum retry attempts reached');
					return new Error('Redis maximum retry attempts reached');
				}
				return Math.min(options.attempt * 100, 3000);
			},
		};

		this.redis = createClient(redisConfig);

		this.redis.on('error', (err: Error & { code?: string }) => {
			logger.error('Redis Client Error:', err);
			if (err.code === 'ECONNREFUSED') {
				logger.error(
					'Redis connection refused. Please check Redis server status.'
				);
			}
		});

		this.redis.on('connect', () => {
			logger.info('Redis client connected successfully');
		});

		this.redis.on('reconnecting', () => {
			logger.info('Redis client reconnecting...');
		});

		// Create shutdown promise
		this.shutdownPromise = new Promise((resolve) => {
			this.shutdownResolve = resolve;
		});

		// Handle graceful shutdown
		process.on('SIGTERM', this.handleShutdown.bind(this));
		process.on('SIGINT', this.handleShutdown.bind(this));
	}

	public static getInstance(): RecipeGenerationWorker {
		if (!RecipeGenerationWorker.instance) {
			RecipeGenerationWorker.instance = new RecipeGenerationWorker();
		}
		return RecipeGenerationWorker.instance;
	}

	private async handleShutdown(signal: string) {
		if (this.isShuttingDown) {
			logger.info('Shutdown already in progress...');
			return;
		}

		logger.info(`Received ${signal} signal, initiating graceful shutdown...`);
		this.isShuttingDown = true;

		try {
			// If we're processing a message, wait for it to complete
			if (this.isProcessing) {
				logger.info('Waiting for current message processing to complete...');
				await new Promise((resolve) => setTimeout(resolve, 10000));
			}

			// Close MongoDB connection
			if (mongoose.connection.readyState === 1) {
				logger.info('Closing MongoDB connection...');
				await mongoose.connection.close();
			}

			logger.info('Cleanup completed, exiting...');
			this.shutdownResolve?.();
			process.exit(0);
		} catch (error) {
			logger.error('Error during shutdown:', error);
			process.exit(1);
		}
	}

	public async start() {
		logger.info('Recipe Generation Worker started');

		// Connect to MongoDB
		try {
			logger.info('Connecting to MongoDB...');
			await connectToDatabase();
			logger.info('Successfully connected to MongoDB');
		} catch (error) {
			logger.error('Failed to connect to MongoDB:', error);
			throw error;
		}

		while (!this.isShuttingDown) {
			try {
				logger.info('Polling for recipe generation messages...');

				// Try to get a message from the queue
				const message = await this.redis.lPop(this.QUEUE_KEY);

				if (message) {
					const queueMessage: QueueMessage = JSON.parse(message);
					logger.info(
						'Received recipe generation message:',
						JSON.stringify(queueMessage, null, 2)
					);

					this.isProcessing = true;
					try {
						await this.handleMessage(queueMessage);
						logger.info('Recipe generation message processed successfully');
						// Message is already removed from queue by lPop
					} catch (error) {
						logger.error(`Error handling recipe generation message: ${error}`);
						// Put message back in queue on error
						await this.redis.rPush(this.QUEUE_KEY, message);
					} finally {
						this.isProcessing = false;
					}
				} else {
					logger.info('No recipe generation messages available in queue');
				}

				// Wait before next poll
				logger.info(
					`Waiting ${this.POLL_INTERVAL / 1000} seconds before next poll...`
				);
				await new Promise((resolve) => setTimeout(resolve, this.POLL_INTERVAL));
			} catch (error) {
				logger.error(`Error polling for recipe generation messages: ${error}`);
				if (error instanceof Error) {
					logger.error(`Error details: ${error.message}`);
					logger.error(`Error stack: ${error.stack}`);
				}
				// Wait before retry
				await new Promise((resolve) => setTimeout(resolve, this.POLL_INTERVAL));
			}
		}

		// Wait for shutdown to complete
		await this.shutdownPromise;
	}

	public stop() {
		this.isShuttingDown = true;
		logger.info('Stopping recipe generation worker');
	}

	private async handleMessage(msg: QueueMessage) {
		let currentJob: IJob | null = null;
		try {
			const { jobId, season } = msg;
			logger.info(
				`Starting to process recipe generation job ${jobId} for season ${season}`
			);

			currentJob = await Job.findOne({ id: jobId });
			if (!currentJob) {
				logger.error(`Job ${jobId} not found in database`);
				return;
			}

			// Only process recipe-generation jobs
			if (currentJob.type !== 'recipe-generation') {
				logger.info(
					`Skipping job ${jobId} - not a recipe generation job (type: ${currentJob.type})`
				);
				return;
			}

			logger.info(
				`Found recipe generation job ${jobId}, updating status to processing`
			);
			if ((currentJob.attempts || 0) >= 3) {
				logger.error(
					`Job ${jobId} has already been attempted 3 times. Marking as failed.`
				);
				currentJob.status = 'failed';
				await currentJob.save();
				return;
			}
			currentJob.status = 'processing';
			currentJob.progress = 0;
			currentJob.attempts = (currentJob.attempts || 0) + 1;
			await currentJob.save();

			logger.info(`Generating recipes for season ${season}`);
			const recipes = await RecipeOrchestrator.getInstance().generateRecipes(
				season,
				jobId
			);
			logger.info(`Generated ${recipes.length} recipes`);

			currentJob.total = recipes.length;
			await currentJob.save();

			for (const recipe of recipes) {
				logger.info(`Saving recipe: ${recipe.title}`);
				try {
					const savedRecipe = await Recipe.create(recipe);
					logger.info(
						`Successfully saved recipe: ${recipe.title} with ID: ${savedRecipe._id}`
					);
					currentJob.progress += 1;
					await currentJob.save();
				} catch (error) {
					logger.error(`Error saving recipe ${recipe.title}:`, error);
					if (error instanceof Error) {
						logger.error(`Error details: ${error.message}`);
						logger.error(`Error stack: ${error.stack}`);
					}
					// Try to fix common validation issues
					if (error instanceof Error && error.name === 'ValidationError') {
						logger.info(
							`Attempting to fix validation issues for recipe: ${recipe.title}`
						);
						const fixedRecipe = {
							...recipe,
							storageTime: Math.min(180, recipe.storageTime), // Cap at 180 days
							prepTime: Math.min(120, recipe.prepTime), // Cap at 120 minutes
							cookTime: Math.min(180, recipe.cookTime), // Cap at 180 minutes
							servings: Math.min(12, recipe.servings), // Cap at 12 servings
							createdAt: new Date(),
							updatedAt: new Date(),
						};
						try {
							const savedRecipe = await Recipe.create(fixedRecipe);
							logger.info(
								`Successfully saved fixed recipe: ${recipe.title} with ID: ${savedRecipe._id}`
							);
							currentJob.progress += 1;
							await currentJob.save();
						} catch (retryError) {
							logger.error(
								`Failed to save fixed recipe ${recipe.title}:`,
								retryError
							);
							throw retryError;
						}
					} else {
						throw error;
					}
				}
			}

			logger.info(`All recipes saved, marking job ${jobId} as completed`);
			currentJob.status = 'completed';
			currentJob.data = {
				...currentJob.data,
				recipesGenerated: recipes.length,
			};
			await currentJob.save();
			logger.info(`Recipe generation job ${jobId} completed successfully`);
		} catch (error) {
			logger.error(`Error handling recipe generation job: ${error}`);
			if (error instanceof Error) {
				logger.error(`Error stack: ${error.stack}`);
			}
			// Update job status to failed
			if (currentJob) {
				currentJob.status = 'failed';
				currentJob.error =
					error instanceof Error ? error.message : String(error);
				await currentJob.save();
			}
			throw error; // Re-throw to be caught by the main loop
		}
	}
}
