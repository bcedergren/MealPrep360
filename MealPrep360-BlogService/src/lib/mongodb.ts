import mongoose from 'mongoose';

interface MongooseCache {
	conn: typeof mongoose | null;
	promise: Promise<typeof mongoose> | null;
}

declare global {
	var mongoose: MongooseCache | undefined;
}

if (!process.env.MONGODB_URI) {
	throw new Error(
		'Please define the MONGODB_URI environment variable inside .env'
	);
}

const MONGODB_URI = process.env.MONGODB_URI;

// Initialize the cache
const cache: MongooseCache = {
	conn: null,
	promise: null,
};

// Assign to global if not exists
if (!global.mongoose) {
	global.mongoose = cache;
}

async function connectDB(): Promise<typeof mongoose> {
	if (cache.conn) {
		return cache.conn;
	}

	if (!cache.promise) {
		const opts = {
			bufferCommands: false,
		};

		cache.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
			return mongoose;
		});
	}

	try {
		cache.conn = await cache.promise;
	} catch (e) {
		cache.promise = null;
		throw e;
	}

	return cache.conn;
}

export default connectDB;
