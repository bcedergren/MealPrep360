import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/schemas';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import { UserSettings } from '@/types/settings';
import { createCacheKey } from '@/lib/cache';
import { MemoryCache } from '@/lib/cache';

// Create a dedicated settings cache with 5-minute TTL
const settingsCache = new MemoryCache();

interface CachedSettingsData {
	settings: UserSettings;
}

/**
 * @swagger
 * /api/settings:
 *   get:
 *     tags:
 *       - Settings
 *     summary: Get user settings
 *     description: Retrieves all user settings including theme, display, notifications, etc.
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 theme:
 *                   type: object
 *                   properties:
 *                     mode:
 *                       type: string
 *                       enum: [light, dark, system]
 *                     primaryColor:
 *                       type: string
 *                 display:
 *                   type: object
 *                   properties:
 *                     compactMode:
 *                       type: boolean
 *                     showImages:
 *                       type: boolean
 *                 language:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                     name:
 *                       type: string
 *                 notifications:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: boolean
 *                     push:
 *                       type: boolean
 *                     weeklySummary:
 *                       type: boolean
 *                 privacy:
 *                   type: object
 *                   properties:
 *                     shareData:
 *                       type: boolean
 *                     publicProfile:
 *                       type: boolean
 *                 security:
 *                   type: object
 *                   properties:
 *                     twoFactorEnabled:
 *                       type: boolean
 *                 mealPlanning:
 *                   type: object
 *                   properties:
 *                     defaultServings:
 *                       type: number
 *                     planningHorizon:
 *                       type: number
 *                 onboarding:
 *                   type: object
 *                   properties:
 *                     completed:
 *                       type: boolean
 *                     currentStep:
 *                       type: number
 *       401:
 *         description: Unauthorized
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
		const { userId: clerkId } = await auth();

		if (!clerkId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		// Check cache first
		const cacheKey = `settings:${clerkId}`;
		const cachedSettings = settingsCache.get(cacheKey);
		if (cachedSettings) {
			return NextResponse.json(cachedSettings);
		}

		// Fetch settings for the user
		const user = await User.findOne({ clerkId });

		if (!user) {
			// Create new user with default settings
			const newUser = await User.create({
				clerkId,
				email: '',
				name: '',
				settings: DEFAULT_SETTINGS,
			});

			settingsCache.set(cacheKey, DEFAULT_SETTINGS, 300); // Cache for 5 minutes
			return NextResponse.json(DEFAULT_SETTINGS);
		}

		if (!user.settings) {
			// Add default settings to existing user
			user.settings = DEFAULT_SETTINGS;
			await user.save();

			settingsCache.set(cacheKey, DEFAULT_SETTINGS, 300);
			return NextResponse.json(DEFAULT_SETTINGS);
		}

		// Merge with default settings to ensure all fields are present
		const mergedSettings = {
			...DEFAULT_SETTINGS,
			...user.settings,
			onboarding: {
				...DEFAULT_SETTINGS.onboarding,
				...user.settings.onboarding,
			},
		};

		settingsCache.set(cacheKey, mergedSettings, 300);
		return NextResponse.json(mergedSettings);
	} catch (error) {
		console.error('Error fetching settings:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch settings' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/settings:
 *   put:
 *     tags:
 *       - Settings
 *     summary: Update user settings
 *     description: Updates user settings with partial or complete settings object
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theme:
 *                 type: object
 *                 properties:
 *                   mode:
 *                     type: string
 *                     enum: [light, dark, system]
 *                   primaryColor:
 *                     type: string
 *               display:
 *                 type: object
 *                 properties:
 *                   compactMode:
 *                     type: boolean
 *                   showImages:
 *                     type: boolean
 *               notifications:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: boolean
 *                   push:
 *                     type: boolean
 *                   weeklySummary:
 *                     type: boolean
 *               mealPlanning:
 *                 type: object
 *                 properties:
 *                   defaultServings:
 *                     type: number
 *                   planningHorizon:
 *                     type: number
 *               onboarding:
 *                 type: object
 *                 properties:
 *                   completed:
 *                     type: boolean
 *                   currentStep:
 *                     type: number
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Updated user settings object
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
export async function PUT(request: Request) {
	try {
		const { userId: clerkId } = await auth();

		if (!clerkId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		const body = await request.json();

		const user = await User.findOne({ clerkId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Merge new settings with existing settings
		const currentSettings = user.settings || DEFAULT_SETTINGS;
		const mergedSettings = {
			...currentSettings,
			...body,
			theme: {
				...currentSettings.theme,
				...body.theme,
			},
			display: {
				...currentSettings.display,
				...body.display,
			},
			language: {
				...currentSettings.language,
				...body.language,
			},
			notifications: {
				...currentSettings.notifications,
				...body.notifications,
			},
			privacy: {
				...currentSettings.privacy,
				...body.privacy,
			},
			security: {
				...currentSettings.security,
				...body.security,
			},
			mealPlanning: {
				...currentSettings.mealPlanning,
				...body.mealPlanning,
			},
			integrations: {
				...currentSettings.integrations,
				...body.integrations,
			},
			preferences: {
				...currentSettings.preferences,
				...body.preferences,
			},
			onboarding: {
				...currentSettings.onboarding,
				...body.onboarding,
			},
		};

		// Update user settings
		const updatedUser = await User.findOneAndUpdate(
			{ clerkId },
			{ settings: mergedSettings },
			{ new: true }
		);

		if (!updatedUser) {
			return NextResponse.json(
				{ error: 'Failed to update settings' },
				{ status: 500 }
			);
		}

		// Update cache
		const cacheKey = `settings:${clerkId}`;
		settingsCache.set(cacheKey, updatedUser.settings, 300);

		return NextResponse.json(updatedUser.settings);
	} catch (error) {
		console.error('Error updating settings:', error);
		return NextResponse.json(
			{ error: 'Failed to update settings' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
