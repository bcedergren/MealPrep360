import fetch from 'node-fetch';

const jobId = '8c936cbd-1594-452b-af5b-4cc29ef71d9e';
const API_URL = 'https://recipes.mealprep360.com';

async function testJobStatus() {
	try {
		console.log(`Testing job status for: ${jobId}`);

		const response = await fetch(`${API_URL}/api/generate/status/${jobId}`);

		console.log('Status:', response.status);
		console.log('Headers:', Object.fromEntries(response.headers.entries()));

		const data = await response.text();
		console.log('Response:', data);

		if (response.status === 200) {
			const jobData = JSON.parse(data);
			console.log('\n✅ Job Details:');
			console.log(`- Status: ${jobData.job.status}`);
			console.log(`- Progress: ${jobData.job.progress}/${jobData.job.total}`);
			console.log(`- Type: ${jobData.job.type}`);
		}
	} catch (error) {
		console.log('❌ Error:', error.message);
	}
}

testJobStatus();
