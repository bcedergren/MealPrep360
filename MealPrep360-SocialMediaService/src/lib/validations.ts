import { z } from 'zod';

// User Profile Validation
export const userProfileSchema = z.object({
	displayName: z.string().min(2).max(50),
	bio: z.string().max(500).optional(),
	profilePicture: z.string().url().optional(),
	privacySettings: z
		.object({
			isProfilePublic: z.boolean(),
			isMealPlansPublic: z.boolean(),
		})
		.optional(),
});

// Post Validation
export const postSchema = z.object({
	type: z.enum(['recipe', 'mealPlan']),
	referenceId: z.string(),
	caption: z.string().max(1000).optional(),
	mediaUrls: z.array(z.string().url()).optional(),
	tags: z.array(z.string()).optional(),
});

// Comment Validation
export const commentSchema = z.object({
	text: z.string().min(1).max(500),
});

// Search Validation
export const searchSchema = z.object({
	q: z.string().min(1),
	type: z.enum(['all', 'users', 'posts']).optional(),
	page: z.number().int().min(1).optional(),
	limit: z.number().int().min(1).max(50).optional(),
});

// Follow Validation
export const followSchema = z.object({
	targetUserId: z.string(),
});

// Validation helper function
export async function validateRequest<T>(
	schema: z.ZodSchema<T>,
	data: unknown
): Promise<{ success: boolean; data?: T; error?: string }> {
	try {
		const validatedData = await schema.parseAsync(data);
		return { success: true, data: validatedData };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.errors.map((e) => e.message).join(', '),
			};
		}
		return { success: false, error: 'Validation failed' };
	}
}
