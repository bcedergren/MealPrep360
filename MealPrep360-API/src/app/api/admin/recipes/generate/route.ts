import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import connectDB from '@/lib/mongodb/connection';
import { Job } from '@/lib/mongodb/schemas';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

// Environment variable validation
const RECIPE_SERVICE_URL = process.env.RECIPE_SERVICE_URL?.replace(/\/$/, '');
const RECIPE_SERVICE_API_KEY = process.env.RECIPE_SERVICE_API_KEY;

if (!RECIPE_SERVICE_URL) {
	console.warn('RECIPE_SERVICE_URL environment variable not defined');
}

if (!RECIPE_SERVICE_API_KEY) {
	console.warn('RECIPE_SERVICE_API_KEY environment variable not defined');
}

/**
 * @swagger
 * /api/admin/recipes/generate:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Check recipe generation service status (Admin only)
 *     description: Returns the status of the recipe generation service
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Service status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
export async function GET() {
	const authCheck = await adminAuth('canManageSystem');
	if (authCheck) return authCheck;

	return NextResponse.json({
		ok: true,
		message: 'Recipe generation service is available',
		serviceConfigured: !!(RECIPE_SERVICE_URL && RECIPE_SERVICE_API_KEY),
	});
}

/**
 * @swagger
 * /api/admin/recipes/generate:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Generate recipes using AI (Admin only)
 *     description: Initiates AI-powered recipe generation for a specific season
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - season
 *             properties:
 *               season:
 *                 type: string
 *                 enum: [spring, summer, fall, winter]
 *                 description: Season for recipe generation
 *     responses:
 *       200:
 *         description: Recipe generation started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 job:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                     progress:
 *                       type: number
 *                     total:
 *                       type: number
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       503:
 *         description: Recipe service unavailable
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
	const authCheck = await adminAuth('canManageSystem');
	if (authCheck) return authCheck;

	try {
		console.log('[Recipe Generate] Starting recipe generation request');

		if (!RECIPE_SERVICE_URL || !RECIPE_SERVICE_API_KEY) {
			return NextResponse.json(
				{ error: 'Recipe service not configured' },
				{ status: 503 }
			);
		}

		await connectDB();

		const body = await request.json();
		const { season } = body;
		console.log('[Recipe Generate] Received season:', season);

		if (!season) {
			return NextResponse.json(
				{ error: 'Season is required' },
				{ status: 400 }
			);
		}

		// Validate season value
		const validSeasons = ['spring', 'summer', 'fall', 'winter'];
		if (!validSeasons.includes(season.toLowerCase())) {
			return NextResponse.json(
				{
					error: 'Invalid season. Must be one of: spring, summer, fall, winter',
				},
				{ status: 400 }
			);
		}

		// First check if the recipe service is healthy
		console.log(
			'[Recipe Generate] Checking recipe service health at:',
			`${RECIPE_SERVICE_URL}/api/health`
		);

		try {
			const healthResponse = await fetch(`${RECIPE_SERVICE_URL}/api/health`, {
				method: 'GET',
				headers: {
					Accept: 'application/json',
					'x-api-key': RECIPE_SERVICE_API_KEY,
				},
				signal: AbortSignal.timeout(10000), // 10 second timeout
			});

			console.log(
				'[Recipe Generate] Health check response:',
				healthResponse.status
			);

			if (!healthResponse.ok) {
				const healthData = await healthResponse.json().catch(() => ({}));
				console.error(
					'[Recipe Generate] Recipe service health check failed:',
					healthData
				);
				return NextResponse.json(
					{ error: 'Recipe service is not available' },
					{ status: 503 }
				);
			}
		} catch (healthError) {
			console.error('[Recipe Generate] Health check failed:', healthError);
			return NextResponse.json(
				{ error: 'Recipe service is not responding' },
				{ status: 503 }
			);
		}

		// Call the recipe service endpoint
		console.log('[Recipe Generate] Calling recipe service generate endpoint');
		const response = await fetch(`${RECIPE_SERVICE_URL}/api/generate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				'x-api-key': RECIPE_SERVICE_API_KEY,
			},
			body: JSON.stringify({ season: season.toLowerCase() }),
			signal: AbortSignal.timeout(30000), // 30 second timeout
		});

		console.log('[Recipe Generate] Recipe service response:', response.status);
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			console.error('[Recipe Generate] Recipe service error:', errorData);
			return NextResponse.json(
				{ error: errorData.error || 'Failed to start recipe generation' },
				{ status: response.status }
			);
		}

		const data = await response.json();
		console.log('[Recipe Generate] Recipe service success, job data:', data);

		// Store a reference to the job locally for tracking purposes
		if (data.job) {
			try {
				const jobReference = new Job({
					id: data.job.id,
					type: 'recipe-generation',
					status: data.job.status || 'pending',
					progress: data.job.progress || 0,
					total: data.job.total || 30,
					data: {
						season: data.job.season || season.toLowerCase(),
					},
					createdAt: new Date(data.job.createdAt || Date.now()),
					updatedAt: new Date(),
				});

				await jobReference.save();
				console.log(
					'[Recipe Generate] Job reference saved locally for tracking:',
					jobReference.id
				);
			} catch (saveError: any) {
				// If it's a duplicate key error, try to update instead
				if (saveError.code === 11000) {
					try {
						await Job.findOneAndUpdate(
							{ id: data.job.id },
							{
								status: data.job.status || 'pending',
								progress: data.job.progress || 0,
								total: data.job.total || 30,
								updatedAt: new Date(),
							}
						);
						console.log(
							'[Recipe Generate] Updated existing job reference:',
							data.job.id
						);
					} catch (updateError) {
						console.error(
							'[Recipe Generate] Failed to update job reference:',
							updateError
						);
					}
				} else {
					console.error(
						'[Recipe Generate] Failed to save job reference:',
						saveError
					);
				}
				// Continue anyway - the job exists on the recipe service
			}
		}

		return NextResponse.json(data);
	} catch (error) {
		console.error('[Recipe Generate] Error in recipe generation:', error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : 'Internal server error',
			},
			{ status: 500 }
		);
	}
}
