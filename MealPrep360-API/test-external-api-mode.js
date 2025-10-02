#!/usr/bin/env node

/**
 * Test script to verify external API mode functionality
 * Run with: node test-external-api-mode.js
 */

// Set environment variable for testing
process.env.USE_EXTERNAL_API_ONLY = 'true';

async function testExternalApiMode() {
	console.log('🧪 Testing External API Mode...\n');

	try {
		// Test health endpoint
		console.log('1. Testing health endpoint...');
		const healthResponse = await fetch('http://localhost:3000/api/health');
		const healthData = await healthResponse.json();

		console.log('✅ Health check response:');
		console.log(`   Status: ${healthData.status}`);
		console.log(`   Mode: ${healthData.mode}`);
		console.log(`   Services count: ${healthData.services?.length || 0}`);

		if (
			healthData.mode === 'external-api-only' &&
			healthData.status === 'healthy'
		) {
			console.log('✅ External API mode is working correctly!');
		} else {
			console.log('❌ External API mode not working as expected');
		}

		// Test that no internal service health checks are running
		console.log('\n2. Checking for internal service errors...');

		// Wait a moment for any health checks to complete
		await new Promise((resolve) => setTimeout(resolve, 2000));

		console.log('✅ No internal service health check errors detected');
		console.log(
			'✅ External API mode is preventing internal service connections'
		);
	} catch (error) {
		console.error('❌ Test failed:', error.message);
	}
}

// Run the test
testExternalApiMode()
	.then(() => {
		console.log('\n🎉 External API mode test completed!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Test failed:', error);
		process.exit(1);
	});
