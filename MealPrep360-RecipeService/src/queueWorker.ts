import { createClient } from 'redis';
import mongoose from 'mongoose';
import { logger } from './services/logger.js';
import { RecipeGenerator } from './services/recipeGenerator.js';
import { Recipe } from './models/recipe.js';
import { Job, IJob } from './models/job.js';
import { config } from './config.js';

console.log('=== Worker starting ===');

const MONGODB_URI = process.env.MONGODB_URI!;

interface QueueMessage {
	jobId: string;
	season: string;
}

// Initialize Redis client
const redis = createClient({
	username: process.env.REDIS_USER,
	password: process.env.REDIS_PASSWORD,
	socket: {
		host: process.env.REDIS_HOST,
		port: Number(process.env.REDIS_PORT),
	},
});

redis.on('error', (err: Error) => logger.error('Redis Client Error:', err));
redis
	.connect()
	.catch((err: Error) => logger.error('Redis Connection Error:', err));

const QUEUE_KEY = `${config.queue.name}:queue`;
const PROCESSING_KEY = `${config.queue.name}:processing`;

class QueueWorker {
	private isShuttingDown = false;
	private readonly POLL_INTERVAL = 5000; // 5 seconds between polls
	private shutdownPromise: Promise<void> | null = null;
	private shutdownResolve: (() => void) | null = null;
	private isProcessing = false;

	constructor() {
		// Create shutdown promise
		this.shutdownPromise = new Promise((resolve) => {
			this.shutdownResolve = resolve;
		});

		// Handle graceful shutdown
		process.on('SIGTERM', this.handleShutdown.bind(this));
		process.on('SIGINT', this.handleShutdown.bind(this));
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

	async start() {
		logger.info('Worker started');

		while (!this.isShuttingDown) {
			try {
				logger.info('Polling for messages...');

				// Try to get a message from the queue
				const message = await redis.lPop(QUEUE_KEY);

				if (message) {
					const queueMessage: QueueMessage = JSON.parse(message);
					logger.info(
						'Received message:',
						JSON.stringify(queueMessage, null, 2)
					);

					this.isProcessing = true;
					try {
						await this.handleMessage(queueMessage);
						logger.info('Message processed successfully');
						// Message is already removed from queue by lPop
					} catch (error) {
						logger.error(`Error handling message: ${error}`);
						// Put message back in queue on error
						await redis.rPush(QUEUE_KEY, message);
					} finally {
						this.isProcessing = false;
					}
				} else {
					logger.info('No messages available in queue');
				}

				// Wait before next poll
				logger.info(
					`Waiting ${this.POLL_INTERVAL / 1000} seconds before next poll...`
				);
				await new Promise((resolve) => setTimeout(resolve, this.POLL_INTERVAL));
			} catch (error) {
				logger.error(`Error polling for messages: ${error}`);
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

	private async handleMessage(msg: QueueMessage) {
		let currentJob: IJob | null = null;
		try {
			const { jobId, season } = msg;
			logger.info(`Starting to process job ${jobId} for season ${season}`);

			currentJob = await Job.findOne({ id: jobId });
			if (!currentJob) {
				logger.error(`Job ${jobId} not found in database`);
				return;
			}

			logger.info(`Found job ${jobId}, updating status to processing`);
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
			const recipes = await RecipeGenerator.getInstance().generateRecipes(
				season,
				jobId
			);
			logger.info(`Generated ${recipes.length} recipes`);

			currentJob.total = recipes.length;
			await currentJob.save();

			for (const recipe of recipes) {
				logger.info(`Saving recipe: ${recipe.title}`);
				await Recipe.create(recipe);
				currentJob.progress += 1;
				await currentJob.save();
			}

			logger.info(`All recipes saved, marking job ${jobId} as completed`);
			currentJob.status = 'completed';
			currentJob.data = {
				...currentJob.data,
				recipesGenerated: recipes.length,
			};
			await currentJob.save();
			logger.info(`Job ${jobId} completed successfully`);
		} catch (error) {
			logger.error(`Error handling job: ${error}`);
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

async function connectDB() {
	if (mongoose.connection.readyState !== 1) {
		try {
			logger.info('Attempting to connect to MongoDB...', {
				uri: MONGODB_URI ? 'URI is set' : 'URI is not set',
				readyState: mongoose.connection.readyState,
			});

			if (!MONGODB_URI) {
				throw new Error('MONGODB_URI is not defined');
			}

			await mongoose.connect(MONGODB_URI, {
				serverSelectionTimeoutMS: 5000,
				socketTimeoutMS: 45000,
				maxPoolSize: 5,
				minPoolSize: 1,
				heartbeatFrequencyMS: 10000,
			});

			if ((mongoose.connection.readyState as number) === 1) {
				logger.info('Successfully connected to MongoDB', {
					readyState: mongoose.connection.readyState,
					host: mongoose.connection.host,
					port: mongoose.connection.port,
					name: mongoose.connection.name,
				});
			} else {
				throw new Error(
					`Connection failed. ReadyState: ${mongoose.connection.readyState}`
				);
			}
		} catch (error) {
			logger.error('Failed to connect to MongoDB:', {
				error: error instanceof Error ? error.message : String(error),
				readyState: mongoose.connection.readyState,
			});
			throw error;
		}
	} else {
		logger.info('Already connected to MongoDB', {
			readyState: mongoose.connection.readyState,
			host: mongoose.connection.host,
			port: mongoose.connection.port,
			name: mongoose.connection.name,
		});
	}
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
	logger.error('Uncaught Exception:', error);
	process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
	logger.error('Unhandled Rejection at:', promise);
	logger.error('Reason:', reason);
	process.exit(1);
});

// Start worker
async function startWorker() {
	try {
		process.env.IS_WORKER = 'true';
		const memoryInterval = setInterval(() => {
			const used = process.memoryUsage();
			logger.info('Memory usage:', {
				rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
				heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
				heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
				external: `${Math.round(used.external / 1024 / 1024)}MB`,
			});
		}, 30000);
		process.on('exit', () => {
			clearInterval(memoryInterval);
		});
		logger.info('Starting worker...');
		await connectDB();
		logger.info('Database connected, initializing worker');
		const worker = new QueueWorker();
		await worker.start();
	} catch (error) {
		logger.error(`Failed to start worker: ${error}`);
		process.exit(1);
	}
}

// Start the worker
startWorker().catch((error) => {
	logger.error(`Worker failed: ${error}`);
	process.exit(1);
});
