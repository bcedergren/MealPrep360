import { logger } from '../services/logger.js';
import { connectToDatabase } from './db.js';

// Retry configuration
export const RETRY_OPTIONS = {
	maxAttempts: 3,
	initialDelayMs: 1000,
	maxDelayMs: 5000,
};

/**
 * Executes a database operation with retry logic
 */
export async function withRetry<T>(
	operation: () => Promise<T>,
	options: Partial<typeof RETRY_OPTIONS> = {}
): Promise<T> {
	const config = { ...RETRY_OPTIONS, ...options };
	let lastError: Error | null = null;
	let attempt = 1;

	while (attempt <= config.maxAttempts) {
		try {
			await connectToDatabase();
			return await operation();
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			if (lastError.message.includes('not found')) {
				throw lastError;
			}

			if (attempt === config.maxAttempts) {
				logger.error('Database operation failed after all retry attempts', {
					error: lastError.message,
					attempts: attempt,
				});
				throw lastError;
			}

			const delay = Math.min(
				config.initialDelayMs * Math.pow(2, attempt - 1),
				config.maxDelayMs
			);

			logger.warn('Database operation failed, retrying...', {
				error: lastError.message,
				attempt,
				nextAttemptDelay: delay,
			});

			await new Promise((resolve) => setTimeout(resolve, delay));
			attempt++;
		}
	}

	throw lastError;
}
