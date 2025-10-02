import mongoose from 'mongoose';
import { logger } from './logger.js';
import { config } from '../config.js';

// Connection states:
// 0 = disconnected
// 1 = connected
// 2 = connecting
// 3 = disconnecting

const isConnected = (state: number): boolean => state === 1;

export const connectDB = async () => {
	logger.info('Checking database connection state...', {
		readyState: mongoose.connection.readyState,
		host: mongoose.connection.host,
		name: mongoose.connection.name,
	});

	// If we're in the process of disconnecting, wait for it to complete
	if (mongoose.connection.readyState === 3) {
		logger.info('Waiting for disconnection to complete...');
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	// If already connected, return the connection
	if (isConnected(mongoose.connection.readyState)) {
		logger.info('Already connected to database');
		return mongoose.connection;
	}

	try {
		const mongoUri = config.mongodb.uri;
		if (!mongoUri) {
			throw new Error('MongoDB URI is not configured');
		}

		logger.info('Attempting to connect to MongoDB...', {
			uri: mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'), // Mask credentials
			options: config.mongodb.options,
		});

		// Remove any existing connection event handlers
		mongoose.connection.removeAllListeners();

		// Set up connection event handlers before connecting
		mongoose.connection.on('error', (err) => {
			logger.error('MongoDB connection error:', err);
		});

		mongoose.connection.on('disconnected', () => {
			logger.warn('MongoDB disconnected');
		});

		mongoose.connection.on('reconnected', () => {
			logger.info('MongoDB reconnected');
		});

		// Connect with retry logic
		let retries = 3;
		while (retries > 0) {
			try {
				await mongoose.connect(mongoUri, {
					...config.mongodb.options,
					serverSelectionTimeoutMS: 30000, // Increased from 10000
					connectTimeoutMS: 30000, // Increased from 10000
					socketTimeoutMS: 45000,
					heartbeatFrequencyMS: 10000, // Added to check connection more frequently
					retryWrites: true,
					retryReads: true,
					maxPoolSize: 10,
					minPoolSize: 5,
					maxIdleTimeMS: 60000,
				});

				// Wait a moment to ensure connection is stable
				await new Promise((resolve) => setTimeout(resolve, 2000)); // Increased from 1000

				if (isConnected(mongoose.connection.readyState)) {
					logger.info('MongoDB connection successful', {
						readyState: mongoose.connection.readyState,
						host: mongoose.connection.host,
						name: mongoose.connection.name,
						port: mongoose.connection.port,
					});
					return mongoose.connection;
				} else {
					throw new Error(
						`Connection not ready. State: ${mongoose.connection.readyState}`
					);
				}
			} catch (error) {
				retries--;
				if (retries === 0) throw error;
				const waitTime = (3 - retries) * 5000; // Exponential backoff: 5s, 10s, 15s
				logger.warn(
					`Connection attempt failed, retrying in ${waitTime / 1000}s... (${retries} attempts remaining)`
				);
				await new Promise((resolve) => setTimeout(resolve, waitTime)); // Dynamic wait time
			}
		}

		throw new Error('Failed to establish stable connection after retries');
	} catch (error) {
		logger.error('MongoDB connection error:', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			options: config.mongodb.options,
		});
		throw error;
	}
};
