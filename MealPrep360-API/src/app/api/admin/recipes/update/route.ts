import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import connectDB from '@/lib/mongodb/connection';
import { Recipe } from '@/lib/mongodb/schemas';
import mongoose from 'mongoose';

/**
 * @swagger
 * /api/admin/recipes/update:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Update a recipe (Admin only)
 *     description: Updates a specific recipe with new data
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 description: Recipe ID to update
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *               instructions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Recipe updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
	const authCheck = await adminAuth('canModerateContent');
	if (authCheck) return authCheck;

	try {
		await connectDB();
		const body = await request.json();
		const { id, ...updateData } = body;

		if (!id) {
			return NextResponse.json(
				{ error: 'Recipe ID is required' },
				{ status: 400 }
			);
		}

		// Convert string ID to ObjectId
		let recipeId;
		try {
			recipeId = new mongoose.Types.ObjectId(id);
		} catch (error) {
			return NextResponse.json(
				{ error: 'Invalid recipe ID format' },
				{ status: 400 }
			);
		}

		// Clean up updateData to remove any undefined values
		const cleanUpdateData = Object.fromEntries(
			Object.entries(updateData).filter(([_, value]) => value !== undefined)
		);

		// Update the recipe using _id
		const updatedRecipe = await Recipe.findOneAndUpdate(
			{ _id: recipeId },
			{
				...cleanUpdateData,
				updatedAt: new Date(),
			},
			{
				new: true,
				runValidators: true,
			}
		);

		if (!updatedRecipe) {
			return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
		}

		console.log(`[Admin] Recipe ${id} updated successfully`);
		return NextResponse.json(updatedRecipe);
	} catch (error) {
		console.error('Error updating recipe:', error);
		if (error instanceof mongoose.Error.ValidationError) {
			return NextResponse.json(
				{ error: 'Validation error', details: error.message },
				{ status: 400 }
			);
		}
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
