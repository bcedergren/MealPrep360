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

// Test the custom GPT
async function testCustomGPT() {
	console.log('🧪 Testing Custom GPT Integration...\n');

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
	console.log('\n🚀 Step 2: Testing recipe generation with custom GPT...');
	try {
		const response = await makeRequest(`${API_BASE_URL}/api/generate`, {
			method: 'POST',
			body: JSON.stringify({ season: 'winter' }),
		});

		console.log('✅ Generation response:', response);

		if (response.status === 200 && response.data.job) {
			console.log(`🎉 SUCCESS! Job created with ID: ${response.data.job.id}`);
			console.log('✅ Recipe generation is working with the custom GPT!');

			// Monitor the job to see if it progresses
			console.log('\n👀 Step 3: Monitoring job progress...');
			await monitorJob(response.data.job.id);
		} else if (
			response.status === 500 &&
			response.data.message &&
			response.data.message.includes('Too many recipe generation failures')
		) {
			console.log(
				'❌ Still getting the same error - need to deploy the Spoonacular fix first.'
			);
			console.log(
				'💡 Deploy the code changes to fix the Spoonacular issue, then the custom GPT will work.'
			);
		} else {
			console.log('⚠️ Unexpected response:', response);
		}
	} catch (error) {
		console.error('❌ Generation test failed:', error.message);
	}

	console.log('\n✅ Custom GPT test completed!');
}

// Monitor job progress
async function monitorJob(jobId, duration = 60000) {
	// 60 seconds
	console.log(`👀 Monitoring job ${jobId} for ${duration / 1000} seconds...`);

	const startTime = Date.now();
	const checkInterval = 5000; // Check every 5 seconds

	const interval = setInterval(async () => {
		const elapsed = Date.now() - startTime;
		if (elapsed >= duration) {
			clearInterval(interval);
			console.log('⏰ Monitoring period ended');
			return;
		}

		try {
			const response = await makeRequest(`${API_BASE_URL}/api/jobs/${jobId}`);
			if (response.status === 200 && response.data.job) {
				const job = response.data.job;
				console.log(
					`📊 [${Math.floor(elapsed / 1000)}s] Progress: ${job.progress}/${job.total} (${job.status})`
				);

				if (job.error) {
					console.log(`❌ Error: ${job.error}`);
				}

				// If job completed or failed, stop monitoring
				if (job.status === 'completed' || job.status === 'failed') {
					clearInterval(interval);
					console.log(`🏁 Job ${job.status} - stopping monitoring`);

					if (job.status === 'completed') {
						console.log(
							`🎉 Successfully generated ${job.progress} recipes with custom GPT!`
						);
					} else {
						console.log(`💥 Job failed: ${job.error}`);
					}
				}
			} else {
				console.log(
					`⚠️ [${Math.floor(elapsed / 1000)}s] Could not get job status`
				);
			}
		} catch (error) {
			console.log(
				`⚠️ [${Math.floor(elapsed / 1000)}s] Error checking status: ${error.message}`
			);
		}
	}, checkInterval);
}

// Run the test
testCustomGPT().catch(console.error);
