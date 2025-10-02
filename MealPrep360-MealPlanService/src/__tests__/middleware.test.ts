import { middleware } from '../middleware';
import { NextRequest } from 'next/server';

describe('Middleware', () => {
	beforeEach(() => {
		process.env.API_TOKEN = 'test-token';
	});

	it('should allow access to health endpoint', () => {
		const request = new NextRequest(
			new Request('http://localhost:3000/api/health')
		);
		const response = middleware(request);
		expect(response).toBeDefined();
	});

	it('should allow access to other routes', () => {
		const request = new NextRequest(
			new Request('http://localhost:3000/dashboard')
		);
		const response = middleware(request);
		expect(response).toBeDefined();
	});

	it('should skip internal paths', () => {
		const request = new NextRequest(
			new Request('http://localhost:3000/_next/static/test.js')
		);
		const response = middleware(request);
		expect(response).toBeDefined();
	});
});
