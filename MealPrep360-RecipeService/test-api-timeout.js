import fetch from 'node-fetch';

async function testApiTimeout() {
	const startTime = Date.now();

	try {
		const response = await fetch('http://localhost:3000/api/generate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': process.env.API_KEY || 'test-key',
			},
			body: JSON.stringify({
				season: 'summer',
			}),
		});

		const endTime = Date.now();
		const duration = endTime - startTime;

		console.log(`API Response Time: ${duration}ms`);
		console.log(`Status: ${response.status}`);

		if (response.ok) {
			const data = await response.json();
			console.log('Response:', JSON.stringify(data, null, 2));
		} else {
			const errorText = await response.text();
			console.log('Error Response:', errorText);
		}

		if (duration > 8000) {
			console.log(
				'⚠️  WARNING: Response time is getting close to Vercel timeout (10s)'
			);
		} else {
			console.log('✅ Response time is acceptable');
		}
	} catch (error) {
		const endTime = Date.now();
		const duration = endTime - startTime;
		console.error(`❌ Error after ${duration}ms:`, error.message);
	}
}

testApiTimeout();
