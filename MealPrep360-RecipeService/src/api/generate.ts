import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../utils/db.js';
import { QueueService } from '../services/queueService.js';
import { Job } from '../models/job.js';
import { logger } from '../services/logger.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== 'POST') {
		return res.status(405).json({
			status: 'error',
			message: 'Method Not Allowed',
		});
	}

	// API key check
	const apiKey = req.headers['x-api-key'];
	if (!apiKey || apiKey !== process.env.API_KEY) {
		return res.status(401).json({
			status: 'error',
			message: 'Invalid or missing API key',
		});
	}

	try {
		const { season } = req.body || {};

		if (!season) {
			return res.status(400).json({
				status: 'error',
				message: 'Season is required',
			});
		}

		// Connect to database with timeout
		let dbConnected = false;
		try {
			await Promise.race([
				connectToDatabase(),
				new Promise((_, reject) =>
					setTimeout(
						() => reject(new Error('Database connection timeout')),
						5000
					)
				),
			]);
			dbConnected = true;
		} catch (dbError) {
			logger.error(`Database connection failed: ${dbError}`);
			// Continue without database connection - the worker will handle it
		}

		// Enqueue the job
		const queueService = QueueService.getInstance();
		const jobId = await queueService.enqueueJob({
			type: 'recipe-generation',
			total: 30,
			season: season,
		});

		// Try to get job details if database is connected
		let jobDetails = null;
		if (dbConnected) {
			try {
				const job = await Job.findOne({ id: jobId });
				if (job) {
					jobDetails = {
						id: job.id,
						status: job.status,
						progress: job.progress,
						total: job.total,
						season: job.data?.season || season,
						createdAt: job.createdAt,
					};
				}
			} catch (jobError) {
				logger.error(`Failed to fetch job details: ${jobError}`);
			}
		}

		// If we couldn't get job details from DB, create a basic response
		if (!jobDetails) {
			jobDetails = {
				id: jobId,
				status: 'pending',
				progress: 0,
				total: 30,
				season: season,
				createdAt: new Date().toISOString(),
			};
		}

		return res.status(202).json({
			status: 'accepted',
			message: 'Recipe generation started',
			job: jobDetails,
		});
	} catch (error: any) {
		logger.error(`Error in recipe generation: ${error}`);
		return res.status(500).json({
			status: 'error',
			message: error instanceof Error ? error.message : 'Unknown error',
		});
	}
}
