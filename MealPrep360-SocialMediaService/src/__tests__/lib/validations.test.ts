import {
	userProfileSchema,
	commentSchema,
	validateRequest,
} from '@/lib/validations';
import { z } from 'zod';

describe('Validation Functions', () => {
	describe('userProfileSchema', () => {
		it('should validate a valid user profile', async () => {
			const validProfile = {
				displayName: 'John Doe',
				bio: 'A short bio',
				profilePicture: 'https://example.com/photo.jpg',
				privacySettings: {
					isProfilePublic: true,
					isMealPlansPublic: false,
				},
			};

			const result = await userProfileSchema.safeParseAsync(validProfile);
			expect(result.success).toBe(true);
		});

		it('should reject invalid display name', async () => {
			const invalidProfile = {
				displayName: 'J', // Too short
				bio: 'A short bio',
			};

			const result = await userProfileSchema.safeParseAsync(invalidProfile);
			expect(result.success).toBe(false);
		});

		it('should reject invalid profile picture URL', async () => {
			const invalidProfile = {
				displayName: 'John Doe',
				profilePicture: 'not-a-url',
			};

			const result = await userProfileSchema.safeParseAsync(invalidProfile);
			expect(result.success).toBe(false);
		});
	});

	describe('commentSchema', () => {
		it('should validate a valid comment', async () => {
			const validComment = {
				text: 'This is a valid comment',
			};

			const result = await commentSchema.safeParseAsync(validComment);
			expect(result.success).toBe(true);
		});

		it('should reject empty comment', async () => {
			const invalidComment = {
				text: '',
			};

			const result = await commentSchema.safeParseAsync(invalidComment);
			expect(result.success).toBe(false);
		});

		it('should reject comment that is too long', async () => {
			const invalidComment = {
				text: 'a'.repeat(501), // Exceeds 500 character limit
			};

			const result = await commentSchema.safeParseAsync(invalidComment);
			expect(result.success).toBe(false);
		});
	});

	describe('validateRequest', () => {
		it('should return success for valid data', async () => {
			const schema = z.object({ name: z.string() });
			const data = { name: 'John' };

			const result = await validateRequest(schema, data);
			expect(result.success).toBe(true);
			expect(result.data).toEqual(data);
		});

		it('should return error for invalid data', async () => {
			const schema = z.object({ name: z.string() });
			const data = { name: 123 }; // Invalid type

			const result = await validateRequest(schema, data);
			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});

		it('should handle non-Zod errors', async () => {
			const schema = z.object({ name: z.string() });
			const data = null;

			const result = await validateRequest(schema, data);
			expect(result.success).toBe(false);
			expect(result.error).toBe('Validation failed');
		});
	});
});
