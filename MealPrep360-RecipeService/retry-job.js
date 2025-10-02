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

// Retry a job
async function retryJob(jobId) {
	console.log(`🔄 Retrying job: ${jobId}`);
	try {
		const response = await makeRequest(
			`${API_BASE_URL}/api/jobs/${jobId}/retry`,
			{
				method: 'POST',
			}
		);
		console.log('✅ Retry response:', response);
		return response.data;
	} catch (error) {
		console.error('❌ Error retrying job:', error.message);
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
async function monitorJob(jobId, duration = 60000) {
	// 60 seconds
	console.log(`\n👀 Monitoring job ${jobId} for ${duration / 1000} seconds...`);

	const startTime = Date.now();
	const checkInterval = 5000; // Check every 5 seconds

	const interval = setInterval(async () => {
		const elapsed = Date.now() - startTime;
		if (elapsed >= duration) {
			clearInterval(interval);
			console.log('⏰ Monitoring period ended');
			return;
		}

		const status = await checkJobStatus(jobId);
		if (status && status.job) {
			console.log(
				`📊 [${Math.floor(elapsed / 1000)}s] Progress: ${status.job.progress}/${status.job.total} (${status.job.status})`
			);

			// If job completed or failed, stop monitoring
			if (status.job.status === 'completed' || status.job.status === 'failed') {
				clearInterval(interval);
				console.log(`🏁 Job ${status.job.status} - stopping monitoring`);
			}
		}
	}, checkInterval);
}

// Main function
async function retryAndMonitor() {
	console.log('🔄 Retrying and Monitoring Job...\n');

	// Use the winter job (more recent)
	const jobId = 'a68d5f22-4c42-493f-827c-35fb1844b215';

	// Check initial status
	console.log('📋 Initial job status:');
	await checkJobStatus(jobId);

	// Retry the job
	console.log('\n🔄 Retrying job...');
	const retryResult = await retryJob(jobId);

	if (retryResult && retryResult.status === 'accepted') {
		console.log('✅ Job retry accepted!');

		// Wait a moment for the job to start
		console.log('⏳ Waiting 5 seconds for job to start...');
		await new Promise((resolve) => setTimeout(resolve, 5000));

		// Monitor the job
		await monitorJob(jobId, 120000); // Monitor for 2 minutes
	} else {
		console.log('❌ Job retry failed or not accepted');
	}

	console.log('\n✅ Retry and monitoring completed!');
}

// Run the retry and monitoring
retryAndMonitor().catch(console.error);
