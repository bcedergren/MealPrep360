require('dotenv').config({ path: '.env.local' });

const BASE_URL = 'http://localhost:3000';
const API_KEY = process.env.API_KEY;

// Test results tracker
const results = {
	passed: 0,
	failed: 0,
	tests: [],
};

// Helper function to make API calls
async function testEndpoint(
	method,
	endpoint,
	body = null,
	expectedStatus = 200
) {
	try {
		const url = `${BASE_URL}${endpoint}`;
		const options = {
			method,
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': API_KEY,
			},
		};

		if (body) {
			options.body = JSON.stringify(body);
		}

		console.log(`🧪 Testing ${method} ${endpoint}`);
		const response = await fetch(url, options);
		const responseData = await response.text();

		let parsedData;
		try {
			parsedData = JSON.parse(responseData);
		} catch {
			parsedData = responseData;
		}

		const success = response.status === expectedStatus;
		const result = {
			method,
			endpoint,
			status: response.status,
			expectedStatus,
			success,
			response: parsedData,
			error: success
				? null
				: `Expected ${expectedStatus}, got ${response.status}`,
		};

		results.tests.push(result);

		if (success) {
			console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`);
			results.passed++;
		} else {
			console.log(
				`❌ ${method} ${endpoint} - Status: ${response.status} (expected ${expectedStatus})`
			);
			console.log(`   Response: ${JSON.stringify(parsedData, null, 2)}`);
			results.failed++;
		}

		return { success, response: parsedData, status: response.status };
	} catch (error) {
		console.log(`💥 ${method} ${endpoint} - Error: ${error.message}`);
		results.tests.push({
			method,
			endpoint,
			success: false,
			error: error.message,
		});
		results.failed++;
		return { success: false, error: error.message };
	}
}

async function runAllTests() {
	console.log('🚀 Testing All API Routes');
	console.log('==========================\n');

	// Test 1: Root endpoint
	await testEndpoint('GET', '/');

	// Test 2: Health check
	await testEndpoint('GET', '/api/health');

	// Test 3: System metrics
	await testEndpoint('GET', '/api/metrics');

	// Test 4: Performance metrics
	await testEndpoint('GET', '/api/performance');

	// Test 5: List all jobs
	const jobsResult = await testEndpoint('GET', '/api/jobs');
	let jobId = null;
	if (
		jobsResult.success &&
		jobsResult.response.jobs &&
		jobsResult.response.jobs.length > 0
	) {
		jobId = jobsResult.response.jobs[0].id;
	}

	// Test 6: Get specific job (if we have one)
	if (jobId) {
		await testEndpoint('GET', `/api/jobs/${jobId}`);
	}

	// Test 7: List recipes
	const recipesResult = await testEndpoint('GET', '/api/recipes');

	// Test 8: List recipes with pagination
	await testEndpoint('GET', '/api/recipes?page=1&limit=5');

	// Test 9: Search recipes
	await testEndpoint('GET', '/api/recipes?search=stew');

	// Test 10: Filter recipes by season
	await testEndpoint('GET', '/api/recipes?season=winter');

	// Test 11: Test recipe generation (single recipe)
	const testRecipeBody = {
		season: 'winter',
		recipeName: 'Test Beef Stew',
	};
	await testEndpoint('POST', '/api/test/generate-recipe', testRecipeBody);

	// Test 12: Create a recipe generation job
	const generateBody = {
		season: 'winter',
		count: 5,
	};
	const generateResult = await testEndpoint(
		'POST',
		'/api/generate',
		generateBody
	);
	let newJobId = null;
	if (generateResult.success && generateResult.response.job) {
		newJobId = generateResult.response.job.id;
	}

	// Test 13: Check job status (if we created a job)
	if (newJobId) {
		await testEndpoint('GET', `/api/generate/status/${newJobId}`);
	}

	// Test 14: Recipe health check
	await testEndpoint('GET', '/api/recipes/health');

	// Test 15: Audit a recipe
	const auditBody = {
		title: 'Test Recipe',
		description: 'A test recipe for auditing',
		ingredients: [
			{ name: 'beef', amount: '1', unit: 'lb' },
			{ name: 'carrots', amount: '2', unit: 'cups' },
		],
		prepInstructions: ['Cut beef', 'Chop carrots'],
		cookingInstructions: ['Cook beef', 'Add carrots'],
		prepTime: 30,
		cookTime: 60,
		servings: 4,
		season: 'winter',
	};
	await testEndpoint('POST', '/api/recipes/audit-recipe', auditBody);

	// Test 16: List traces
	await testEndpoint('GET', '/api/traces');

	// Test 17: Force recipe generation
	const forceGenerateBody = {
		season: 'winter',
	};
	await testEndpoint('POST', '/api/recipes/force-generate', forceGenerateBody);

	// Test 18: Validate recipes
	await testEndpoint('POST', '/api/recipes/validate', {});

	// Summary
	console.log('\n📊 TEST RESULTS SUMMARY');
	console.log('========================');
	console.log(`✅ Passed: ${results.passed}`);
	console.log(`❌ Failed: ${results.failed}`);
	console.log(
		`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%\n`
	);

	// Show failed tests
	const failedTests = results.tests.filter((t) => !t.success);
	if (failedTests.length > 0) {
		console.log('❌ FAILED TESTS:');
		console.log('================');
		failedTests.forEach((test) => {
			console.log(`- ${test.method} ${test.endpoint}`);
			if (test.error) {
				console.log(`  Error: ${test.error}`);
			}
			if (test.status) {
				console.log(
					`  Status: ${test.status} (expected ${test.expectedStatus})`
				);
			}
		});
		console.log('');
	}

	// Show successful tests
	console.log('✅ SUCCESSFUL TESTS:');
	console.log('====================');
	const passedTests = results.tests.filter((t) => t.success);
	passedTests.forEach((test) => {
		console.log(`- ${test.method} ${test.endpoint} (${test.status})`);
	});

	return results;
}

// Check if server is running first
async function checkServer() {
	try {
		console.log('🔍 Checking if server is running...');
		const response = await fetch(`${BASE_URL}/api/health`, {
			headers: { 'x-api-key': API_KEY },
		});

		if (response.ok) {
			console.log('✅ Server is running and responding\n');
			return true;
		} else {
			console.log(`❌ Server responded with status: ${response.status}\n`);
			return false;
		}
	} catch (error) {
		console.log(`❌ Server is not accessible: ${error.message}`);
		console.log('💡 Make sure to start the server first with: npm start\n');
		return false;
	}
}

// Main execution
async function main() {
	const serverRunning = await checkServer();

	if (!serverRunning) {
		console.log('Please start the server first and try again.');
		process.exit(1);
	}

	await runAllTests();
}

main().catch(console.error);
