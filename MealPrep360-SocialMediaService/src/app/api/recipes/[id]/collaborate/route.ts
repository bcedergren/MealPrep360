import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Recipe } from '@/models/Recipe';
import { Notification } from '@/models/Notification';
import connectDB from '@/lib/mongodb';
import type { NextRequest } from 'next/server';

interface CollaboratorBody {
	userId: string;
	role: 'editor' | 'viewer';
}

type Collaborator = {
	userId: string;
	role: 'editor' | 'viewer';
};

// Add or update collaborator
export async function POST(
	request: Request,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body: CollaboratorBody = await request.json();
		const { userId: collaboratorId, role } = body;

		if (!collaboratorId || !role) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			);
		}

		await connectDB();

		const params = await context.params;
		const recipe = await Recipe.findById(params.id);
		if (!recipe) {
			return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
		}

		// Check if user is the owner
		if (recipe.authorId !== userId) {
			return NextResponse.json(
				{ error: 'Not authorized to manage collaborators' },
				{ status: 403 }
			);
		}

		// Add or update collaborator
		const collaborators = recipe.collaborators as Collaborator[];
		const collaboratorIndex = collaborators.findIndex(
			(c) => c.userId === collaboratorId
		);

		if (collaboratorIndex === -1) {
			collaborators.push({ userId: collaboratorId, role });
		} else {
			collaborators[collaboratorIndex].role = role;
		}

		recipe.collaborators = collaborators;
		await recipe.save();

		// Notify collaborator
		await Notification.create({
			userId: collaboratorId,
			type: 'collaboration_invite',
			content: `You have been invited to collaborate on ${recipe.title}`,
			data: { recipeId: recipe._id },
		});

		return NextResponse.json(recipe);
	} catch (error) {
		console.error('Error managing collaborator:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// Remove collaborator
export async function DELETE(
	request: Request,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const collaboratorId = searchParams.get('userId');

		if (!collaboratorId) {
			return NextResponse.json(
				{ error: 'Missing collaborator ID' },
				{ status: 400 }
			);
		}

		await connectDB();

		const params = await context.params;
		const recipe = await Recipe.findById(params.id);
		if (!recipe) {
			return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
		}

		// Check if user is the owner
		if (recipe.authorId !== userId) {
			return NextResponse.json(
				{ error: 'Not authorized to manage collaborators' },
				{ status: 403 }
			);
		}

		// Remove collaborator
		const collaborators = recipe.collaborators as Collaborator[];
		recipe.collaborators = collaborators.filter(
			(c) => c.userId !== collaboratorId
		);

		await recipe.save();

		// Notify collaborator
		await Notification.create({
			userId: collaboratorId,
			type: 'collaboration_removed',
			content: `You have been removed from collaborating on ${recipe.title}`,
			data: { recipeId: recipe._id },
		});

		return NextResponse.json(recipe);
	} catch (error) {
		console.error('Error removing collaborator:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
