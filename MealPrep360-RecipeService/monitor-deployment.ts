import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { createClient } from 'redis';
import { MongoClient } from 'mongodb';

dotenv.config();
dotenv.config({ path: '.env.local' });

const API_URL = 'https://recipes.mealprep360.com';
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const ALERT_THRESHOLD = 3; // Number of consecutive failures before alerting

interface Job {
	id: string;
	status: string;
	progress: number;
	total: number;
}

interface HealthResponse {
	status: string;
	metrics?: {
		database?: unknown;
		system?: unknown;
	};
}

class DeploymentMonitor {
	private failureCount = 0;
	private lastCheckTime = 0;
	private redis;
	private mongoClient;

	constructor() {
		if (!process.env.MONGODB_URI) {
			throw new Error('MONGODB_URI is required');
		}

		// Initialize Redis client with proper URL format
		const redisUrl =
			process.env.REDIS_URL?.replace('rediss//', 'rediss://') || '';
		const redisHost = process.env.REDIS_HOST || 'localhost';

		this.redis = createClient({
			url: redisUrl,
			socket: {
				tls: true,
				host: redisHost,
				rejectUnauthorized: false,
			},
		});

		// Initialize MongoDB client
		this.mongoClient = new MongoClient(process.env.MONGODB_URI);
	}

	async checkAPI(): Promise<boolean> {
		try {
			const response = await fetch(`${API_URL}/api/health`);
			const data = (await response.json()) as HealthResponse;

			console.log(`[${new Date().toISOString()}] API Health:`, data.status);
			if (data.status !== 'healthy') {
				throw new Error(`Unhealthy API status: ${data.status}`);
			}

			this.failureCount = 0;
			return true;
		} catch (error) {
			console.error(
				`[${new Date().toISOString()}] API Check Failed:`,
				error instanceof Error ? error.message : String(error)
			);
			this.failureCount++;
			return false;
		}
	}

	async checkRedis(): Promise<boolean> {
		try {
			await this.redis.connect();
			const ping = await this.redis.ping();
			console.log(`[${new Date().toISOString()}] Redis Health: OK`);

			// Check queue length
			const queueLength = await this.redis.lLen('recipe-generation-queue');
			console.log(`Queue length: ${queueLength}`);

			await this.redis.quit();
			return true;
		} catch (error) {
			console.error(
				`[${new Date().toISOString()}] Redis Check Failed:`,
				error instanceof Error ? error.message : String(error)
			);
			return false;
		}
	}

	async checkMongoDB(): Promise<boolean> {
		try {
			await this.mongoClient.connect();
			const db = this.mongoClient.db('mealprep360');

			// Check recent jobs
			const recentJobs = (await db
				.collection('jobs')
				.find({})
				.sort({ createdAt: -1 })
				.limit(5)
				.toArray()) as unknown as Job[];

			console.log(`[${new Date().toISOString()}] MongoDB Health: OK`);
			console.log(
				'Recent Jobs:',
				recentJobs.map((job) => ({
					id: job.id,
					status: job.status,
					progress: job.progress,
					total: job.total,
				}))
			);

			// Check recipe count
			const recipeCount = await db.collection('recipes').countDocuments();
			console.log(`Total Recipes: ${recipeCount}`);

			await this.mongoClient.close();
			return true;
		} catch (error) {
			console.error(
				`[${new Date().toISOString()}] MongoDB Check Failed:`,
				error instanceof Error ? error.message : String(error)
			);
			return false;
		}
	}

	async checkPerformance(): Promise<boolean> {
		try {
			const start = Date.now();
			const response = await fetch(`${API_URL}/api/performance`);
			const latency = Date.now() - start;
			const data = (await response.json()) as HealthResponse;

			console.log(`[${new Date().toISOString()}] Performance Check:`);
			console.log(`- Latency: ${latency}ms`);
			console.log(`- Database Metrics:`, data.metrics?.database);
			console.log(`- System Metrics:`, data.metrics?.system);

			if (latency > 2000) {
				// Alert if latency > 2s
				console.warn(`High latency detected: ${latency}ms`);
			}

			return true;
		} catch (error) {
			console.error(
				`[${new Date().toISOString()}] Performance Check Failed:`,
				error instanceof Error ? error.message : String(error)
			);
			return false;
		}
	}

	async runChecks(): Promise<void> {
		console.log(`\n[${new Date().toISOString()}] Running health checks...`);

		const results = await Promise.all([
			this.checkAPI(),
			this.checkRedis(),
			this.checkMongoDB(),
			this.checkPerformance(),
		]);

		const allHealthy = results.every((result) => result);

		if (!allHealthy && this.failureCount >= ALERT_THRESHOLD) {
			console.error(
				`\n⚠️ ALERT: System has failed ${this.failureCount} consecutive checks`
			);
			// Here you could add notification logic (email, SMS, etc.)
		}

		console.log(
			`\n[${new Date().toISOString()}] Health check complete. Status: ${allHealthy ? '✅ Healthy' : '❌ Issues Detected'}`
		);
	}

	async start(): Promise<void> {
		console.log('Starting deployment monitor...');

		// Run initial check
		await this.runChecks();

		// Set up interval for subsequent checks
		setInterval(() => this.runChecks(), CHECK_INTERVAL);
	}
}

// Start monitoring
const monitor = new DeploymentMonitor();
monitor.start().catch(console.error);
