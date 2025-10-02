import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Recipe } from '@/models/Recipe';
import { RecipeVersion } from '@/models/RecipeVersion';
import connectDB from '@/lib/mongodb';
import { createNotification } from '@/lib/notifications';
import type { NextRequest } from 'next/server';

interface Collaborator {
	userId: string;
	role: string;
}

interface VersionBody {
	changes: Array<{
		field: string;
		oldValue: string;
		newValue: string;
	}>;
	comment?: string;
}

// Create new version
export async function POST(
	request: Request,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body: VersionBody = await request.json();
		const { changes, comment } = body;

		if (!changes || !Array.isArray(changes)) {
			return NextResponse.json(
				{ error: 'Invalid changes data' },
				{ status: 400 }
			);
		}

		await connectDB();

		const params = await context.params;
		const recipe = await Recipe.findById(params.id);
		if (!recipe) {
			return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
		}

		// Check if user has permission to edit
		const canEdit =
			recipe.authorId === userId ||
			recipe.collaborators.some(
				(c: Collaborator) =>
					c.userId === userId && ['admin', 'editor'].includes(c.role)
			);

		if (!canEdit) {
			return NextResponse.json(
				{ error: 'Insufficient permissions' },
				{ status: 403 }
			);
		}

		// Create new version
		const newVersion = new RecipeVersion({
			recipeId: recipe._id,
			version: recipe.version + 1,
			authorId: userId,
			changes,
			comment,
		});

		await newVersion.save();

		// Update recipe version
		recipe.version = newVersion.version;
		await recipe.save();

		// Notify recipe owner and admins
		const notifyUsers = [
			recipe.authorId,
			...recipe.collaborators
				.filter((c: Collaborator) => c.role === 'admin')
				.map((c: Collaborator) => c.userId),
		];

		for (const notifyUserId of notifyUsers) {
			if (notifyUserId !== userId) {
				await createNotification({
					userId: notifyUserId,
					type: 'recipe_update',
					content: `Recipe "${recipe.title}" has been updated to version ${newVersion.version}`,
					data: {
						recipeId: recipe._id.toString(),
						version: newVersion.version,
					},
				});
			}
		}

		return NextResponse.json(newVersion);
	} catch (error) {
		console.error('Error creating recipe version:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// Get version history
export async function GET(
	request: Request,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		const params = await context.params;
		const recipe = await Recipe.findById(params.id);
		if (!recipe) {
			return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
		}

		// Check if user has permission to view
		const canView =
			recipe.isPublic ||
			recipe.authorId === userId ||
			recipe.collaborators.some((c: Collaborator) => c.userId === userId);

		if (!canView) {
			return NextResponse.json(
				{ error: 'Insufficient permissions' },
				{ status: 403 }
			);
		}

		// Get version history
		const versions = await RecipeVersion.find({ recipeId: recipe._id })
			.sort({ version: -1 })
			.select('-__v');

		return NextResponse.json(versions);
	} catch (error) {
		console.error('Error fetching version history:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
