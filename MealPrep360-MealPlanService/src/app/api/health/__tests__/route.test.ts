import { GET } from '../route';
import { getMongoClient } from '@/app/lib/mongodb';
import { headers } from 'next/headers';

// Mock the next/headers module
jest.mock('next/headers', () => ({
	headers: jest.fn(),
}));

// Mock the MongoDB client
jest.mock('@/app/lib/mongodb', () => ({
	getMongoClient: jest.fn(),
}));

describe('Health API', () => {
	const mockHeaders = new Map();
	const mockMongoClient = {
		db: jest.fn().mockReturnValue({
			command: jest.fn(),
			collection: jest.fn(),
		}),
	};

	beforeEach(() => {
		jest.clearAllMocks();
		process.env.API_TOKEN = 'test-token';
		process.env.MONGODB_URI = 'mongodb://test-uri';
		(headers as jest.Mock).mockReturnValue(mockHeaders);
		(getMongoClient as jest.Mock).mockResolvedValue(mockMongoClient);
	});

	it('should return 401 when authorization header is missing', async () => {
		mockHeaders.set('authorization', null);
		const response = await GET();
		const data = await response.json();

		expect(response.status).toBe(401);
		expect(data).toEqual({ error: 'Missing or invalid authorization header' });
	});

	it('should return 401 when API token is invalid', async () => {
		mockHeaders.set('authorization', 'Bearer wrong-token');
		const response = await GET();
		const data = await response.json();

		expect(response.status).toBe(401);
		expect(data).toEqual({ error: 'Invalid API token' });
	});

	it('should return healthy status when all services are up', async () => {
		mockHeaders.set('authorization', 'Bearer test-token');
		mockMongoClient.db().command.mockResolvedValue({ ok: 1 });
		mockMongoClient.db().collection.mockReturnValue({
			countDocuments: jest.fn().mockResolvedValue(5),
		});

		const response = await GET();
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.status).toBe('healthy');
		expect(data.services.database.status).toBe('connected');
		expect(data.services.database.collections.mealPlans.count).toBe(5);
	});

	it('should return unhealthy status when database connection fails', async () => {
		mockHeaders.set('authorization', 'Bearer test-token');
		mockMongoClient
			.db()
			.command.mockRejectedValue(new Error('Connection failed'));

		const response = await GET();
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data.status).toBe('unhealthy');
		expect(data.services.database.status).toBe('error');
		expect(data.services.database.error).toBe(
			'Database error: Connection failed'
		);
	});

	it('should handle missing MONGODB_URI configuration', async () => {
		mockHeaders.set('authorization', 'Bearer test-token');
		delete process.env.MONGODB_URI;

		const response = await GET();
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data.status).toBe('unhealthy');
		expect(data.services.database.status).toBe('error');
		expect(data.services.database.error).toBe(
			'Database connection string is not configured'
		);
	});
});
