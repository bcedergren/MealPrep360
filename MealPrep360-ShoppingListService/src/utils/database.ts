import mongoose from 'mongoose';

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
	console.warn('Warning: MONGODB_URI environment variable is not set');
}

// Configure mongoose for serverless environment
mongoose.set('strictQuery', true);

// Cache the connection
let cachedConnection: typeof mongoose | null = null;

export async function connectToDatabase() {
	if (cachedConnection) {
		return cachedConnection;
	}

	try {
		if (!mongoUri) {
			throw new Error('MongoDB URI is not configured');
		}

		const connection = await mongoose.connect(mongoUri, {
			serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
			socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
		});
		cachedConnection = connection;
		return connection;
	} catch (error) {
		console.error('MongoDB connection error:', error);
		throw error;
	}
}

export async function getDatabaseStatus() {
	try {
		const connection = await connectToDatabase();
		return {
			status: 'connected',
			message: 'MongoDB is connected',
			readyState: connection.connection.readyState,
		};
	} catch (error) {
		console.error('Failed to connect to MongoDB:', error);
		return {
			status: 'error',
			message:
				error instanceof Error ? error.message : 'Unknown connection error',
			readyState: 0,
		};
	}
}
