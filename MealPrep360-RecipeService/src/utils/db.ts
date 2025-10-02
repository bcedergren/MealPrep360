import mongoose from 'mongoose';
import { config } from '../config.js';
import { logger } from '../services/logger.js';

// Define the type for our cached connection
interface MongooseCache {
	conn: typeof mongoose | null;
	promise: Promise<typeof mongoose> | null;
	lastError: Error | null;
	metrics: {
		connectionAttempts: number;
		successfulConnections: number;
		failedConnections: number;
		lastConnectionTime: number | null;
		totalConnectionTime: number;
		memoryUsage: {
			heapUsed: number;
			heapTotal: number;
			external: number;
			timestamp: number;
		}[];
		poolStats: {
			size: number;
			available: number;
			pending: number;
			timestamp: number;
		}[];
		queryStats: {
			total: number;
			slow: number;
			errors: number;
			averageTime: number;
			totalTime: number;
			byOperation: Map<
				string,
				{ count: number; totalTime: number; errors: number }
			>;
			recentQueries: Array<{
				operation: string;
				duration: number;
				timestamp: number;
				error?: string;
			}>;
			performance: {
				p50: number;
				p90: number;
				p95: number;
				p99: number;
				lastUpdate: number;
			};
		};
		lifecycleEvents: Array<{
			event: string;
			timestamp: number;
			details?: any;
		}>;
		health: {
			status: 'healthy' | 'degraded' | 'unhealthy';
			lastCheck: number;
			issues: Array<{
				type: string;
				message: string;
				timestamp: number;
				severity: 'low' | 'medium' | 'high';
			}>;
			indicators: {
				connectionSuccessRate: number;
				querySuccessRate: number;
				averageResponseTime: number;
				errorRate: number;
				lastUpdate: number;
			};
		};
	};
}

// Cache the connection
let cached: MongooseCache = (global as any).mongoose;

if (!cached) {
	cached = (global as any).mongoose = {
		conn: null,
		promise: null,
		lastError: null,
		metrics: {
			connectionAttempts: 0,
			successfulConnections: 0,
			failedConnections: 0,
			lastConnectionTime: null,
			totalConnectionTime: 0,
			memoryUsage: [],
			poolStats: [],
			queryStats: {
				total: 0,
				slow: 0,
				errors: 0,
				averageTime: 0,
				totalTime: 0,
				byOperation: new Map(),
				recentQueries: [],
				performance: {
					p50: 0,
					p90: 0,
					p95: 0,
					p99: 0,
					lastUpdate: 0,
				},
			},
			lifecycleEvents: [],
			health: {
				status: 'healthy' as const,
				lastCheck: Date.now(),
				issues: [],
				indicators: {
					connectionSuccessRate: 100,
					querySuccessRate: 100,
					averageResponseTime: 0,
					errorRate: 0,
					lastUpdate: Date.now(),
				},
			},
		},
	};
}

// Custom error class for database connection issues
class DatabaseConnectionError extends Error {
	constructor(
		message: string,
		public originalError?: Error,
		public metrics?: any
	) {
		super(message);
		this.name = 'DatabaseConnectionError';
	}
}

// Calculate performance percentiles
function calculatePerformancePercentiles(queries: Array<{ duration: number }>) {
	if (queries.length === 0) return { p50: 0, p90: 0, p95: 0, p99: 0 };

	const sorted = [...queries].sort((a, b) => a.duration - b.duration);
	const getPercentile = (p: number) => {
		const index = Math.ceil((p / 100) * sorted.length) - 1;
		return sorted[index].duration;
	};

	return {
		p50: getPercentile(50),
		p90: getPercentile(90),
		p95: getPercentile(95),
		p99: getPercentile(99),
	};
}

