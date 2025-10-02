#!/usr/bin/env node

import https from 'https';
import http from 'http';

// Configuration
const API_BASE_URL = 'https://recipes.mealprep360.com';
const API_KEY = 'b7e2e1c2-8a4b-4e2a-9c1d-7f3e2a1b5c6d';

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

// Test the fix
async function testFix() {
	console.log('🧪 Testing the Spoonacular fallback fix...\n');

	// Test 1: Check if the service is responding
	console.log('📋 Step 1: Checking service health...');
	try {
		const healthResponse = await makeRequest(`${API_BASE_URL}/api/health`);
		console.log('✅ Health check response:', healthResponse);
	} catch (error) {
		console.error('❌ Health check failed:', error.message);
		return;
	}

	// Test 2: Try to create a new generation job
	console.log('\n🚀 Step 2: Testing recipe generation...');
	try {
		const response = await makeRequest(`${API_BASE_URL}/api/generate`, {
			method: 'POST',
			body: JSON.stringify({ season: 'autumn' }),
		});

		console.log('✅ Generation response:', response);

		if (response.status === 200 && response.data.job) {
			console.log(`🎉 SUCCESS! Job created with ID: ${response.data.job.id}`);
			console.log(
				'✅ The fix is working! Recipe generation should now work without Spoonacular API key.'
			);
		} else if (
			response.status === 500 &&
			response.data.message &&
			response.data.message.includes('Too many recipe generation failures')
		) {
			console.log(
				'❌ The fix is not working yet - still getting the same error.'
			);
			console.log('💡 You need to deploy the updated code to production.');
		} else {
			console.log('⚠️ Unexpected response:', response);
		}
	} catch (error) {
		console.error('❌ Generation test failed:', error.message);
	}

	console.log('\n✅ Fix test completed!');
}

// Run the test
testFix().catch(console.error);
