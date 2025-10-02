import express from 'express';
import { HealthService } from '../services/health.js';

const router = express.Router();
const healthService = HealthService.getInstance();

// Health check endpoint
router.get('/health', async (req, res) => {
	try {
		const health = await healthService.checkDatabaseHealth();
		res.json({
			status: health.status,
			timestamp: new Date().toISOString(),
			metrics: health.metrics,
		});
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message: error instanceof Error ? error.message : 'Unknown error',
			timestamp: new Date().toISOString(),
		});
	}
});

// Metrics endpoint
router.get('/metrics', async (req, res) => {
	try {
		const health = await healthService.checkDatabaseHealth();
		res.json({
			timestamp: new Date().toISOString(),
			metrics: health.metrics,
		});
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message: error instanceof Error ? error.message : 'Unknown error',
			timestamp: new Date().toISOString(),
		});
	}
});

export default router;
