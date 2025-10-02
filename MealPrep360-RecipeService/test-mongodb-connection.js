import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testMongoDBConnection() {
	console.log('Testing MongoDB Atlas connection...');
	console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');

	if (!process.env.MONGODB_URI) {
		console.error('❌ MONGODB_URI environment variable is not set');
		return;
	}

	const startTime = Date.now();

	try {
		// Test connection with shorter timeout
		const connectionOptions = {
			serverSelectionTimeoutMS: 5000,
			connectTimeoutMS: 5000,
			socketTimeoutMS: 5000,
			maxPoolSize: 1,
			minPoolSize: 1,
		};

		console.log('Attempting to connect...');
		await mongoose.connect(process.env.MONGODB_URI, connectionOptions);

		const endTime = Date.now();
		const duration = endTime - startTime;

		console.log(`✅ Successfully connected to MongoDB Atlas in ${duration}ms`);
		console.log('Connection state:', mongoose.connection.readyState);

		// Test a simple query
		console.log('Testing a simple query...');
		const result = await mongoose.connection.db.admin().ping();
		console.log('Ping result:', result);

		// Check if we can access the database
		const collections = await mongoose.connection.db
			.listCollections()
			.toArray();
		console.log(
			'Available collections:',
			collections.map((c) => c.name)
		);
	} catch (error) {
		const endTime = Date.now();
		const duration = endTime - startTime;

		console.error(`❌ Failed to connect after ${duration}ms:`);
		console.error('Error:', error.message);

		if (error.message.includes('authentication')) {
			console.log(
				'💡 This looks like an authentication issue. Check your username/password in the connection string.'
			);
		} else if (error.message.includes('timeout')) {
			console.log(
				'💡 This looks like a network timeout. Check your internet connection and Atlas network settings.'
			);
		} else if (error.message.includes('ENOTFOUND')) {
			console.log(
				'💡 This looks like a DNS resolution issue. Check your connection string format.'
			);
		}
	} finally {
		// Close the connection
		if (mongoose.connection.readyState === 1) {
			await mongoose.disconnect();
			console.log('Connection closed');
		}
	}
}

testMongoDBConnection();
