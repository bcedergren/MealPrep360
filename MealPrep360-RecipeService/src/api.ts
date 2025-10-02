import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { logger } from './services/logger.js';
import mongoose from 'mongoose';
import { connectDB } from './services/database.js';
import { QueueService } from './services/queueService.js';
import recipeRoutes from './routes/recipeRoutes.js';
import { RecipeGenerator } from './services/recipeGenerator.js';
import { Job } from './models/job.js';
import { connectToDatabase, disconnectFromDatabase } from './utils/db.js';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { Recipe } from './models/recipe.js';
import { HealthService } from './services/health.js';

const app = express();

// Add middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Add request logging
app.use((req: Request, res: Response, next: NextFunction) => {
	logger.info(`${req.method} ${req.path}`);
	next();
});

// Mount routes
app.use('/api/recipes', recipeRoutes);

// Health check route
app.get('/', async (req: Request, res: Response) => {
	try {
		// Handle range requests
		if (req.headers.range === 'bytes=0-0') {
			res.setHeader('Content-Type', 'text/html');
			res.setHeader('Accept-Ranges', 'bytes');
			res.setHeader('Content-Length', '1');
			res.status(206).send(' ');
			return;
		}

		// Set basic headers for regular requests
		res.setHeader('Content-Type', 'text/html');
		res.setHeader('Cache-Control', 'no-cache');

		// Attempt database connection with specific options
		let dbStatus = false;
		let dbErrorDetails = '';
		try {
			await connectDB();
			// Check connection without using serverStatus
			dbStatus = mongoose.connection.readyState === 1;
		} catch (dbError) {
			// Log the error but don't fail the request
			console.error('Database connection error:', dbError);

			// Handle specific MongoDB errors
			if (dbError instanceof Error) {
				if (
					dbError.message.includes(
						'user is not allowed to do action [serverStatus]'
					)
				) {
					// This is actually a successful connection, just without admin privileges
					dbStatus = true;
					dbErrorDetails = 'Connected (Limited Permissions)';
				} else if (dbError.message.includes('Authentication failed')) {
					dbErrorDetails = 'Authentication Failed';
				} else if (dbError.message.includes('ECONNREFUSED')) {
					dbErrorDetails = 'Connection Refused';
				} else {
					dbErrorDetails = dbError.message;
				}
			}
		}

		// Get version from package.json
		const version = process.env.npm_package_version || '1.0.0';
		const environment = process.env.NODE_ENV || 'development';

		// Format memory size
		const formatMemory = (bytes: number) => {
			const mb = bytes / (1024 * 1024);
			return `${mb.toFixed(2)} MB`;
		};

		// Format uptime
		const formatUptime = (seconds: number) => {
			const hours = Math.floor(seconds / 3600);
			const minutes = Math.floor((seconds % 3600) / 60);
			const secs = Math.floor(seconds % 60);
			return `${hours}h ${minutes}m ${secs}s`;
		};

		// Get system metrics
		const memoryUsage = process.memoryUsage();
		const uptime = process.uptime();

		// Format timestamp
		const formatTimestamp = (timestamp: number) => {
			return new Date(timestamp).toISOString();
		};

		// Get latest pool stats
		const getLatestPoolStats = () => {
			if (mongoose.connection.db) {
				const serverConfig = (mongoose.connection.db as any).serverConfig;
				if (serverConfig?.pool) {
					return {
						size: serverConfig.pool.totalConnectionCount,
						available: serverConfig.pool.availableConnectionCount,
						pending: serverConfig.pool.waitQueueSize,
					};
				}
			}
			return { size: 0, available: 0, pending: 0 };
		};

		const poolStats = getLatestPoolStats();

		// Get request metrics
		const getRequestMetrics = () => {
			if (mongoose.connection.db) {
				const serverConfig = (mongoose.connection.db as any).serverConfig;
				return {
					totalRequests: serverConfig?.requestCount || 0,
					activeRequests: serverConfig?.activeRequestCount || 0,
				};
			}
			return { totalRequests: 0, activeRequests: 0 };
		};

		const requestMetrics = getRequestMetrics();

		// Send minimal HTML response
		const html = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>MealPrep360 Recipe Service</title>
				<style>
					body {
						font-family: system-ui, -apple-system, sans-serif;
						line-height: 1.6;
						max-width: 1200px;
						margin: 0 auto;
						padding: 2rem;
						color: #333;
					}
					h1 { color: #4CAF50; }
					h2 { 
						color: #2E7D32;
						margin-top: 1.5rem;
						font-size: 1.2rem;
					}
					.status { 
						padding: 1rem;
						background: #e8f5e9;
						border: 2px solid #4CAF50;
						border-radius: 8px;
						margin-bottom: 1rem;
					}
					.status.error {
						background: #ffebee;
						border-color: #f44336;
					}
					.metrics {
						display: grid;
						grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
						gap: 1rem;
						margin-top: 1rem;
					}
					.metric-card {
						background: #f5f5f5;
						padding: 1rem;
						border-radius: 8px;
						border: 1px solid #e0e0e0;
					}
					.metric-card h3 {
						margin: 0 0 0.5rem 0;
						color: #2E7D32;
						font-size: 1rem;
					}
					.metric-value {
						font-family: monospace;
						color: #666;
					}
					.metric-grid {
						display: grid;
						grid-template-columns: repeat(2, 1fr);
						gap: 0.5rem;
					}
					.metric-item {
						display: flex;
						justify-content: space-between;
						padding: 0.25rem 0;
						border-bottom: 1px solid #eee;
					}
					.metric-label {
						color: #666;
					}
					.version {
						font-size: 0.8em;
						color: #666;
						margin-top: 1rem;
						padding-top: 1rem;
						border-top: 1px solid #e0e0e0;
					}
					.details {
						font-size: 0.9em;
						color: #666;
						margin-top: 0.5rem;
					}
					.timestamp {
						font-size: 0.8em;
						color: #999;
						margin-top: 0.5rem;
					}
					.health-indicator {
						display: inline-block;
						padding: 0.25rem 0.5rem;
						border-radius: 4px;
						font-size: 0.9em;
						margin-left: 0.5rem;
					}
					.health-good {
						background: #e8f5e9;
						color: #2E7D32;
					}
					.health-warning {
						background: #fff3e0;
						color: #ef6c00;
					}
					.health-error {
						background: #ffebee;
						color: #c62828;
					}
				</style>
			</head>
			<body>
				<h1>MealPrep360 Recipe Service</h1>
				<div class="status ${dbStatus ? '' : 'error'}">
					<p>Status: ${dbStatus ? 'Operational' : 'Degraded'}</p>
					<p>Database: ${dbStatus ? 'Connected' : 'Connection Issue'} ${
						dbErrorDetails
							? `<span class="details">(${dbErrorDetails})</span>`
							: ''
					}</p>
					<p>Environment: ${environment}</p>
					<p>Time: ${new Date().toISOString()}</p>
				</div>

				<div class="metrics">
					<div class="metric-card">
						<h3>System Metrics</h3>
						<div class="metric-grid">
							<div class="metric-item">
								<span class="metric-label">Uptime</span>
								<span class="metric-value">${formatUptime(uptime)}</span>
							</div>
							<div class="metric-item">
								<span class="metric-label">Memory Usage</span>
								<span class="metric-value">${formatMemory(memoryUsage.heapUsed)}</span>
							</div>
							<div class="metric-item">
								<span class="metric-label">Total Memory</span>
								<span class="metric-value">${formatMemory(memoryUsage.heapTotal)}</span>
							</div>
							<div class="metric-item">
								<span class="metric-label">External Memory</span>
								<span class="metric-value">${formatMemory(memoryUsage.external)}</span>
							</div>
							<div class="metric-item">
								<span class="metric-label">RSS</span>
								<span class="metric-value">${formatMemory(memoryUsage.rss)}</span>
							</div>
						</div>
					</div>

					<div class="metric-card">
						<h3>Database Metrics</h3>
						<div class="metric-grid">
							<div class="metric-item">
								<span class="metric-label">Connection State</span>
								<span class="metric-value">${
									mongoose.connection.readyState === 1
										? 'Connected'
										: 'Disconnected'
								}</span>
							</div>
							<div class="metric-item">
								<span class="metric-label">Host</span>
								<span class="metric-value">${mongoose.connection.host || 'N/A'}</span>
							</div>
							<div class="metric-item">
								<span class="metric-label">Database</span>
								<span class="metric-value">${mongoose.connection.name || 'N/A'}</span>
							</div>
							<div class="metric-item">
								<span class="metric-label">Pool Size</span>
								<span class="metric-value">${poolStats.size}</span>
							</div>
							<div class="metric-item">
								<span class="metric-label">Available Connections</span>
								<span class="metric-value">${poolStats.available}</span>
							</div>
							<div class="metric-item">
								<span class="metric-label">Pending Connections</span>
								<span class="metric-value">${poolStats.pending}</span>
							</div>
						</div>
					</div>

					<div class="metric-card">
						<h3>Request Metrics</h3>
						<div class="metric-grid">
							<div class="metric-item">
								<span class="metric-label">Total Requests</span>
								<span class="metric-value">${requestMetrics.totalRequests}</span>
							</div>
							<div class="metric-item">
								<span class="metric-label">Active Requests</span>
								<span class="metric-value">${requestMetrics.activeRequests}</span>
							</div>
							<div class="metric-item">
								<span class="metric-label">Last Request</span>
								<span class="metric-value">${formatTimestamp(Date.now())}</span>
							</div>
						</div>
					</div>
				</div>

				<div class="version">
					<p>Version: ${version}</p>
					<p>Node: ${process.version}</p>
					<p class="timestamp">Last Updated: ${new Date().toISOString()}</p>
				</div>
			</body>
			</html>
		`;

		// Set content length for the response
		res.setHeader('Content-Length', Buffer.byteLength(html));
		res.send(html);
	} catch (error) {
		// Log the full error for debugging
		console.error('Health check error:', error);

		// Send minimal error response
		const errorHtml = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<title>Error - MealPrep360 Recipe Service</title>
				<style>
					body {
						font-family: system-ui, -apple-system, sans-serif;
						line-height: 1.6;
						max-width: 800px;
						margin: 0 auto;
						padding: 2rem;
					}
					h1 { color: #f44336; }
					.error {
						padding: 1rem;
						background: #ffebee;
						border: 2px solid #f44336;
						border-radius: 8px;
					}
				</style>
			</head>
			<body>
				<h1>Error</h1>
				<div class="error">
					<p>Service temporarily unavailable</p>
				</div>
			</body>
			</html>
		`;

		res.setHeader('Content-Type', 'text/html');
		res.setHeader('Content-Length', Buffer.byteLength(errorHtml));
		res.status(500).send(errorHtml);
	}
});

// Recipe generation route
app.post('/api/generate', async (req: Request, res: Response) => {
	try {
		const { season } = req.body;
		if (!season) {
			return res.status(400).json({
				status: 'error',
				message: 'Season is required',
			});
		}

		// Use QueueService to enqueue the job
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

		// Type assertion since we've checked for null
		const jobData = job as NonNullable<typeof job>;

		res.status(202).json({
			status: 'accepted',
			message: 'Recipe generation started',
			job: {
				id: jobData.id,
				status: jobData.status,
				progress: jobData.progress,
				total: jobData.total,
				season: jobData.data.season,
				createdAt: jobData.createdAt,
			},
		});
	} catch (error) {
		logger.error(`Error starting recipe generation: ${error}`);
		res.status(500).json({
			status: 'error',
			message: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// Handle OPTIONS requests for CORS
app.options('*', (req: Request, res: Response) => {
	res.status(200).end();
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	logger.error(`Unhandled error: ${err.message}`);
	res.status(500).json({
		status: 'error',
		message: err.message || 'Internal server error',
	});
});

// Export the Express app as the serverless function
export default app;
