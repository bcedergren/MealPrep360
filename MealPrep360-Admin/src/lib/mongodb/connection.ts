import mongoose from 'mongoose';
import { User, Recipe, BlogPost, Feedback } from './schemas';

if (!process.env.MONGODB_URI) {
	throw new Error(
		'Please define the MONGODB_URI environment variable inside .env'
	);
}

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
	conn: typeof mongoose | null;
	promise: Promise<typeof mongoose> | null;
}

declare global {
	var mongoose: MongooseCache;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
	global.mongoose = cached;
}

async function connectDB() {
	if (cached.conn) {
		return cached.conn;
	}

	if (!cached.promise) {
		const opts = {
			bufferCommands: false,
			serverSelectionTimeoutMS: 5000,
			heartbeatFrequencyMS: 10000,
			retryWrites: true,
			retryReads: true,
			maxPoolSize: 10,
			minPoolSize: 5,
			connectTimeoutMS: 10000,
			socketTimeoutMS: 45000,
			family: 4,
		};

		cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
			User;
			Recipe;
			BlogPost;
			Feedback;

			mongoose.connection.on('error', (err) => {
				console.error('MongoDB connection error:', err);
				cached.conn = null;
				cached.promise = null;
			});

			mongoose.connection.on('disconnected', () => {
				console.warn('MongoDB disconnected. Attempting to reconnect...');
				cached.conn = null;
				cached.promise = null;
			});

			mongoose.connection.on('reconnected', () => {
				console.info('MongoDB reconnected successfully');
			});

			return mongoose;
		});
	}

	try {
		cached.conn = await cached.promise;
	} catch (e) {
		cached.promise = null;
		console.error('Failed to connect to MongoDB:', e);
		throw e;
	}

	return cached.conn;
}

export default connectDB;
