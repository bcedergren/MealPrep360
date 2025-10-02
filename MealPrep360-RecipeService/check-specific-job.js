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

// Check specific job status
async function checkJobStatus(jobId) {
	console.log(`\n📊 Checking status for job: ${jobId}`);
	try {
		const response = await makeRequest(`${API_BASE_URL}/api/jobs/${jobId}`);
		console.log('✅ Job status response:', response);
		return response.data;
	} catch (error) {
		console.error('❌ Error checking job status:', error.message);
		return null;
	}
}

// Check detailed job status
async function checkDetailedJobStatus(jobId) {
	console.log(`\n🔍 Checking detailed status for job: ${jobId}`);
	try {
		const response = await makeRequest(
			`${API_BASE_URL}/api/recipes/jobs/${jobId}/detailed`
		);
		console.log('✅ Detailed job status:', response);
		return response.data;
	} catch (error) {
		console.error('❌ Error getting detailed job status:', error.message);
		return null;
	}
}

// Retry a failed job
async function retryJob(jobId) {
	console.log(`\n🔄 Retrying job: ${jobId}`);
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

// Main function
async function analyzePendingJobs() {
	console.log('🔍 Analyzing Pending Jobs...\n');

	// Job IDs from your data
	const jobIds = [
		'a68d5f22-4c42-493f-827c-35fb1844b215', // winter job
		'1734b765-f4ad-4881-be3b-f0cce24d5530', // summer job
	];

	for (const jobId of jobIds) {
		console.log(`\n${'='.repeat(50)}`);
		console.log(`Analyzing Job: ${jobId}`);
		console.log(`${'='.repeat(50)}`);

		// Check basic status
		const status = await checkJobStatus(jobId);

		// Check detailed status
		const detailed = await checkDetailedJobStatus(jobId);

		// If job is stuck, suggest retry
		if (
			status &&
			status.job &&
			status.job.status === 'pending' &&
			status.job.progress < status.job.total
		) {
			console.log(
				`\n⚠️ Job appears to be stuck at ${status.job.progress}/${status.job.total}`
			);
			console.log('💡 Consider retrying this job...');

			// Uncomment the next line if you want to automatically retry
			// await retryJob(jobId);
		}
	}

	console.log('\n✅ Analysis completed!');
}

// Run the analysis
analyzePendingJobs().catch(console.error);
