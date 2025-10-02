import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { RecipeGenerationWorker } from './workers/recipeWorker';
import { QueueService } from './services/queueService';
import { logger } from './services/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Services
const queueService = new QueueService();
const worker = new RecipeGenerationWorker();

// Health check endpoint for Railway
app.get('/health', (req, res) => {
	res.json({
		status: 'healthy',
		timestamp: new Date().toISOString(),
		service: 'mealprep360-worker',
		version: '1.0.0',
	});
});

// Manual trigger endpoint for testing
app.post('/process', async (req, res) => {
	try {
		logger.info('Manual processing triggered');
		const result = await worker.processNextJob();
		res.json({
			success: true,
			result,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		logger.error('Manual processing failed:', error);
		res.status(500).json({
			error: error.message,
			timestamp: new Date().toISOString(),
		});
	}
});

// Get queue status
app.get('/status', async (req, res) => {
	try {
		const status = await queueService.getQueueStatus();
		res.json(status);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// Worker control endpoints
app.post('/worker/start', (req, res) => {
	if (!isWorkerRunning) {
		startWorker();
		res.json({ message: 'Worker started' });
	} else {
		res.json({ message: 'Worker already running' });
	}
});

app.post('/worker/stop', (req, res) => {
	stopWorker();
	res.json({ message: 'Worker stop requested' });
});

// Worker state
let isWorkerRunning = false;
let shouldStop = false;

// Main worker loop
async function startWorker() {
	if (isWorkerRunning) {
		logger.warn('Worker already running');
		return;
	}

	isWorkerRunning = true;
	shouldStop = false;

	logger.info('🚀 Starting MealPrep360 Recipe Worker...');

	while (!shouldStop) {
		try {
			const processed = await worker.processNextJob();

			if (processed) {
				logger.info('Job processed successfully');
				// Short delay between successful jobs
				await new Promise((resolve) => setTimeout(resolve, 2000));
			} else {
				// No jobs available, longer delay
				await new Promise((resolve) => setTimeout(resolve, 10000));
			}
		} catch (error) {
			logger.error('Worker error:', error);
			// Backoff on error
			await new Promise((resolve) => setTimeout(resolve, 15000));
		}
	}

	isWorkerRunning = false;
	logger.info('Worker stopped');
}

function stopWorker() {
	shouldStop = true;
	logger.info('Worker stop requested');
}

// Graceful shutdown
process.on('SIGTERM', () => {
	logger.info('SIGTERM received, shutting down gracefully');
	stopWorker();
	setTimeout(() => {
		process.exit(0);
	}, 5000);
});

process.on('SIGINT', () => {
	logger.info('SIGINT received, shutting down gracefully');
	stopWorker();
	setTimeout(() => {
		process.exit(0);
	}, 5000);
});

// Start the server
app.listen(PORT, () => {
	logger.info(`🚀 MealPrep360 Worker Service running on port ${PORT}`);
	logger.info(`Health check: http://localhost:${PORT}/health`);

	// Auto-start worker after server starts
	setTimeout(() => {
		startWorker();
	}, 2000);
});

export { app };
