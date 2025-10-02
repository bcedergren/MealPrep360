import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import connectDB from '@/lib/mongodb/connection';
import { Recipe } from '@/lib/mongodb/schemas';

/**
 * @swagger
 * /api/admin/recipes/make-all-public:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Make all recipes public (Admin only)
 *     description: Updates all recipes in the system to be publicly visible
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isPublic:
 *                 type: boolean
 *                 default: true
 *                 description: Visibility status to set for all recipes
 *     responses:
 *       200:
 *         description: Bulk update completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 modifiedCount:
 *                   type: number
 *                   description: Number of recipes updated
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
	const authCheck = await adminAuth('canManageSystem');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		// Parse request body to allow customization of visibility status
		let isPublic = true;
		try {
			const body = await request.json();
			if (body.isPublic !== undefined) {
				isPublic = Boolean(body.isPublic);
			}
		} catch {
			// Default to making public if no body provided
			isPublic = true;
		}

		console.log(
			`[Admin] Starting bulk recipe visibility update to: ${
				isPublic ? 'public' : 'private'
			}`
		);

		// Update all recipes with the specified visibility
		const result = await Recipe.updateMany(
			{},
			{
				$set: {
					isPublic: isPublic,
					updatedAt: new Date(),
				},
			}
		);

		const message = isPublic
			? `Successfully made ${result.modifiedCount} recipes public`
			: `Successfully made ${result.modifiedCount} recipes private`;

		console.log(
			`[Admin] Bulk visibility update completed: ${result.modifiedCount} recipes affected`
		);

		return NextResponse.json({
			success: true,
			modifiedCount: result.modifiedCount,
			message: message,
			isPublic: isPublic,
		});
	} catch (error) {
		console.error('Error updating recipe visibility:', error);
		return NextResponse.json(
			{
				error: 'Failed to update recipe visibility',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
