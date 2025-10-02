import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serverApiClient } from '@/lib/api-client-server';
import { API_CONFIG } from '@/lib/api-config';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/user/recipes/saved - Get user's saved recipes
export async function GET(request: NextRequest) {
	try {
		const { userId, getToken } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const token = await getToken();
		const { searchParams } = new URL(request.url);
		const params = Object.fromEntries(searchParams.entries());

		const response = await serverApiClient.get(
			API_CONFIG.endpoints.userRecipesSaved,
			params,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		);

		if (!response.success) {
			return NextResponse.json({ error: response.error }, { status: 500 });
		}

		return NextResponse.json(response.data);
	} catch (error) {
		console.error('Error fetching saved recipes:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// POST /api/user/recipes/saved - Save a recipe
export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const response = await serverApiClient.post(
			API_CONFIG.endpoints.userRecipesSaved,
			body
		);

		if (!response.success) {
			return NextResponse.json({ error: response.error }, { status: 500 });
		}

		return NextResponse.json(response.data);
	} catch (error) {
		console.error('Error saving recipe:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// DELETE /api/user/recipes/saved - Unsave a recipe
export async function DELETE(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const url = new URL(request.url);
		const recipeId = url.searchParams.get('recipeId');

		if (!recipeId) {
			return NextResponse.json(
				{ error: 'Recipe ID required' },
				{ status: 400 }
			);
		}

		// Mock unsave operation - in production, delete from database
		return NextResponse.json({ success: true, message: 'Recipe unsaved' });
	} catch (error) {
		console.error('Error unsaving recipe:', error);
		return NextResponse.json(
			{ error: 'Failed to unsave recipe' },
			{ status: 500 }
		);
	}
}