// Track connection pool stats
async function trackPoolStats() {
	if (mongoose.connection.db) {
		try {
			const stats = await mongoose.connection.db.admin().serverStatus();
			const poolStats = {
				size: stats.connections?.current || 0,
				available: stats.connections?.available || 0,
				pending: stats.connections?.pending || 0,
				timestamp: Date.now(),
			};

			cached.metrics.poolStats.push(poolStats);

			// Keep only last 100 measurements
			if (cached.metrics.poolStats.length > 100) {
				cached.metrics.poolStats.shift();
			}

			// Log pool status if there are issues
			if (poolStats.available < config.mongodb.options.minPoolSize) {
				console.warn('Low connection pool availability:', {
					available: poolStats.available,
					minRequired: config.mongodb.options.minPoolSize,
					total: poolStats.size,
					pending: poolStats.pending,
					timestamp: new Date(poolStats.timestamp).toISOString(),
				});

				// Attempt to recover pool if it's empty
				if (poolStats.size === 0 || poolStats.available === 0) {
					console.log('Attempting to recover empty connection pool...');
					try {
						// Force a new connection to be created
						await mongoose.connection.db.admin().ping();
						// Wait for pool to initialize
						await new Promise((resolve) => setTimeout(resolve, 1000));
						// Check pool status again
						const newStats = await mongoose.connection.db
							.admin()
							.serverStatus();
						console.log('Pool recovery attempt result:', {
							newSize: newStats.connections?.current || 0,
							newAvailable: newStats.connections?.available || 0,
							timestamp: new Date().toISOString(),
						});
					} catch (error) {
						console.error('Failed to recover connection pool:', {
							error: error instanceof Error ? error.message : 'Unknown error',
							code: error instanceof Error ? (error as any).code : undefined,
						});
					}
				}
			}

			return poolStats;
		} catch (error) {
			console.error('Failed to get pool stats:', {
				error: error instanceof Error ? error.message : 'Unknown error',
				code: error instanceof Error ? (error as any).code : undefined,
			});
			return null;
		}
	}
	return null;
}

