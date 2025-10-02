#!/usr/bin/env node

import https from 'https';
import http from 'http';

// Configuration
const API_BASE_URL = 'https://recipes.mealprep360.com';
const API_KEY = 'b7e2e1c2-8a4b-4e2a-9c1d-7f3e2a1b5c6d'; // Correct API key from .env.local

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
	return new Promise((resolve, reject) => {
		const urlObj = new URL(url);
		const isHttps = urlObj.protocol === 'https:';
		const client = isHttps ? https : http;

		const requestOptions = {
			hostname: urlObj.hostname,
			port: urlObj.port,
			path: urlObj.pathname + urlObj.search,
			method: options.method || 'GET',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': API_KEY,
				...options.headers,
			},
		};

		if (options.body) {
			requestOptions.headers['Content-Length'] = Buffer.byteLength(
				options.body
			);
		}

		const req = client.request(requestOptions, (res) => {
			let data = '';
			res.on('data', (chunk) => {
				data += chunk;
			});
			res.on('end', () => {
				try {
					const jsonData = JSON.parse(data);
					resolve({ status: res.statusCode, data: jsonData });
				} catch (e) {
					resolve({ status: res.statusCode, data: data });
				}
			});
		});

		req.on('error', (error) => {
			reject(error);
		});

		if (options.body) {
			req.write(options.body);
		}
		req.end();
	});
}

// Test functions
async function testJobsList() {
	console.log('📋 Testing jobs list...');
	try {
		const response = await makeRequest(`${API_BASE_URL}/api/jobs?limit=5`);
		console.log('✅ Jobs list response:', response);
		return response.data;
	} catch (error) {
		console.error('❌ Jobs list failed:', error.message);
		return null;
	}
}

async function testRecipeGeneration() {
	console.log('\n🚀 Testing recipe generation...');
	try {
		const response = await makeRequest(`${API_BASE_URL}/api/generate`, {
			method: 'POST',
			body: JSON.stringify({ season: 'winter' }),
		});

		console.log('✅ Recipe generation response:', response);

		if (response.status === 200 && response.data.job) {
			console.log(`📋 Job created with ID: ${response.data.job.id}`);
			return response.data.job.id;
		} else {
			console.error('❌ Failed to create job:', response);
			return null;
		}
	} catch (error) {
		console.error('❌ Recipe generation failed:', error.message);
		return null;
	}
}

async function checkJobStatus(jobId) {
	console.log(`\n📊 Checking job status for: ${jobId}`);
	try {
		const response = await makeRequest(`${API_BASE_URL}/api/jobs/${jobId}`);
		console.log('✅ Job status response:', response);
		return response.data;
	} catch (error) {
		console.error('❌ Job status check failed:', error.message);
		return null;
	}
}

async function testSingleRecipeGeneration() {
	console.log('\n🧪 Testing single recipe generation...');
	try {
		const response = await makeRequest(
			`${API_BASE_URL}/api/test/generate-recipe`,
			{
				method: 'POST',
				body: JSON.stringify({ season: 'winter' }),
			}
		);

		console.log('✅ Single recipe generation response:', response);
		return response.data;
	} catch (error) {
		console.error('❌ Single recipe generation failed:', error.message);
		return null;
	}
}

async function testForceGeneration() {
	console.log('\n⚡ Testing force recipe generation...');
	try {
		const response = await makeRequest(
			`${API_BASE_URL}/api/recipes/force-generate`,
			{
				method: 'POST',
				body: JSON.stringify({ season: 'winter' }),
			}
		);

		console.log('✅ Force generation response:', response);
		return response.data;
	} catch (error) {
		console.error('❌ Force generation failed:', error.message);
		return null;
	}
}

// Main test function
async function runProductionTests() {
	console.log('🧪 Starting Production Recipe Generation Tests...\n');

	// Test 1: Check existing jobs
	const jobs = await testJobsList();

	// Test 2: Try single recipe generation first
	const singleRecipe = await testSingleRecipeGeneration();

	// Test 3: Try force generation
	const forceGeneration = await testForceGeneration();

	// Test 4: Try regular generation
	const jobId = await testRecipeGeneration();

	if (jobId) {
		// Test 5: Check job status
		await checkJobStatus(jobId);

		// Wait a bit and check again
		console.log('\n⏳ Waiting 10 seconds before checking job status again...');
		await new Promise((resolve) => setTimeout(resolve, 10000));
		await checkJobStatus(jobId);
	}

	console.log('\n✅ Production tests completed!');

	// Summary
	console.log('\n📋 Summary:');
	console.log(`- Jobs List: ${jobs ? '✅ OK' : '❌ FAILED'}`);
	console.log(`- Single Recipe: ${singleRecipe ? '✅ OK' : '❌ FAILED'}`);
	console.log(`- Force Generation: ${forceGeneration ? '✅ OK' : '❌ FAILED'}`);
	console.log(`- Regular Generation: ${jobId ? '✅ OK' : '❌ FAILED'}`);
}

// Run the tests
runProductionTests().catch(console.error);
