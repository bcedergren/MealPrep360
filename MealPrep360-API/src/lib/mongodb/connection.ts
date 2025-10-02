import mongoose from 'mongoose';

declare global {
	// Use a unique name for the global variable to avoid clashing with the mongoose import
	// eslint-disable-next-line no-var
	var _mongooseCache:
		| {
				conn: typeof mongoose | null;
				promise: Promise<typeof mongoose> | null;
		  }
		| undefined;
}

const MONGODB_URI = process.env.MONGODB_URI as string;

let cached = global._mongooseCache;

if (!cached) {
	cached = global._mongooseCache = { conn: null, promise: null };
}

async function connectDB(): Promise<typeof mongoose> {
	// Only check for MONGODB_URI when actually trying to connect
	if (!MONGODB_URI) {
		throw new Error(
			'Please define the MONGODB_URI environment variable inside .env'
		);
	}

	const c = global._mongooseCache!;
	if (c.conn) {
		return c.conn;
	}

	if (!c.promise) {
		// Set global mongoose options
		mongoose.set('bufferCommands', true);
		mongoose.set('strictQuery', true);

		const opts = {
			maxPoolSize: 10,
			serverSelectionTimeoutMS: 60000,
			socketTimeoutMS: 60000,
			connectTimeoutMS: 60000,
			heartbeatFrequencyMS: 10000,
			retryWrites: true,
			retryReads: true,
			keepAlive: true,
			keepAliveInitialDelay: 300000,
		};

		c.promise = mongoose
			.connect(MONGODB_URI, {
				maxPoolSize: 10,
				serverSelectionTimeoutMS: 60000,
				socketTimeoutMS: 60000,
				connectTimeoutMS: 60000,
				heartbeatFrequencyMS: 10000,
				retryWrites: true,
				retryReads: true,
			})
			.then((mongoose) => {
				// Set operation-level options after connection
				if (mongoose.connection.db) {
					// Set operation timeout
					mongoose.connection.db.command({ ping: 1 }, { timeoutMS: 60000 });
				}
				return mongoose;
			})
			.catch((error) => {
				console.error('[MONGODB] Connection error:', error);
				c.promise = null;
				throw error;
			});
	}

	try {
		c.conn = await c.promise;
	} catch (e) {
		c.promise = null;
		console.error('[MONGODB] Failed to establish connection:', e);
		throw e;
	}

	// Add connection event handlers
	mongoose.connection.on('error', (err) => {
		console.error('[MONGODB] Connection error:', err);
	});

	mongoose.connection.on('disconnected', () => {
		c.conn = null;
		c.promise = null;
	});

	mongoose.connection.on('timeout', () => {
		console.error('[MONGODB] Connection timeout');
	});

	return c.conn;
}

export default connectDB;
