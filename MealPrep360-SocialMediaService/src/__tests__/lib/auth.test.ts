import { requireAuth } from '@/lib/auth';
import { auth } from '@clerk/nextjs/server';

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
	auth: jest.fn(),
}));

describe('Auth Functions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('requireAuth', () => {
		it('should resolve with userId when authenticated', async () => {
			const mockUserId = 'user123';
			(auth as jest.Mock).mockResolvedValueOnce({
				userId: mockUserId,
				isAuthenticated: true,
			});

			const userId = await requireAuth();
			expect(userId).toBe(mockUserId);
		});

		it('should reject when not authenticated', async () => {
			(auth as jest.Mock).mockResolvedValueOnce({
				userId: null,
				isAuthenticated: false,
			});

			await expect(requireAuth()).rejects.toThrow('Unauthorized');
		});

		it('should handle auth errors', async () => {
			const error = new Error('Auth error');
			(auth as jest.Mock).mockRejectedValueOnce(error);

			await expect(requireAuth()).rejects.toThrow(error);
		});
	});
});
