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

// Retry a failed job
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
async function retryAndMonitor() {
	console.log('🔄 Retrying and Monitoring Failed Job...\n');

	// Your specific job ID
	const jobId = '2bea05f8-b9f0-461e-9345-e7b45528c8d1';

	// Check initial status
	console.log('📋 Initial job status:');
	const initialStatus = await checkJobStatus(jobId);

	if (
		initialStatus &&
		initialStatus.job &&
		initialStatus.job.status === 'failed'
	) {
		console.log('✅ Job is in failed status, proceeding with retry...');

		// Retry the job
		console.log('\n🔄 Retrying job...');
		const retryResult = await retryJob(jobId);

		if (retryResult && retryResult.status === 'accepted') {
			console.log('✅ Job retry accepted!');

			// Wait a moment for the job to start
			console.log('⏳ Waiting 10 seconds for job to start...');
			await new Promise((resolve) => setTimeout(resolve, 10000));

			// Monitor the job
			await monitorJob(jobId, 300000); // Monitor for 5 minutes
		} else {
			console.log('❌ Job retry failed or not accepted');
		}
	} else {
		console.log('❌ Job is not in failed status or could not be retrieved');
	}

	console.log('\n✅ Retry and monitoring completed!');
}

// Run the retry and monitoring
retryAndMonitor().catch(console.error);
