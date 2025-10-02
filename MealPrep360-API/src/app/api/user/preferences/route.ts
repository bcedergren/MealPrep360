import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User, UserSettings } from '@/lib/mongodb/schemas';
import { createCacheKey } from '@/lib/cache';
import { MemoryCache } from '@/lib/cache';

// Create a dedicated preferences cache with 5-minute TTL
const preferencesCache = new MemoryCache();

interface CachedPreferencesData {
	settings: any;
}

/**
 * @swagger
 * /api/user/preferences:
 *   get:
 *     tags:
 *       - User
 *     summary: Get user preferences
 *     description: Retrieves the authenticated user's dietary preferences and settings
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: User preferences retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 settings:
 *                   $ref: '#/components/schemas/UserPreferences'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
	try {
		await connectDB();
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check cache first
		const cacheKey = `preferences:${userId}`;
		const cachedPreferences = preferencesCache.get(cacheKey);
		if (cachedPreferences) {
			return NextResponse.json(cachedPreferences);
		}

		// Get user - use lean() for better performance
		const user: any = await User.findOne({ clerkId: userId })
			.select('_id')
			.lean();

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Get settings - use lean() for better performance
		const settings: any = await UserSettings.findOne({ userId: user._id })
			.select('settings')
			.lean();

		// Cache the preferences for 5 minutes
		if (settings) {
			preferencesCache.set(cacheKey, { settings: settings.settings }, 300);
		}

		const response = NextResponse.json({
			settings: settings?.settings || null,
		});
		response.headers.set(
			'Cache-Control',
			'private, s-maxage=300, stale-while-revalidate=600'
		);
		return response;
	} catch (error) {
		console.error('Error fetching user preferences:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch user preferences' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/user/preferences:
 *   post:
 *     tags:
 *       - User
 *     summary: Update user preferences
 *     description: Updates the authenticated user's dietary preferences
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - preferences
 *             properties:
 *               preferences:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of dietary preferences
 *                 example: ["vegetarian", "gluten-free", "low-sodium"]
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 preferences:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Updated dietary preferences
 *       400:
 *         description: Invalid preferences format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(req: Request) {
	try {
		await connectDB();
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const user: any = await User.findOne({ clerkId: userId })
			.select('_id')
			.lean();

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const { preferences } = await req.json();
		if (!Array.isArray(preferences)) {
			return NextResponse.json(
				{ error: 'Invalid preferences format' },
				{ status: 400 }
			);
		}

		let settings = await UserSettings.findOne({ userId: user._id });
		if (settings) {
			settings.settings = {
				...settings.settings,
				dietaryPreferences: preferences,
			};
			await settings.save();
		} else {
			settings = await UserSettings.create({
				userId: user._id,
				settings: {
					dietaryPreferences: preferences,
					defaultServings: 4,
					defaultExpirationDays: 7,
					notificationTime: '09:00',
					weeklySummary: true,
					offlineSync: false,
					allergies: [],
				},
			});
		}

		// Invalidate cache for this user
		const cacheKey = createCacheKey('user-preferences', { userId });
		preferencesCache.delete(cacheKey);

		const response = NextResponse.json({
			preferences: settings.settings.dietaryPreferences,
		});
		response.headers.set(
			'Cache-Control',
			'private, no-cache, no-store, must-revalidate'
		);
		return response;
	} catch (error) {
		console.error('Error updating preferences:', error);
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
