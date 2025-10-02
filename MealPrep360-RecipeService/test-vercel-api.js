import fetch from 'node-fetch';

const API_URL = 'https://recipes.mealprep360.com';

async function testVercelAPI() {
	console.log('🔍 Testing Vercel API Endpoints\n');

	// Test 1: Health Check
	console.log('1️⃣ Testing Health Endpoint...');
	try {
		const healthResponse = await fetch(`${API_URL}/api/health`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		console.log(`Status: ${healthResponse.status}`);
		console.log(
			`Headers:`,
			Object.fromEntries(healthResponse.headers.entries())
		);

		if (healthResponse.ok) {
			const healthData = await healthResponse.json();
			console.log(
				'✅ Health Check Response:',
				JSON.stringify(healthData, null, 2)
			);
		} else {
			const errorText = await healthResponse.text();
			console.log('❌ Health Check Error:', errorText);
		}
	} catch (error) {
		console.log('❌ Health Check Failed:', error.message);
	}

	console.log('\n' + '='.repeat(50) + '\n');

	// Test 2: Job Status (should fail gracefully)
	console.log('2️⃣ Testing Job Status Endpoint...');
	try {
		const jobResponse = await fetch(
			`${API_URL}/api/generate/status/test-job-id`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);

		console.log(`Status: ${jobResponse.status}`);
		console.log(`Headers:`, Object.fromEntries(jobResponse.headers.entries()));

		if (jobResponse.ok) {
			const jobData = await jobResponse.json();
			console.log('✅ Job Status Response:', JSON.stringify(jobData, null, 2));
		} else {
			const errorText = await jobResponse.text();
			console.log('❌ Job Status Error:', errorText);
		}
	} catch (error) {
		console.log('❌ Job Status Failed:', error.message);
	}

	console.log('\n' + '='.repeat(50) + '\n');

	// Test 3: Recipe Generation (with API key)
	console.log('3️⃣ Testing Recipe Generation Endpoint...');
	try {
		const generateResponse = await fetch(`${API_URL}/api/recipe/generate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				season: 'summer',
			}),
		});

		console.log(`Status: ${generateResponse.status}`);
		console.log(
			`Headers:`,
			Object.fromEntries(generateResponse.headers.entries())
		);

		if (generateResponse.ok) {
			const generateData = await generateResponse.json();
			console.log(
				'✅ Recipe Generation Response:',
				JSON.stringify(generateData, null, 2)
			);
		} else {
			const errorText = await generateResponse.text();
			console.log('❌ Recipe Generation Error:', errorText);
		}
	} catch (error) {
		console.log('❌ Recipe Generation Failed:', error.message);
	}

	console.log('\n' + '='.repeat(50) + '\n');

	// Test 4: Root endpoint
	console.log('4️⃣ Testing Root Endpoint...');
	try {
		const rootResponse = await fetch(`${API_URL}/`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		console.log(`Status: ${rootResponse.status}`);
		console.log(`Headers:`, Object.fromEntries(rootResponse.headers.entries()));

		if (rootResponse.ok) {
			const rootData = await rootResponse.json();
			console.log('✅ Root Response:', JSON.stringify(rootData, null, 2));
		} else {
			const errorText = await rootResponse.text();
			console.log('❌ Root Error:', errorText);
		}
	} catch (error) {
		console.log('❌ Root Failed:', error.message);
	}

	console.log('\n📋 SUMMARY:');
	console.log(
		'This test shows which endpoints are working vs failing on Vercel.'
	);
	console.log('Look for x-vercel-error headers to identify specific issues.');
}

testVercelAPI().catch(console.error);
