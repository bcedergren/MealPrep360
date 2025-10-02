#!/usr/bin/env node

import https from 'https';
import http from 'http';

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const API_KEY = 'test-api-key-123';

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
async function testHealth() {
	console.log('🔍 Testing API health...');
	try {
		const response = await makeRequest(`${API_BASE_URL}/api/health`);
		console.log('✅ Health check response:', response);
		return response.status === 200;
	} catch (error) {
		console.error('❌ Health check failed:', error.message);
		return false;
	}
}

async function testRecipeGeneration() {
	console.log('\n🚀 Triggering recipe generation...');
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
			console.error('❌ Failed to create job');
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

async function testRecipeHealth() {
	console.log('\n🏥 Testing recipe generation health...');
	try {
		const response = await makeRequest(`${API_BASE_URL}/api/recipes/health`);
		console.log('✅ Recipe health response:', response);
		return response.data;
	} catch (error) {
		console.error('❌ Recipe health check failed:', error.message);
		return null;
	}
}

// Main test function
async function runTests() {
	console.log('🧪 Starting Recipe Generation Tests...\n');

	// Test 1: Health check
	const healthOk = await testHealth();
	if (!healthOk) {
		console.log('❌ Health check failed, stopping tests');
		return;
	}

	// Test 2: Recipe health
	await testRecipeHealth();

	// Test 3: Trigger generation
	const jobId = await testRecipeGeneration();
	if (jobId) {
		// Test 4: Check job status
		await checkJobStatus(jobId);

		// Wait a bit and check again
		console.log('\n⏳ Waiting 5 seconds before checking job status again...');
		await new Promise((resolve) => setTimeout(resolve, 5000));
		await checkJobStatus(jobId);
	}

	console.log('\n✅ Tests completed!');
}

// Run the tests
runTests().catch(console.error);
