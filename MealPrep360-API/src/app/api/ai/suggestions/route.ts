import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/schemas';
import { getRecipeSuggestions } from '@/lib/openai';

/**
 * @swagger
 * /api/ai/suggestions:
 *   post:
 *     tags:
 *       - AI
 *     summary: Get AI recipe suggestions
 *     description: Get AI-powered recipe suggestions based on a query
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Search query for recipe suggestions
 *                 example: "I want something healthy with chicken"
 *     responses:
 *       200:
 *         description: Recipe suggestions generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 aiSuggestions:
 *                   type: string
 *                   description: AI-generated suggestions text
 *                 recipes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recipe'
 *                   description: Suggested recipes
 *       400:
 *         description: Missing query parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Missing query"
 *                 message:
 *                   type: string
 *                   example: "A search query is required"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *                 message:
 *                   type: string
 *                   example: "Please sign in to use this feature"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *                 message:
 *                   type: string
 *                   example: "Please complete your profile setup"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *                 message:
 *                   type: string
 *                   example: "An unexpected error occurred. Please try again later."
 *                 details:
 *                   type: string
 *                   description: Error details (only in development mode)
 */
export async function POST(req: NextRequest) {
	try {
		const { userId } = getAuth(req);
		if (!userId) {
			return NextResponse.json(
				{
					error: 'Unauthorized',
					message: 'Please sign in to use this feature',
				},
				{ status: 401 }
			);
		}

		await connectDB();

		const { query } = await req.json();

		if (!query) {
			return NextResponse.json(
				{
					error: 'Missing query',
					message: 'A search query is required',
				},
				{ status: 400 }
			);
		}

		// Get internal user ID
		const user = await User.findOne({ clerkId: userId }).select('_id');

		if (!user) {
			return NextResponse.json(
				{
					error: 'User not found',
					message: 'Please complete your profile setup',
				},
				{ status: 404 }
			);
		}

		// Get suggestions from OpenAI
		const aiResponse = await getRecipeSuggestions(query);

		// Format the results
		const suggestions = {
			aiSuggestions: aiResponse.aiSuggestions || 'No suggestions available',
			recipes: aiResponse.recipes,
		};

		return NextResponse.json(suggestions);
	} catch (error) {
		console.error('Error in AI suggestions:', error);
		return NextResponse.json(
			{
				error: 'Internal server error',
				message: 'An unexpected error occurred. Please try again later.',
				details:
					process.env.NODE_ENV === 'development'
						? error instanceof Error
							? error.message
							: String(error)
						: undefined,
			},
			{ status: 500 }
		);
	}
}
