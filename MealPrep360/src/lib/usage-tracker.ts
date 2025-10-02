import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/schemas';
import { SubscriptionPlan, PLAN_FEATURES } from '@/types/subscription';

export interface UsageData {
	aiRecipesGenerated: number;
	recipeImagesGenerated: number;
	blogPostsGenerated: number;
	lastResetDate: Date;
}

export interface UsageLimits {
	aiRecipesLimit: number;
	recipeImagesLimit: number;
	blogPostsLimit: number;
	canUseFeature: (feature: string) => boolean;
}

export class UsageTracker {
	private userId: string;

	constructor(userId: string) {
		this.userId = userId;
	}

	async getCurrentUsage(): Promise<UsageData> {
		await connectDB();

		const user = await User.findOne({ clerkId: this.userId });
		if (!user) {
			throw new Error('User not found');
		}

		const usage = user.usage || {
			aiRecipesGenerated: 0,
			recipeImagesGenerated: 0,
			blogPostsGenerated: 0,
			lastResetDate: new Date(),
		};

		// Reset usage if it's a new month
		const now = new Date();
		const lastReset = new Date(usage.lastResetDate);

		if (
			now.getMonth() !== lastReset.getMonth() ||
			now.getFullYear() !== lastReset.getFullYear()
		) {
			await this.resetUsage();
			return {
				aiRecipesGenerated: 0,
				recipeImagesGenerated: 0,
				blogPostsGenerated: 0,
				lastResetDate: now,
			};
		}

		return usage;
	}

	async getUserLimits(): Promise<UsageLimits> {
		await connectDB();

		const user = await User.findOne({ clerkId: this.userId });
		if (!user) {
			throw new Error('User not found');
		}

		const plan: SubscriptionPlan = user.subscription?.plan || 'FREE';
		const features = PLAN_FEATURES[plan];

		return {
			aiRecipesLimit: this.getNumericLimit(features['AI Generated Recipes']),
			recipeImagesLimit: this.getNumericLimit(features['Recipe Images']),
			blogPostsLimit: this.getNumericLimit(features['AI Blog Generation']),
			canUseFeature: (feature: string) => {
				const featureValue = features[feature];
				if (typeof featureValue === 'boolean') return featureValue;
				if (typeof featureValue === 'string')
					return featureValue !== 'false' && featureValue !== '0';
				if (typeof featureValue === 'number') return featureValue > 0;
				return false;
			},
		};
	}

	private getNumericLimit(value: string | number | boolean): number {
		if (typeof value === 'number') return value;
		if (typeof value === 'string') {
			if (value === 'Unlimited') return -1;
			const num = parseInt(value);
			return isNaN(num) ? 0 : num;
		}
		if (typeof value === 'boolean') return value ? -1 : 0;
		return 0;
	}

	async canUseFeature(
		feature: 'aiRecipes' | 'recipeImages' | 'blogPosts'
	): Promise<{ canUse: boolean; remaining: number; limit: number }> {
		const [usage, limits] = await Promise.all([
			this.getCurrentUsage(),
			this.getUserLimits(),
		]);

		let currentUsage: number;
		let limit: number;

		switch (feature) {
			case 'aiRecipes':
				currentUsage = usage.aiRecipesGenerated;
				limit = limits.aiRecipesLimit;
				break;
			case 'recipeImages':
				currentUsage = usage.recipeImagesGenerated;
				limit = limits.recipeImagesLimit;
				break;
			case 'blogPosts':
				currentUsage = usage.blogPostsGenerated;
				limit = limits.blogPostsLimit;
				break;
		}

		// -1 means unlimited
		if (limit === -1) {
			return { canUse: true, remaining: -1, limit: -1 };
		}

		const canUse = currentUsage < limit;
		const remaining = Math.max(0, limit - currentUsage);

		return { canUse, remaining, limit };
	}

	async incrementUsage(
		feature: 'aiRecipes' | 'recipeImages' | 'blogPosts',
		amount: number = 1
	): Promise<void> {
		await connectDB();

		const updateField =
			feature === 'aiRecipes'
				? 'usage.aiRecipesGenerated'
				: feature === 'recipeImages'
				? 'usage.recipeImagesGenerated'
				: 'usage.blogPostsGenerated';

		await User.findOneAndUpdate(
			{ clerkId: this.userId },
			{
				$inc: { [updateField]: amount },
				$set: { 'usage.lastResetDate': new Date() },
			},
			{ upsert: true }
		);
	}

	async resetUsage(): Promise<void> {
		await connectDB();

		await User.findOneAndUpdate(
			{ clerkId: this.userId },
			{
				$set: {
					'usage.aiRecipesGenerated': 0,
					'usage.recipeImagesGenerated': 0,
					'usage.blogPostsGenerated': 0,
					'usage.lastResetDate': new Date(),
				},
			},
			{ upsert: true }
		);
	}

	async getUsageReport(): Promise<{
		usage: UsageData;
		limits: UsageLimits;
		percentages: {
			aiRecipes: number;
			recipeImages: number;
			blogPosts: number;
		};
	}> {
		const [usage, limits] = await Promise.all([
			this.getCurrentUsage(),
			this.getUserLimits(),
		]);

		const calculatePercentage = (used: number, limit: number): number => {
			if (limit === -1) return 0; // Unlimited
			if (limit === 0) return 100; // No access
			return Math.min(100, (used / limit) * 100);
		};

		return {
			usage,
			limits,
			percentages: {
				aiRecipes: calculatePercentage(
					usage.aiRecipesGenerated,
					limits.aiRecipesLimit
				),
				recipeImages: calculatePercentage(
					usage.recipeImagesGenerated,
					limits.recipeImagesLimit
				),
				blogPosts: calculatePercentage(
					usage.blogPostsGenerated,
					limits.blogPostsLimit
				),
			},
		};
	}
}

export async function checkUsageMiddleware(
	userId: string,
	feature: 'aiRecipes' | 'recipeImages' | 'blogPosts'
): Promise<{ allowed: boolean; message?: string; remaining?: number }> {
	try {
		const tracker = new UsageTracker(userId);
		const { canUse, remaining, limit } = await tracker.canUseFeature(feature);

		if (!canUse) {
			const featureName =
				feature === 'aiRecipes'
					? 'AI recipe generation'
					: feature === 'recipeImages'
					? 'recipe image generation'
					: 'blog post generation';

			return {
				allowed: false,
				message: `You've reached your monthly limit for ${featureName}. Upgrade your plan for more access.`,
				remaining: 0,
			};
		}

		return {
			allowed: true,
			remaining: remaining === -1 ? undefined : remaining,
		};
	} catch (error) {
		console.error('Usage check failed:', error);
		return {
			allowed: false,
			message: 'Unable to verify usage limits. Please try again.',
		};
	}
}
