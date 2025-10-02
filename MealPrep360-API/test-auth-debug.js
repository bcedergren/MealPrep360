const https = require('https');
const http = require('http');

// Test authentication endpoint
async function testAuth() {
	console.log('🔍 Testing authentication setup...\n');

	// Test without authentication (should fail)
	console.log('1. Testing without authentication (expected: 401):');
	try {
		const response = await makeRequest(
			'http://localhost:3001/api/test-auth',
			'GET'
		);
		console.log('Response:', response);
	} catch (error) {
		console.log('Expected error:', error.message);
	}

	console.log('\n2. Testing health endpoint (should work without auth):');
	try {
		const response = await makeRequest(
			'http://localhost:3001/api/health',
			'GET'
		);
		console.log('Health check response:', response);
	} catch (error) {
		console.log('Health check error:', error.message);
	}

	console.log('\n📋 Next steps:');
	console.log('1. Ensure your frontend includes the Authorization header');
	console.log('2. Test with a valid Clerk token:');
	console.log('   curl -X GET http://localhost:3001/api/test-auth \\');
	console.log('     -H "Authorization: Bearer YOUR_CLERK_TOKEN"');
	console.log('\n3. Check environment variables:');
	console.log('   - CLERK_SECRET_KEY should be set');
	console.log('   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY should be set');
}

function makeRequest(url, method) {
	return new Promise((resolve, reject) => {
		const client = url.startsWith('https') ? https : http;

		const req = client.request(url, { method }, (res) => {
			let data = '';
			res.on('data', (chunk) => (data += chunk));
			res.on('end', () => {
				try {
					const jsonData = JSON.parse(data);
					resolve({ status: res.statusCode, data: jsonData });
				} catch (e) {
					resolve({ status: res.statusCode, data: data });
				}
			});
		});

		req.on('error', reject);
		req.setTimeout(5000, () => {
			req.destroy();
			reject(new Error('Request timeout'));
		});

		req.end();
	});
}

// Run the test
testAuth().catch(console.error);
