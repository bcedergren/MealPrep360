import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';

/**
 * @swagger
 * /api/admin/blog/generate:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Generate blog content using AI (Admin only)
 *     description: Uses OpenAI to generate blog post content based on provided parameters
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Blog post title
 *               excerpt:
 *                 type: string
 *                 description: Brief excerpt or summary
 *               category:
 *                 type: string
 *                 description: Blog post category
 *               challenge:
 *                 type: string
 *                 description: Main challenge or topic to address
 *               tips:
 *                 type: string
 *                 description: Specific tips, focus, or angle
 *               tone:
 *                 type: string
 *                 enum: [professional, casual, friendly, informative]
 *                 default: friendly
 *               length:
 *                 type: string
 *                 enum: [short, medium, long]
 *                 default: medium
 *     responses:
 *       200:
 *         description: Blog content generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 content:
 *                   type: string
 *                   description: Generated blog post content
 *                 title:
 *                   type: string
 *                   description: Suggested title (if not provided)
 *                 excerpt:
 *                   type: string
 *                   description: Generated excerpt
 *                 wordCount:
 *                   type: number
 *                   description: Approximate word count
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 *       503:
 *         description: OpenAI service unavailable
 */
export async function POST(request: Request) {
	const authCheck = await adminAuth('canModerateContent');
	if (authCheck) return authCheck;

	try {
		const {
			title,
			excerpt,
			category,
			challenge,
			tips,
			tone = 'friendly',
			length = 'medium',
		} = await request.json();

		// Validate input
		if (!title && !excerpt && !category) {
			return NextResponse.json(
				{ error: 'At least one of title, excerpt, or category is required' },
				{ status: 400 }
			);
		}

		// Check if Blog Service is configured
		const blogServiceUrl = process.env.BLOG_SERVICE_URL?.replace(/\/$/, '');
		const blogServiceApiKey = process.env.BLOG_SERVICE_API_KEY;

		if (!blogServiceUrl || !blogServiceApiKey) {
			return NextResponse.json(
				{ error: 'Blog service not configured' },
				{ status: 503 }
			);
		}

		console.log('[Admin] Generating blog content via Blog Service...');

		// Call Blog Service
		const response = await fetch(`${blogServiceUrl}/api/generate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': blogServiceApiKey,
			},
			body: JSON.stringify({
				title,
				excerpt,
				category,
				challenge,
				tips,
				tone,
				length,
			}),
			signal: AbortSignal.timeout(120000), // 2 minute timeout for content generation
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

			console.error('Blog service error:', {
				status: response.status,
				statusText: response.statusText,
				error: errorData,
				url: `${blogServiceUrl}/api/generate`,
			});

			return NextResponse.json(
				{
					error:
						errorData.message ||
						`Failed to generate content: ${response.statusText}`,
					details: errorData,
				},
				{ status: response.status }
			);
		}

		const data = await response.json();

		if (!data.content) {
			console.error('Blog service response missing content:', data);
			return NextResponse.json(
				{ error: 'Blog service response missing content' },
				{ status: 500 }
			);
		}

		console.log(
			`[Admin] Generated blog content: ${data.wordCount || 'unknown'} words`
		);

		return NextResponse.json({
			content: data.content,
			title: data.title,
			excerpt: data.excerpt,
			wordCount: data.wordCount,
			generatedAt: new Date().toISOString(),
		});
	} catch (error) {
		console.error('Error generating blog content:', error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : 'Internal server error',
			},
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
