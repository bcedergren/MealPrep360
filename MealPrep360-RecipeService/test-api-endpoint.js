import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

const API_URL = 'https://recipes.mealprep360.com';
const API_KEY = process.env.API_KEY;

async function testEndpoint(endpoint, options = {}) {
	const url = `${API_URL}${endpoint}`;
	console.log(`Testing ${url}...`);

	try {
		const response = await fetch(url, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': API_KEY,
				...options.headers,
			},
		});

		const data = await response.json();
		console.log(`Status: ${response.status}`);
		console.log('Response:', JSON.stringify(data, null, 2));
		return { success: response.ok, status: response.status, data };
	} catch (error) {
		console.error(`Error testing ${endpoint}:`, error.message);
		return { success: false, error: error.message };
	}
}

async function runTests() {
	console.log('Testing Preview Deployment\n');

	// Test health endpoint
	console.log('1. Testing health endpoint');
	await testEndpoint('/api/health');

	// Test recipe generation
	console.log('\n2. Testing recipe generation');
	const generateResult = await testEndpoint('/api/generate', {
		method: 'POST',
		body: JSON.stringify({ season: 'summer' }),
	});

	if (generateResult.success) {
		const jobId = generateResult.data.job.id;
		console.log(`\n3. Testing job status for ${jobId}`);
		await testEndpoint(`/api/generate/status/${jobId}`);
	}
}

runTests().catch(console.error);
