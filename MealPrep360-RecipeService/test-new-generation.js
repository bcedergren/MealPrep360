#!/usr/bin/env node

import https from 'https';
import http from 'http';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Make HTTP/HTTPS request
function makeRequest(url, options = {}) {
	return new Promise((resolve, reject) => {
		const urlObj = new URL(url);
		const isHttps = urlObj.protocol === 'https:';
		const client = isHttps ? https : http;

		const requestOptions = {
			hostname: urlObj.hostname,
			port: urlObj.port || (isHttps ? 443 : 80),
			path: urlObj.pathname + urlObj.search,
			method: options.method || 'GET',
			headers: {
				'Content-Type': 'application/json',
				...options.headers,
			},
		};

		const req = client.request(requestOptions, (res) => {
			let data = '';
			res.on('data', (chunk) => {
				data += chunk;
			});
			res.on('end', () => {
				try {
					const jsonData = JSON.parse(data);
					resolve({
						status: res.statusCode,
						data: jsonData,
					});
				} catch (error) {
					resolve({
						status: res.statusCode,
						data: data,
					});
				}
			});
		});

		req.on('error', (error) => {
			reject(error);
		});

		if (options.body) {
			req.write(JSON.stringify(options.body));
		}

		req.end();
	});
}

// Create a new recipe generation job
async function createRecipeJob(season = 'summer') {
	console.log(`🔄 Creating new recipe generation job for ${season}...`);
	try {
		const response = await makeRequest(`${API_BASE_URL}/api/generate`, {
			method: 'POST',
			headers: {
				'x-api-key': process.env.API_KEY,
			},
			body: {
				season: season,
				total: 5, // Start with a smaller number for testing
			},
		});
		console.log('✅ Job creation response:', response);
		return response.data;
	} catch (error) {
		console.error('❌ Error creating job:', error.message);
		return null;
	}
}

// Check job status
async function checkJobStatus(jobId) {
	console.log(`📊 Checking status for job: ${jobId}`);
	try {
		const response = await makeRequest(`${API_BASE_URL}/api/jobs/${jobId}`);
		console.log('✅ Job status response:', response);
		return response.data;
	} catch (error) {
		console.error('❌ Error checking job status:', error.message);
		return null;
	}
}

// Monitor job progress
async function monitorJob(jobId, duration = 300000) {
	// 5 minutes
	console.log(`👀 Monitoring job ${jobId} for ${duration / 1000} seconds...`);

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
async function testNewGeneration() {
	console.log('🧪 Testing New Recipe Generation with Fixed Prompt...\n');

	// Create a new job
	const jobResult = await createRecipeJob('summer');

	if (jobResult && jobResult.status === 'accepted' && jobResult.job) {
		console.log('✅ New job created successfully!');
		console.log(`📋 Job ID: ${jobResult.job.id}`);
		console.log(`📋 Season: ${jobResult.job.season}`);
		console.log(`📋 Total: ${jobResult.job.total}`);

		// Wait a moment for the job to start
		console.log('⏳ Waiting 10 seconds for job to start...');
		await new Promise((resolve) => setTimeout(resolve, 10000));

		// Monitor the job
		await monitorJob(jobResult.job.id, 300000); // Monitor for 5 minutes
	} else {
		console.log('❌ Failed to create new job');
	}

	console.log('\n✅ Test completed!');
}

// Run the test
testNewGeneration().catch(console.error);
