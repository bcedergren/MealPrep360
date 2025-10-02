#!/usr/bin/env node

import https from 'https';
import http from 'http';

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'b7e2e1c2-8a4b-4e2a-9c1d-7f3e2a1b5c6d';

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

// Create a new generation request
async function createNewGeneration(season = 'spring') {
	console.log(`🚀 Creating new recipe generation for ${season}...`);
	try {
		const response = await makeRequest(`${API_BASE_URL}/api/generate`, {
			method: 'POST',
			body: JSON.stringify({ season }),
		});

		console.log('✅ Generation response:', response);

		if (
			(response.status === 200 || response.status === 202) &&
			response.data.job
		) {
			console.log(`📋 New job created with ID: ${response.data.job.id}`);
			return response.data.job.id;
		} else {
			console.error('❌ Failed to create new job:', response);
			return null;
		}
	} catch (error) {
		console.error('❌ Error creating generation:', error.message);
		return null;
	}
}

// Monitor job progress
async function monitorJob(jobId, duration = 180000) {
	// 3 minutes
	console.log(`\n👀 Monitoring job ${jobId} for ${duration / 1000} seconds...`);

	const startTime = Date.now();
	const checkInterval = 10000; // Check every 10 seconds

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
						console.log(`🎉 Successfully generated ${job.progress} recipes!`);
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

// Main function
async function testFreshGeneration() {
	console.log('🧪 Testing Fresh Recipe Generation...\n');

	// Create a new generation request
	const jobId = await createNewGeneration('spring');

	if (jobId) {
		// Wait a moment for the job to start
		console.log('⏳ Waiting 10 seconds for job to start...');
		await new Promise((resolve) => setTimeout(resolve, 10000));

		// Monitor the job
		await monitorJob(jobId);
	} else {
		console.log('❌ Could not create new generation job');
	}

	console.log('\n✅ Fresh generation test completed!');
}

// Run the test
testFreshGeneration().catch(console.error);
