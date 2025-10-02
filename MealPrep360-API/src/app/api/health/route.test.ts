import { GET } from './route';
import { NextRequest } from 'next/server';

describe('/api/health', () => {
	it('should return health status', async () => {
		// Create a mock request
		const request = new NextRequest('http://localhost:3001/api/health');

		// Call the API handler
		const response = await GET(request);

		// Assert the response
		expect(response.status).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty('status');
		expect(data).toHaveProperty('timestamp');
		expect(data.status).toBe('healthy');
	});

	it('should include service information', async () => {
		const request = new NextRequest('http://localhost:3001/api/health');
		const response = await GET(request);
		const data = await response.json();

		expect(data).toHaveProperty('service');
		expect(data.service).toBe('MealPrep360-API');
	});

	it('should include database connection status', async () => {
		const request = new NextRequest('http://localhost:3001/api/health');
		const response = await GET(request);
		const data = await response.json();

		expect(data).toHaveProperty('database');
		expect(data.database).toHaveProperty('status');
	});
});
