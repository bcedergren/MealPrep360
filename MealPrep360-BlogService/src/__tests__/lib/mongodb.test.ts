import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock mongoose
const mockConnect = jest
	.fn<() => Promise<typeof mongoose>>()
	.mockImplementation(() => Promise.resolve(mongoose));
jest.mock('mongoose', () => ({
	connect: mockConnect,
}));

describe('MongoDB Connection', () => {
	beforeEach(() => {
		// Clear all mocks before each test
		jest.clearAllMocks();
		// Reset the global mongoose cache
		global.mongoose = undefined;
	});

	it('should connect to MongoDB successfully', async () => {
		const result = await connectDB();
		expect(result).toBe(mongoose);
		expect(mockConnect).toHaveBeenCalledWith(process.env.MONGODB_URI, {
			bufferCommands: false,
		});
	});

	it('should return cached connection if already connected', async () => {
		// First connection
		await connectDB();
		// Second connection
		const result = await connectDB();

		expect(result).toBe(mongoose);
		expect(mockConnect).toHaveBeenCalledTimes(1);
	});

	it('should handle connection errors', async () => {
		const error = new Error('Connection failed');
		mockConnect.mockRejectedValueOnce(error);

		await expect(connectDB()).rejects.toThrow('Connection failed');
	});
});
