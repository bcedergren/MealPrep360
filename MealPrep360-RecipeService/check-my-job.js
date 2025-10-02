#!/usr/bin/env node

import https from 'https';
import http from 'http';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE_URL =
	process.env.API_BASE_URL || 'https://mealprep360-recipe-service.vercel.app';

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

// Main function
async function checkMyJob() {
	console.log('🔍 Checking My Specific Job...\n');

	// Your specific job ID
	const jobId = '2bea05f8-b9f0-461e-9345-e7b45528c8d1';

	console.log(`\n${'='.repeat(50)}`);
	console.log(`Checking Job: ${jobId}`);
	console.log(`${'='.repeat(50)}`);

	// Check status
	const status = await checkJobStatus(jobId);

	if (status && status.job) {
		console.log(`\n📋 Job Details:`);
		console.log(`   ID: ${status.job.id}`);
		console.log(`   Type: ${status.job.type}`);
		console.log(`   Status: ${status.job.status}`);
		console.log(`   Progress: ${status.job.progress}/${status.job.total}`);
		console.log(`   Attempts: ${status.job.attempts || 0}`);
		console.log(`   Error: ${status.job.error || 'None'}`);
		console.log(`   Created: ${status.job.createdAt}`);
		console.log(`   Updated: ${status.job.updatedAt}`);

		if (status.job.data) {
			console.log(`   Data: ${JSON.stringify(status.job.data, null, 2)}`);
		}
	} else {
		console.log('❌ Could not retrieve job status');
	}

	console.log('\n✅ Check completed!');
}

// Run the check
checkMyJob().catch(console.error);
