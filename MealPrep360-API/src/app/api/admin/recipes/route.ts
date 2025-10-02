import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import connectDB from '@/lib/mongodb/connection';
import { Recipe } from '@/lib/mongodb/schemas';

/**
 * @swagger
 * /api/admin/recipes:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all recipes with admin filters (Admin only)
 *     description: Retrieves all recipes with pagination and filtering options for admin management
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recipes per page
 *       - in: query
 *         name: imageFilter
 *         schema:
 *           type: string
 *           enum: [all, custom, placeholder, none]
 *           default: all
 *         description: Filter recipes by image type
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [all, public, private]
 *           default: all
 *         description: Filter recipes by visibility
 *     responses:
 *       200:
 *         description: Recipes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recipes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recipe'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     totalPages:
 *                       type: number
 *                 totals:
 *                   type: object
 *                   properties:
 *                     customImages:
 *                       type: number
 *                     placeholders:
 *                       type: number
 *                     noImages:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request) {
	const authCheck = await adminAuth('canModerateContent');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		const url = new URL(request.url);
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '10');
		const imageFilter = url.searchParams.get('imageFilter') || 'all';
		const visibility = url.searchParams.get('visibility') || 'all';

		const skip = (page - 1) * limit;

		// Build query based on filters
		let query: any = {};

		// Image filter
		if (imageFilter === 'custom') {
			query.$and = [
				{ imageUrl: { $exists: true, $ne: null } },
				{
					imageUrl: { $not: { $in: [/placeholder/i, /recipe-placeholder/i] } },
				},
				{ imageUrl: { $ne: '' } },
			];
		} else if (imageFilter === 'placeholder') {
			query.imageUrl = { $in: [/placeholder/i, /recipe-placeholder/i] };
		} else if (imageFilter === 'none') {
			query.$or = [
				{ imageUrl: { $exists: false } },
				{ imageUrl: null },
				{ imageUrl: '' },
			];
		}

		// Visibility filter
		if (visibility === 'public') {
			query.isPublic = true;
		} else if (visibility === 'private') {
			query.isPublic = { $ne: true };
		}

		try {
			// Get total count for pagination
			const total = await Recipe.countDocuments(query);

			// Get recipes with pagination
			const recipes = await Recipe.find(query)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean();

			// Get image statistics with optimized queries
			const [
				customImages,
				placeholders,
				noImages,
				publicRecipes,
				privateRecipes,
			] = await Promise.all([
				Recipe.countDocuments({
					$and: [
						{ imageUrl: { $exists: true, $ne: null } },
						{
							imageUrl: {
								$not: { $in: [/placeholder/i, /recipe-placeholder/i] },
							},
						},
						{ imageUrl: { $ne: '' } },
					],
				}),
				Recipe.countDocuments({
					imageUrl: { $in: [/placeholder/i, /recipe-placeholder/i] },
				}),
				Recipe.countDocuments({
					$or: [
						{ imageUrl: { $exists: false } },
						{ imageUrl: null },
						{ imageUrl: '' },
					],
				}),
				Recipe.countDocuments({ isPublic: true }),
				Recipe.countDocuments({ isPublic: { $ne: true } }),
			]);

			return NextResponse.json({
				recipes,
				pagination: {
					total,
					page,
					limit,
					totalPages: Math.ceil(total / limit),
				},
				totals: {
					customImages,
					placeholders,
					noImages,
					publicRecipes,
					privateRecipes,
				},
			});
		} catch (queryError) {
			console.error('Admin recipes API: Query execution error:', queryError);
			return NextResponse.json(
				{ error: 'Failed to fetch recipes' },
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error('Admin recipes API: Unhandled error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
