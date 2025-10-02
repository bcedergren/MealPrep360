import { MongoClient } from 'mongodb';
import clientPromise, { getMongoClient } from '../mongodb';

// Mock the MongoDB client
jest.mock('mongodb', () => {
	const mockConnect = jest.fn();
	const mockClient = {
		connect: mockConnect,
	};
	return {
		MongoClient: jest.fn(() => mockClient),
	};
});

describe('MongoDB Client', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		process.env.MONGODB_URI = 'mongodb://test-uri';
		process.env.NODE_ENV = 'development';
	});

	it('should throw error when MONGODB_URI is not set', () => {
		delete process.env.MONGODB_URI;
		expect(() => {
			require('../mongodb');
		}).toThrow('Please add your Mongo URI to .env.local');
	});

	it('should create a new client in development mode', async () => {
		const mockClient = new MongoClient('mongodb://test-uri');
		(mockClient.connect as jest.Mock).mockResolvedValueOnce(mockClient);

		const client = await getMongoClient();
		expect(client).toBeDefined();
		expect(MongoClient).toHaveBeenCalledWith('mongodb://test-uri', {});
	});

	it('should create a new client in production mode', async () => {
		process.env.NODE_ENV = 'production';
		const mockClient = new MongoClient('mongodb://test-uri');
		(mockClient.connect as jest.Mock).mockResolvedValueOnce(mockClient);

		const client = await getMongoClient();
		expect(client).toBeDefined();
		expect(MongoClient).toHaveBeenCalledWith('mongodb://test-uri', {});
	});

	it('should reuse the same client promise in development mode', async () => {
		const mockClient = new MongoClient('mongodb://test-uri');
		(mockClient.connect as jest.Mock).mockResolvedValueOnce(mockClient);

		const client1 = await getMongoClient();
		const client2 = await getMongoClient();

		expect(client1).toBe(client2);
		expect(MongoClient).toHaveBeenCalledTimes(1);
	});
});
