#!/usr/bin/env node

import https from 'https';
import http from 'http';

// Configuration
const OPENAI_API_KEY =
	'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';

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
				Authorization: `Bearer ${OPENAI_API_KEY}`,
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

// Test OpenAI API
async function testOpenAI() {
	console.log('🧪 Testing OpenAI API...');

	try {
		const response = await makeRequest(
			'https://api.openai.com/v1/chat/completions',
			{
				method: 'POST',
				body: JSON.stringify({
					model: 'gpt-4-turbo-preview',
					messages: [
						{
							role: 'system',
							content: 'You are a helpful assistant.',
						},
						{
							role: 'user',
							content: 'Say "Hello, OpenAI API is working!"',
						},
					],
					max_tokens: 50,
				}),
			}
		);

		console.log('✅ OpenAI API response:', response);

		if (response.status === 200) {
			console.log('🎉 OpenAI API is working correctly!');
			if (response.data.choices && response.data.choices[0]) {
				console.log(`📝 Response: ${response.data.choices[0].message.content}`);
			}
		} else {
			console.error('❌ OpenAI API error:', response.data);
		}
	} catch (error) {
		console.error('❌ Error testing OpenAI API:', error.message);
	}
}

// Test OpenAI usage/billing
async function checkOpenAIUsage() {
	console.log('\n💰 Checking OpenAI usage...');

	try {
		const response = await makeRequest('https://api.openai.com/v1/usage', {
			method: 'GET',
		});

		console.log('✅ OpenAI usage response:', response);
	} catch (error) {
		console.error('❌ Error checking OpenAI usage:', error.message);
	}
}

// Main function
async function testOpenAIServices() {
	console.log('🔍 Testing OpenAI Services...\n');

	await testOpenAI();
	await checkOpenAIUsage();

	console.log('\n✅ OpenAI testing completed!');
}

// Run the tests
testOpenAIServices().catch(console.error);
