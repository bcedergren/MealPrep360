import { GET } from './route';

describe('/api/health', () => {
	it('should return health status', async () => {
		// Call the API handler
		const response = await GET();

		// Assert the response
		expect(response.status).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty('status');
		expect(data).toHaveProperty('timestamp');
		expect(data).toHaveProperty('message');
		expect(data).toHaveProperty('version');
		expect(data.status).toBe('healthy');
		expect(data.message).toBe('API is working');
		expect(data.version).toBe('1.0.0');
	});

	it('should return current timestamp', async () => {
		const beforeCall = new Date().toISOString();
		const response = await GET();
		const afterCall = new Date().toISOString();

		const data = await response.json();

		// Timestamp should be between before and after the call
		expect(data.timestamp).toBeGreaterThanOrEqual(beforeCall);
		expect(data.timestamp).toBeLessThanOrEqual(afterCall);
	});

	it('should return valid JSON response', async () => {
		const response = await GET();

		expect(response.headers.get('content-type')).toContain('application/json');

		// Should not throw when parsing JSON
		expect(() => response.json()).not.toThrow();
	});
});
