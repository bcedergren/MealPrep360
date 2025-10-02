import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// Optional debug logging
const DEBUG_MONGODB = process.env.DEBUG_MONGODB === 'true';
if (DEBUG_MONGODB) {
        console.log('MongoDB URI exists:', !!MONGODB_URI);
        console.log('MongoDB URI length:', MONGODB_URI?.length);
}

if (!MONGODB_URI) {
	throw new Error(
		'Please define the MONGODB_URI environment variable inside .env'
	);
}

interface MongooseCache {
	conn: typeof mongoose | null;
	promise: Promise<typeof mongoose> | null;
}

declare global {
	// eslint-disable-next-line no-var
	var mongoose: MongooseCache | undefined;
}

// Extend the global interface
interface Global {
	mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = (global as Global).mongoose || {
	conn: null,
	promise: null,
};

if (!(global as Global).mongoose) {
	(global as Global).mongoose = cached;
}

async function connectDB() {
	if (cached.conn) {
		return cached.conn;
	}

	if (!cached.promise) {
		const opts = {
			bufferCommands: false,
		};

		cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
			return mongoose;
		});
	}

	try {
		cached.conn = await cached.promise;
	} catch (e) {
		cached.promise = null;
		throw e;
	}

	return cached.conn;
}

export default connectDB;
