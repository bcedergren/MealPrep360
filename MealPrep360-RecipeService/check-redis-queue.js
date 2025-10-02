import { createClient } from 'redis';
import { config } from './dist/config.js';

async function checkRedisQueue() {
	const redis = createClient({
		username: process.env.REDIS_USER,
		password: process.env.REDIS_PASSWORD,
		socket: {
			host: process.env.REDIS_HOST,
			port: Number(process.env.REDIS_PORT),
		},
	});

	try {
		await redis.connect();
		console.log('Connected to Redis');

		const QUEUE_KEY = `${config.queue.name}:queue`;
		console.log('Checking queue:', QUEUE_KEY);

		// Get queue length
		const queueLength = await redis.lLen(QUEUE_KEY);
		console.log(`Queue length: ${queueLength}`);

		if (queueLength > 0) {
			// Peek at the first few messages without removing them
			const messages = await redis.lRange(QUEUE_KEY, 0, 4);
			console.log('Messages in queue:');
			messages.forEach((message, index) => {
				try {
					const parsed = JSON.parse(message);
					console.log(
						`  ${index + 1}. Job ID: ${parsed.jobId}, Season: ${parsed.season}`
					);
				} catch (e) {
					console.log(`  ${index + 1}. Raw message: ${message}`);
				}
			});
		} else {
			console.log('Queue is empty');
		}
	} catch (error) {
		console.error('Error checking Redis queue:', error);
	} finally {
		await redis.disconnect();
	}
}

checkRedisQueue();
