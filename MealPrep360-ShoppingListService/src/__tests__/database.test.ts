import * as db from '../utils/database';
import mongoose from 'mongoose';

jest.mock('mongoose');

describe('database utils', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(mongoose.connect as any).mockClear();
	});

	it('connectToDatabase returns cached connection', async () => {
		(mongoose.connect as any).mockResolvedValueOnce('connection');
		await db.connectToDatabase(); // first call
		const result = await db.connectToDatabase(); // should use cache
		expect(result).toBe('connection');
	});

	it('connectToDatabase throws if no URI', async () => {
		const orig = process.env.MONGODB_URI;
		delete process.env.MONGODB_URI;
		await expect(db.connectToDatabase()).rejects.toThrow();
		process.env.MONGODB_URI = orig;
	});

	it('getDatabaseStatus returns connected', async () => {
		(mongoose.connect as any).mockResolvedValueOnce({
			connection: { readyState: 1 },
		});
		const status = await db.getDatabaseStatus();
		expect(status.status).toBe('connected');
		expect(status.readyState).toBe(1);
	});

	it('getDatabaseStatus returns error on failure', async () => {
		(mongoose.connect as any).mockRejectedValueOnce(new Error('fail'));
		const status = await db.getDatabaseStatus();
		expect(status.status).toBe('error');
		expect(status.message).toMatch(/fail/);
	});
});
