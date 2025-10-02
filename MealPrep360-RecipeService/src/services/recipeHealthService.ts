import { Recipe } from '../models/recipe.js';
import { Job } from '../models/job.js';
import { logger } from './logger.js';
import { createClient } from 'redis';
import { config } from '../config.js';

export class RecipeHealthService {
	private static instance: RecipeHealthService;
	private redis: ReturnType<typeof createClient>;

	private constructor() {
		this.redis = createClient({
			username: process.env.REDIS_USER,
			password: process.env.REDIS_PASSWORD,
			socket: {
				host: process.env.REDIS_HOST,
				port: Number(process.env.REDIS_PORT),
			},
		});
		this.redis.on('error', (err: Error) =>
			logger.error('Redis Client Error:', err)
		);
		this.redis
			.connect()
			.catch((err: Error) => logger.error('Redis Connection Error:', err));
	}

	public static getInstance(): RecipeHealthService {
		if (!RecipeHealthService.instance) {
			RecipeHealthService.instance = new RecipeHealthService();
		}
		return RecipeHealthService.instance;
	}

	public async checkRecipeGenerationHealth(): Promise<{
		status: 'healthy' | 'degraded' | 'unhealthy';
		metrics: {
			totalRecipes: number;
			recentRecipes: number;
			failedJobs: number;
			pendingJobs: number;
			processingJobs: number;
			completedJobs: number;
			queueSize: number;
			lastRecipeGenerated: string | null;
			averageGenerationTime: number;
			successRate: number;
		};
		issues: string[];
	}> {
		const issues: string[] = [];
		const metrics: any = {};

		try {
			// Check total recipes
			const totalRecipes = await Recipe.countDocuments();
			metrics.totalRecipes = totalRecipes;

			// Check recent recipes (last 24 hours)
			const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
			const recentRecipes = await Recipe.countDocuments({
				createdAt: { $gte: oneDayAgo },
			});
			metrics.recentRecipes = recentRecipes;

			// Check job statuses
			const jobStats = await Job.aggregate([
				{
					$group: {
						_id: '$status',
						count: { $sum: 1 },
					},
				},
			]);

			const jobCounts: Record<string, number> = {};
			jobStats.forEach((stat) => {
				jobCounts[stat._id] = stat.count;
			});

			metrics.failedJobs = jobCounts.failed || 0;
			metrics.pendingJobs = jobCounts.pending || 0;
			metrics.processingJobs = jobCounts.processing || 0;
			metrics.completedJobs = jobCounts.completed || 0;

			// Check queue size
			const queueSize = await this.redis.lLen(`${config.queue.name}:queue`);
			metrics.queueSize = queueSize;

			// Check last recipe generated
			const lastRecipe = await Recipe.findOne().sort({ createdAt: -1 });
			metrics.lastRecipeGenerated = lastRecipe
				? lastRecipe.createdAt.toISOString()
				: null;

			// Calculate average generation time
			const recentJobs = await Job.find({
				type: 'recipe-generation',
				status: 'completed',
				createdAt: { $gte: oneDayAgo },
			})
				.sort({ createdAt: -1 })
				.limit(10);

			if (recentJobs.length > 0) {
				const avgTime =
					recentJobs.reduce((sum, job) => {
						const duration = job.updatedAt.getTime() - job.createdAt.getTime();
						return sum + duration;
					}, 0) / recentJobs.length;
				metrics.averageGenerationTime = avgTime / 1000; // Convert to seconds
			} else {
				metrics.averageGenerationTime = 0;
			}

			// Calculate success rate
			const totalJobs = metrics.completedJobs + metrics.failedJobs;
			metrics.successRate =
				totalJobs > 0 ? (metrics.completedJobs / totalJobs) * 100 : 100;

			// Check for issues
			if (metrics.failedJobs > 5) {
				issues.push(`High number of failed jobs: ${metrics.failedJobs}`);
			}

			if (metrics.pendingJobs > 10) {
				issues.push(`High number of pending jobs: ${metrics.pendingJobs}`);
			}

			if (metrics.queueSize > 20) {
				issues.push(`Large queue size: ${metrics.queueSize} jobs waiting`);
			}

			if (metrics.recentRecipes === 0 && metrics.pendingJobs === 0) {
				issues.push('No recent recipe generation activity');
			}

			if (metrics.successRate < 80) {
				issues.push(`Low success rate: ${metrics.successRate.toFixed(1)}%`);
			}

			// Determine overall status
			let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

			if (issues.length > 2 || metrics.successRate < 50) {
				status = 'unhealthy';
			} else if (issues.length > 0 || metrics.successRate < 80) {
				status = 'degraded';
			}

			return {
				status,
				metrics,
				issues,
			};
		} catch (error) {
			logger.error('Error checking recipe generation health:', error);
			return {
				status: 'unhealthy',
				metrics: {
					totalRecipes: 0,
					recentRecipes: 0,
					failedJobs: 0,
					pendingJobs: 0,
					processingJobs: 0,
					completedJobs: 0,
					queueSize: 0,
					lastRecipeGenerated: null,
					averageGenerationTime: 0,
					successRate: 0,
				},
				issues: [
					'Health check failed: ' +
						(error instanceof Error ? error.message : 'Unknown error'),
				],
			};
		}
	}

	public async forceRecipeGeneration(season: string): Promise<{
		success: boolean;
		jobId?: string;
		error?: string;
	}> {
		try {
			// Check if there are any pending jobs for this season
			const existingJob = await Job.findOne({
				type: 'recipe-generation',
				status: 'pending',
				'data.season': season,
			});

			if (existingJob) {
				return {
					success: false,
					error: `Job already exists for ${season} season`,
				};
			}

			// Create a new job
			const { v4: uuidv4 } = await import('uuid');
			const jobId = uuidv4();

			const job = await Job.create({
				id: jobId,
				type: 'recipe-generation',
				status: 'pending',
				progress: 0,
				total: 30,
				data: {
					season,
					forced: true,
					createdAt: new Date(),
				},
				attempts: 1,
			});

			// Add to queue
			const message = JSON.stringify({ jobId, season });
			await this.redis.lPush(`${config.queue.name}:queue`, message);

			logger.info(
				`Forced recipe generation job created: ${jobId} for ${season}`
			);

			return {
				success: true,
				jobId,
			};
		} catch (error) {
			logger.error('Error forcing recipe generation:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	public async getDetailedJobStatus(jobId: string): Promise<{
		job: any;
		recipes: any[];
		health: any;
	}> {
		try {
			const job = await Job.findOne({ id: jobId });
			if (!job) {
				throw new Error('Job not found');
			}

			// Get recipes for this job (if any)
			const recipes = await Recipe.find({
				'data.jobId': jobId,
			}).sort({ createdAt: -1 });

			// Get health metrics
			const health = await this.checkRecipeGenerationHealth();

			return {
				job,
				recipes,
				health,
			};
		} catch (error) {
			logger.error('Error getting detailed job status:', error);
			throw error;
		}
	}
}