// Update health indicators
function updateHealthIndicators() {
	const metrics = cached.metrics;
	const now = Date.now();

	// Get latest pool stats
	const latestPoolStats = metrics.poolStats[metrics.poolStats.length - 1];
	const poolHealth = latestPoolStats
		? {
				available: latestPoolStats.available,
				total: latestPoolStats.size,
				pending: latestPoolStats.pending,
				meetsMinSize:
					latestPoolStats.available >= config.mongodb.options.minPoolSize,
			}
		: null;

	// Calculate success rates
	const totalConnections = metrics.connectionAttempts;
	const connectionSuccessRate =
		totalConnections > 0
			? (metrics.successfulConnections / totalConnections) * 100
			: 100;

	const totalQueries = metrics.queryStats.total;
	const querySuccessRate =
		totalQueries > 0
			? ((totalQueries - metrics.queryStats.errors) / totalQueries) * 100
			: 100;

	// Calculate error rate (errors per minute)
	const recentErrors = metrics.queryStats.recentQueries.filter(
		(q) => q.error && now - q.timestamp < 60000
	).length;
	const errorRate = recentErrors;

	// Update performance metrics
	metrics.queryStats.performance = {
		...calculatePerformancePercentiles(metrics.queryStats.recentQueries),
		lastUpdate: now,
	};

	// Update health indicators
	metrics.health.indicators = {
		connectionSuccessRate,
		querySuccessRate,
		averageResponseTime: metrics.queryStats.averageTime,
		errorRate,
		lastUpdate: now,
	};

	// Update health status
	let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
	const issues: Array<{
		type: string;
		message: string;
		timestamp: number;
		severity: 'low' | 'medium' | 'high';
	}> = [];

	// Check pool health
	if (poolHealth) {
		if (!poolHealth.meetsMinSize) {
			status = 'unhealthy';
			issues.push({
				type: 'pool',
				message: `Low available connections: ${poolHealth.available}/${config.mongodb.options.minPoolSize} required`,
				timestamp: now,
				severity: 'high',
			});
		} else if (poolHealth.pending > 5) {
			status = 'degraded';
			issues.push({
				type: 'pool',
				message: `High pending connections: ${poolHealth.pending}`,
				timestamp: now,
				severity: 'medium',
			});
		}
	}

	// Check connection success rate
	if (connectionSuccessRate < 90) {
		status = 'unhealthy';
		issues.push({
			type: 'connection',
			message: `Low connection success rate: ${connectionSuccessRate.toFixed(
				2
			)}%`,
			timestamp: now,
			severity: 'high',
		});
	} else if (connectionSuccessRate < 95) {
		status = 'degraded';
		issues.push({
			type: 'connection',
			message: `Degraded connection success rate: ${connectionSuccessRate.toFixed(
				2
			)}%`,
			timestamp: now,
			severity: 'medium',
		});
	}

	// Check query success rate
	if (querySuccessRate < 90) {
		status = 'unhealthy';
		issues.push({
			type: 'query',
			message: `Low query success rate: ${querySuccessRate.toFixed(2)}%`,
			timestamp: now,
			severity: 'high',
		});
	} else if (querySuccessRate < 95) {
		status = 'degraded';
		issues.push({
			type: 'query',
			message: `Degraded query success rate: ${querySuccessRate.toFixed(2)}%`,
			timestamp: now,
			severity: 'medium',
		});
	}

	// Check error rate
	if (errorRate > 10) {
		status = 'unhealthy';
		issues.push({
			type: 'error_rate',
			message: `High error rate: ${errorRate} errors per minute`,
			timestamp: now,
			severity: 'high',
		});
	} else if (errorRate > 5) {
		status = 'degraded';
		issues.push({
			type: 'error_rate',
			message: `Elevated error rate: ${errorRate} errors per minute`,
			timestamp: now,
			severity: 'medium',
		});
	}

	// Update health status
	metrics.health.status = status;
	metrics.health.lastCheck = now;
	metrics.health.issues = issues;

	// Log health status if not healthy
	if (status !== 'healthy') {
		console.warn('Database health check issues:', {
			status,
			issues,
			poolHealth,
			indicators: metrics.health.indicators,
			timestamp: new Date(now).toISOString(),
		});
	}
}

// Track memory usage
function trackMemoryUsage() {
	const memUsage = process.memoryUsage();
	cached.metrics.memoryUsage.push({
		heapUsed: memUsage.heapUsed,
		heapTotal: memUsage.heapTotal,
		external: memUsage.external,
		timestamp: Date.now(),
	});

	// Keep only last 100 measurements
	if (cached.metrics.memoryUsage.length > 100) {
		cached.metrics.memoryUsage.shift();
	}
}

// Track query performance
function trackQuery(operation: string, duration: number, error?: Error) {
	const queryStats = cached.metrics.queryStats;
	queryStats.total++;
	queryStats.totalTime += duration;
	queryStats.averageTime = queryStats.totalTime / queryStats.total;

	// Track slow queries (over 100ms)
	if (duration > 100) {
		queryStats.slow++;
	}

	// Track errors
	if (error) {
		queryStats.errors++;
	}

	// Track by operation
	const opStats = queryStats.byOperation.get(operation) || {
		count: 0,
		totalTime: 0,
		errors: 0,
	};
	opStats.count++;
	opStats.totalTime += duration;
	if (error) opStats.errors++;
	queryStats.byOperation.set(operation, opStats);

	// Track recent queries
	queryStats.recentQueries.push({
		operation,
		duration,
		timestamp: Date.now(),
		error: error?.message,
	});

	// Keep only last 1000 queries
	if (queryStats.recentQueries.length > 1000) {
		queryStats.recentQueries.shift();
	}

	// Update health indicators periodically
	if (Date.now() - cached.metrics.health.lastCheck > 60000) {
		updateHealthIndicators();
	}
}

