import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serverApiClient } from '@/lib/api-client-server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';


// POST /api/social/group-prep/tasks - Create a task
export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const response = await serverApiClient.post(
			'/api/social/group-prep/tasks',
			body
		);

		if (!response.success) {
			return NextResponse.json({ error: response.error }, { status: 500 });
		}

		return NextResponse.json(response.data);
	} catch (error) {
		console.error('Error creating group prep task:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// PATCH /api/social/group-prep/tasks - Update a task
export async function PATCH(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const response = await serverApiClient.patch(
			'/api/social/group-prep/tasks',
			body
		);

		if (!response.success) {
			return NextResponse.json({ error: response.error }, { status: 500 });
		}

		return NextResponse.json(response.data);
	} catch (error) {
		console.error('Error updating group prep task:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
