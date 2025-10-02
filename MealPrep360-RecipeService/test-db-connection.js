#!/usr/bin/env node

import mongoose from 'mongoose';

// Test database connection
async function testDatabaseConnection() {
	console.log('🔍 Testing database connection...');

	// You'll need to replace this with your actual MongoDB Atlas connection string
	const MONGODB_URI =
		process.env.MONGODB_URI ||
		'mongodb+srv://***:***@cluster0.6wusxkb.mongodb.net/mealprep360?retryWrites=true&w=majority&appName=Cluster0';

	if (!MONGODB_URI || MONGODB_URI.includes('***')) {
		console.error(
			'❌ Please set MONGODB_URI environment variable with your actual connection string'
		);
		return;
	}

	try {
		console.log('📡 Attempting to connect to MongoDB...');

		// Set connection options
		const options = {
			bufferCommands: true,
			maxPoolSize: 10,
			minPoolSize: 2,
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 10000,
			connectTimeoutMS: 5000,
			heartbeatFrequencyMS: 5000,
			retryWrites: true,
			retryReads: true,
			waitQueueTimeoutMS: 5000,
		};

		// Connect to MongoDB
		await mongoose.connect(MONGODB_URI, options);

		console.log('✅ Successfully connected to MongoDB!');
		console.log(`📊 Connection state: ${mongoose.connection.readyState}`);
		console.log(`🏠 Host: ${mongoose.connection.host}`);
		console.log(`📁 Database: ${mongoose.connection.name}`);

		// Test a simple query
		console.log('🧪 Testing database query...');
		const collections = await mongoose.connection.db
			.listCollections()
			.toArray();
		console.log(
			`📚 Found ${collections.length} collections:`,
			collections.map((c) => c.name)
		);

		// Test Job model query
		try {
			const { Job } = await import('./dist/models/job.js');
			const jobCount = await Job.countDocuments();
			console.log(`📋 Found ${jobCount} jobs in database`);
		} catch (error) {
			console.log(
				'⚠️ Could not query Job model (this is normal if models are not compiled)'
			);
		}

		// Test Recipe model query
		try {
			const { Recipe } = await import('./dist/models/recipe.js');
			const recipeCount = await Recipe.countDocuments();
			console.log(`🍳 Found ${recipeCount} recipes in database`);
		} catch (error) {
			console.log(
				'⚠️ Could not query Recipe model (this is normal if models are not compiled)'
			);
		}
	} catch (error) {
		console.error('❌ Database connection failed:', error.message);

		if (error.message.includes('bad auth')) {
			console.error(
				'🔐 Authentication failed - check your username and password'
			);
		} else if (error.message.includes('ECONNREFUSED')) {
			console.error(
				'🌐 Connection refused - check your connection string and network'
			);
		} else if (error.message.includes('ENOTFOUND')) {
			console.error('🔍 Host not found - check your connection string');
		} else if (error.message.includes('ETIMEDOUT')) {
			console.error(
				'⏰ Connection timeout - check your network and firewall settings'
			);
		}

		console.error('🔧 Troubleshooting tips:');
		console.error('1. Verify your MongoDB Atlas connection string');
		console.error('2. Check if your IP is whitelisted in MongoDB Atlas');
		console.error('3. Verify your database user credentials');
		console.error('4. Check if the database exists');
	} finally {
		// Close the connection
		if (mongoose.connection.readyState === 1) {
			await mongoose.disconnect();
			console.log('🔌 Database connection closed');
		}
	}
}

// Run the test
testDatabaseConnection().catch(console.error);
