#!/usr/bin/env node

import https from 'https';
import http from 'http';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';
import { OpenAI } from 'openai';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

const requiredEnvVars = [
	'MONGODB_URI',
	'REDIS_URL',
	'REDIS_TOKEN',
	'OPENAI_API_KEY',
	'API_KEY',
];

async function checkEnvironment() {
	console.log('Checking environment variables...');
	const missing = requiredEnvVars.filter((v) => !process.env[v]);
	if (missing.length > 0) {
		console.error(
			'❌ Missing required environment variables:',
			missing.join(', ')
		);
		return false;
	}
	console.log('✅ All required environment variables are present');
	return true;
}

async function checkMongoDB() {
	console.log('\nChecking MongoDB connection...');
	const client = new MongoClient(process.env.MONGODB_URI);
	try {
		await client.connect();
		const db = client.db('mealprep360');
		const collections = await db.listCollections().toArray();
		console.log('✅ MongoDB connected successfully');
		console.log('Collections:', collections.map((c) => c.name).join(', '));

		// Check recipes
		const recipes = await db.collection('recipes').countDocuments();
		console.log(`Found ${recipes} recipes in database`);

		return true;
	} catch (error) {
		console.error('❌ MongoDB connection failed:', error.message);
		return false;
	} finally {
		await client.close();
	}
}

async function checkRedis() {
	console.log('\nChecking Redis connection...');
	const redisUrl = process.env.REDIS_URL.replace('rediss//', 'rediss://');
	const client = createClient({
		url: redisUrl,
		socket: {
			tls: true,
			rejectUnauthorized: false, // Only for development/testing
		},
	});

	try {
		await client.connect();
		console.log('✅ Redis connected successfully');

		// Check queue
		const queueLength = await client.lLen('recipe-generation-queue');
		console.log(`Current queue length: ${queueLength}`);

		// Check some basic operations
		await client.set('health-check', 'ok');
		const testValue = await client.get('health-check');
		await client.del('health-check');

		if (testValue === 'ok') {
			console.log('✅ Redis read/write operations successful');
		}

		return true;
	} catch (error) {
		console.error('❌ Redis connection failed:', error.message);
		return false;
	} finally {
		await client.quit();
	}
}

async function checkOpenAI() {
	console.log('\nChecking OpenAI API...');
	try {
		const openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});

		const models = await openai.models.list();
		const hasGPT4 = models.data.some((model) => model.id.includes('gpt-4'));

		if (hasGPT4) {
			console.log('✅ OpenAI API connected successfully (GPT-4 available)');
		} else {
			console.log('⚠️ OpenAI API connected but GPT-4 not available');
		}
		return true;
	} catch (error) {
		console.error('❌ OpenAI API check failed:', error.message);
		return false;
	}
}

async function main() {
	console.log('Production Health Check\n');

	const envOk = await checkEnvironment();
	if (!envOk) {
		console.error(
			'\n❌ Environment check failed. Please set all required variables.'
		);
		process.exit(1);
	}

	const results = await Promise.all([
		checkMongoDB(),
		checkRedis(),
		checkOpenAI(),
	]);

	console.log('\nSummary:');
	if (results.every((r) => r)) {
		console.log('✅ All systems operational');
	} else {
		console.log('❌ Some checks failed');
		process.exit(1);
	}
}

main().catch(console.error);
