import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serverApiClient } from '@/lib/api-client-server';
import { API_CONFIG } from '@/lib/api-config';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';


// GET /api/user/recipes - Get user's recipes
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
			API_CONFIG.endpoints.userRecipes,
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
		console.error('Error fetching user recipes:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// POST /api/user/recipes - Create new recipe
export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const response = await serverApiClient.post(
			API_CONFIG.endpoints.userRecipes,
			body
		);

		if (!response.success) {
			return NextResponse.json({ error: response.error }, { status: 500 });
		}

		return NextResponse.json(response.data);
	} catch (error) {
		console.error('Error creating user recipe:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
