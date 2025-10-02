import { GET } from './route';
import { NextRequest } from 'next/server';

// Mock the MongoDB client
jest.mock('@/app/lib/mongodb', () => ({
	getMongoClient: jest.fn(),
}));

// Mock headers
jest.mock('next/headers', () => ({
	headers: jest.fn(),
}));

const mockGetMongoClient = require('@/app/lib/mongodb').getMongoClient;
const mockHeaders = require('next/headers').headers;

describe('/api/health', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		process.env.API_TOKEN = 'test-api-token';
		process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
	});

	afterEach(() => {
		delete process.env.API_TOKEN;
		delete process.env.MONGODB_URI;
	});

	it('should return 401 when no authorization header is provided', async () => {
		mockHeaders.mockReturnValue({
			get: jest.fn().mockReturnValue(null),
		});

		const response = await GET();
		const data = await response.json();

		expect(response.status).toBe(401);
		expect(data.error).toBe('Missing or invalid authorization header');
	});

	it('should return 401 when authorization header is invalid', async () => {
		mockHeaders.mockReturnValue({
			get: jest.fn().mockReturnValue('Invalid header'),
		});

		const response = await GET();
		const data = await response.json();

		expect(response.status).toBe(401);
		expect(data.error).toBe('Missing or invalid authorization header');
	});

	it('should return 401 when API token is invalid', async () => {
		mockHeaders.mockReturnValue({
			get: jest.fn().mockReturnValue('Bearer invalid-token'),
		});

		const response = await GET();
		const data = await response.json();

		expect(response.status).toBe(401);
		expect(data.error).toBe('Invalid API token');
	});

	it('should return healthy status when all services are working', async () => {
		mockHeaders.mockReturnValue({
			get: jest.fn().mockReturnValue('Bearer test-api-token'),
		});

		const mockClient = {
			db: jest.fn().mockReturnValue({
				command: jest.fn().mockResolvedValue({ ok: 1 }),
				collection: jest.fn().mockReturnValue({
					countDocuments: jest.fn().mockResolvedValue(5),
				}),
			}),
		};

		mockGetMongoClient.mockResolvedValue(mockClient);

		const response = await GET();
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.status).toBe('healthy');
		expect(data.services.database.status).toBe('connected');
		expect(data.services.database.collections.mealPlans.count).toBe(5);
		expect(data.services.database.error).toBeNull();
		expect(data.timestamp).toBeDefined();
	});

	it('should return unhealthy status when MONGODB_URI is not configured', async () => {
		delete process.env.MONGODB_URI;

		mockHeaders.mockReturnValue({
			get: jest.fn().mockReturnValue('Bearer test-api-token'),
		});

		const response = await GET();
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data.status).toBe('unhealthy');
		expect(data.services.database.status).toBe('error');
		expect(data.services.database.error).toBe(
			'Database connection string is not configured'
		);
	});

	it('should return unhealthy status when database connection fails', async () => {
		mockHeaders.mockReturnValue({
			get: jest.fn().mockReturnValue('Bearer test-api-token'),
		});

		mockGetMongoClient.mockRejectedValue(new Error('ECONNREFUSED'));

		const response = await GET();
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data.status).toBe('unhealthy');
		expect(data.services.database.status).toBe('error');
		expect(data.services.database.error).toBe(
			'Could not connect to database server'
		);
	});

	it('should return unhealthy status when database authentication fails', async () => {
		mockHeaders.mockReturnValue({
			get: jest.fn().mockReturnValue('Bearer test-api-token'),
		});

		mockGetMongoClient.mockRejectedValue(new Error('Authentication failed'));

		const response = await GET();
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data.status).toBe('unhealthy');
		expect(data.services.database.status).toBe('error');
		expect(data.services.database.error).toBe('Database authentication failed');
	});

	it('should return unhealthy status when database ping fails', async () => {
		mockHeaders.mockReturnValue({
			get: jest.fn().mockReturnValue('Bearer test-api-token'),
		});

		const mockClient = {
			db: jest.fn().mockReturnValue({
				command: jest.fn().mockRejectedValue(new Error('Database ping failed')),
			}),
		};

		mockGetMongoClient.mockResolvedValue(mockClient);

		const response = await GET();
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data.status).toBe('unhealthy');
		expect(data.services.database.status).toBe('error');
		expect(data.services.database.error).toBe(
			'Database error: Database ping failed'
		);
	});

	it('should handle unknown database errors', async () => {
		mockHeaders.mockReturnValue({
			get: jest.fn().mockReturnValue('Bearer test-api-token'),
		});

		mockGetMongoClient.mockRejectedValue('Unknown error');

		const response = await GET();
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data.status).toBe('unhealthy');
		expect(data.services.database.status).toBe('error');
		expect(data.services.database.error).toBe('Unknown database error');
	});
});
