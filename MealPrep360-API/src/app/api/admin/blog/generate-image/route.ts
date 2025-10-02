import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';

// Environment variable validation
const RECIPE_SERVICE_URL = process.env.RECIPE_SERVICE_URL?.replace(/\/$/, '');
const RECIPE_SERVICE_API_KEY = process.env.RECIPE_SERVICE_API_KEY;

/**
 * @swagger
 * /api/admin/blog/generate-image:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Generate blog post image (Admin only)
 *     description: Generates a custom image for blog posts using the Recipe Service
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 description: Blog post title
 *               excerpt:
 *                 type: string
 *                 description: Blog post excerpt or description
 *               category:
 *                 type: string
 *                 description: Blog post category
 *               style:
 *                 type: string
 *                 enum: [modern, classic, minimal, colorful]
 *                 default: modern
 *                 description: Image style preference
 *               dimensions:
 *                 type: object
 *                 properties:
 *                   width:
 *                     type: number
 *                     default: 1200
 *                   height:
 *                     type: number
 *                     default: 630
 *                 description: Image dimensions
 *     responses:
 *       200:
 *         description: Blog image generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrl:
 *                   type: string
 *                   format: uri
 *                   description: URL of the generated image
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     width:
 *                       type: number
 *                     height:
 *                       type: number
 *                     format:
 *                       type: string
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 *       503:
 *         description: Recipe service unavailable
 */
export async function POST(request: Request) {
	const authCheck = await adminAuth('canModerateContent');
	if (authCheck) return authCheck;

	try {
		if (!RECIPE_SERVICE_URL || !RECIPE_SERVICE_API_KEY) {
			return NextResponse.json(
				{ error: 'Recipe service not configured' },
				{ status: 503 }
			);
		}

		const {
			title,
			excerpt,
			category,
			style = 'modern',
			dimensions = { width: 1200, height: 630 },
		} = await request.json();

		if (!title) {
			return NextResponse.json({ error: 'Title is required' }, { status: 400 });
		}

		console.log('[Admin] Generating blog image via Recipe Service...');

		// Call the recipe service to generate image
		const serviceUrl = `${RECIPE_SERVICE_URL}/generate-blog-image`;

		const response = await fetch(serviceUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': RECIPE_SERVICE_API_KEY,
			},
			body: JSON.stringify({
				title,
				excerpt,
				category,
				style,
				dimensions,
			}),
			signal: AbortSignal.timeout(60000), // 60 second timeout for image generation
		});

		if (!response.ok) {
			let errorData;
			const contentType = response.headers.get('content-type');

			try {
				if (contentType?.includes('application/json')) {
					errorData = await response.json();
				} else {
					const textContent = await response.text();
					errorData = {
						message: textContent || 'Failed to parse error response',
						status: response.status,
						statusText: response.statusText,
					};
				}
			} catch (e) {
				errorData = {
					message: 'Failed to parse error response',
					status: response.status,
					statusText: response.statusText,
				};
			}

			console.error('Recipe service error:', {
				status: response.status,
				statusText: response.statusText,
				error: errorData,
				url: serviceUrl,
			});

			return NextResponse.json(
				{
					error:
						errorData.message ||
						`Failed to generate image: ${response.statusText}`,
					details: errorData,
				},
				{ status: response.status }
			);
		}

		const data = await response.json();
		const imageUrl = data.imageUrl;

		if (!imageUrl) {
			console.error('Recipe service response missing imageUrl:', data);
			return NextResponse.json(
				{ error: 'Recipe service response missing imageUrl' },
				{ status: 500 }
			);
		}

		console.log(`[Admin] Generated blog image: ${imageUrl}`);

		return NextResponse.json({
			imageUrl,
			metadata: {
				width: dimensions.width,
				height: dimensions.height,
				format: 'png',
				generatedAt: new Date().toISOString(),
				style,
				category,
			},
		});
	} catch (error) {
		console.error('Error generating blog image:', error);

		if (error instanceof Error) {
			if (error.name === 'AbortError') {
				return NextResponse.json(
					{ error: 'Image generation timed out' },
					{ status: 408 }
				);
			}
		}

		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : 'Internal server error',
			},
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