// Track lifecycle events
function trackLifecycleEvent(event: string, details?: any) {
	cached.metrics.lifecycleEvents.push({
		event,
		timestamp: Date.now(),
		details,
	});

	// Keep only last 100 events
	if (cached.metrics.lifecycleEvents.length > 100) {
		cached.metrics.lifecycleEvents.shift();
	}
}

// Start periodic metrics collection
if (process.env.NODE_ENV === 'production') {
	setInterval(async () => {
		try {
			await trackMemoryUsage();
			const poolStats = await trackPoolStats();

			// Check if we need to increase the pool size
			if (
				poolStats &&
				(poolStats.available < config.mongodb.options.minPoolSize ||
					poolStats.size === 0)
			) {
				console.log('Attempting to increase connection pool size...', {
					current: poolStats.available,
					required: config.mongodb.options.minPoolSize,
					total: poolStats.size,
				});

				// Try to create new connections
				const db = await connectToDatabase();
				if (db.connection.readyState === 1 && db.connection.db) {
					// Force pool initialization
					await db.connection.db.admin().ping();
					// Wait for pool to initialize
					await new Promise((resolve) => setTimeout(resolve, 1000));
					// Check pool status again
					const newStats = await trackPoolStats();
					console.log('Pool size adjustment result:', {
						previous: poolStats,
						new: newStats,
						timestamp: new Date().toISOString(),
					});
				}
			}

			updateHealthIndicators();
		} catch (error) {
			console.error('Error in periodic health check:', {
				error: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined,
			});
		}
	}, 15000); // Check every 15 seconds instead of 30
}

// Set up mongoose query middleware
mongoose.set('debug', (collectionName, method, query, doc) => {
	const startTime = Date.now();
	const operation = `${collectionName}.${method}`;

	return {
		start: () => {
			trackLifecycleEvent('query_start', { operation, query, doc });
		},
		end: (error?: Error) => {
			const duration = Date.now() - startTime;
			trackQuery(operation, duration, error);
			trackLifecycleEvent('query_end', { operation, duration, error });
		},
	};
});

export async function connectToDatabase() {
	if (cached.conn) {
		return cached.conn;
	}
	if (!cached.promise) {
		if (!process.env.MONGODB_URI) {
			throw new Error('MONGODB_URI environment variable not set');
		}

		// Use shorter timeouts for Vercel functions
		const isVercel = process.env.VERCEL === '1';
		const connectionOptions = {
			...config.mongodb.options,
			serverSelectionTimeoutMS: isVercel ? 5000 : 10000,
			connectTimeoutMS: isVercel ? 5000 : 10000,
			socketTimeoutMS: isVercel ? 5000 : 10000,
			maxPoolSize: isVercel ? 5 : 20,
			minPoolSize: isVercel ? 1 : 5,
		};

		cached.promise = mongoose
			.connect(process.env.MONGODB_URI, connectionOptions)
			.then((mongoose) => {
				logger.info('Successfully connected to MongoDB');
				return mongoose;
			})
			.catch((error) => {
				logger.error('Failed to connect to MongoDB:', error);
				cached.promise = null;
				throw error;
			});
	}
	cached.conn = await cached.promise;
	return cached.conn;
}

export async function disconnectFromDatabase() {
	if (cached.conn) {
		await mongoose.disconnect();
		cached.conn = null;
		cached.promise = null;
	}
}

// Handle process termination
process.on('SIGINT', async () => {
	trackLifecycleEvent('process_termination', { signal: 'SIGINT' });
	console.log('Received SIGINT signal, disconnecting from database...', {
		metrics: cached.metrics,
		memoryUsage: process.memoryUsage(),
	});
	await disconnectFromDatabase();
	process.exit(0);
});

process.on('SIGTERM', async () => {
	trackLifecycleEvent('process_termination', { signal: 'SIGTERM' });
	console.log('Received SIGTERM signal, disconnecting from database...', {
		metrics: cached.metrics,
		memoryUsage: process.memoryUsage(),
	});
	await disconnectFromDatabase();
	process.exit(0);
});
