import { FEATURE_FLAGS } from '@/lib/vercelConfig';

// Mock environment
const originalEnv = process.env;

describe('Feature Flags', () => {
	beforeEach(() => {
		jest.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe('isEnabled', () => {
		it('should return true in development environment', async () => {
			process.env.NODE_ENV = 'development';
			const result = await FEATURE_FLAGS.isEnabled('any-feature');
			expect(result).toBe(true);
		});

		it('should return false when EDGE_CONFIG is not set', async () => {
			process.env.NODE_ENV = 'production';
			delete process.env.EDGE_CONFIG;
			const result = await FEATURE_FLAGS.isEnabled('any-feature');
			expect(result).toBe(false);
		});

		it('should handle edge config errors gracefully', async () => {
			process.env.NODE_ENV = 'production';
			process.env.EDGE_CONFIG = 'invalid-config';
			const result = await FEATURE_FLAGS.isEnabled('any-feature');
			expect(result).toBe(false);
		});
	});
});
