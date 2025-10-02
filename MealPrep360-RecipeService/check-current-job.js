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

// Check current job status
async function checkCurrentJob() {
	console.log('🔍 Checking Current Job Status...\n');

	// Check the job ID from the test
	const jobId = '8338a8ff-a606-45c4-8847-ea2848612c2a';

	console.log(`==================================================`);
	console.log(`Checking Job: ${jobId}`);
	console.log(`==================================================\n`);

	try {
		const response = await makeRequest(`${API_BASE_URL}/api/jobs/${jobId}`);
		console.log('✅ Job status response:', response);

		if (response.status === 200 && response.data.job) {
			const job = response.data.job;
			console.log(`\n📊 Job Details:`);
			console.log(`   ID: ${job.id}`);
			console.log(`   Type: ${job.type}`);
			console.log(`   Status: ${job.status}`);
			console.log(`   Progress: ${job.progress}/${job.total}`);
			console.log(`   Season: ${job.season}`);
			console.log(`   Attempts: ${job.attempts}`);
			console.log(`   Created: ${job.createdAt}`);
			console.log(`   Updated: ${job.updatedAt}`);

			if (job.error) {
				console.log(`   Error: ${job.error}`);
			}
		}
	} catch (error) {
		console.error('❌ Error checking job status:', error.message);
	}

	console.log('\n✅ Check completed!');
}

checkCurrentJob();
