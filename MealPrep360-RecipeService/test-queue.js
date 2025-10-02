import { createClient } from 'redis';
import { config } from './src/config.js';

const redis = createClient({
        username: process.env.REDIS_USER || 'default',
        password: process.env.REDIS_PASSWORD || config.redis.token,
        socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: Number(process.env.REDIS_PORT) || 6379,
        },
});

redis.on('error', (err) => console.log('Redis Client Error', err));

async function test() {
	try {
		await redis.connect();
		console.log('Successfully connected to Redis');

		// Test setting and getting a value
		await redis.set('test-key', 'test-value');
		const value = await redis.get('test-key');
		console.log('Test value:', value);

		// Test queue operations
		const QUEUE_KEY = `${config.queue.name}:queue`;
		const testMessage = JSON.stringify({ jobId: 'test-123', season: 'summer' });

		console.log('Pushing message to queue...');
		await redis.lPush(QUEUE_KEY, testMessage);

		console.log('Reading message from queue...');
		const message = await redis.lPop(QUEUE_KEY);
		console.log('Received message:', message);

		await redis.disconnect();
		console.log('Test completed successfully');
	} catch (error) {
		console.error('Test failed:', error);
	}
}

test();
