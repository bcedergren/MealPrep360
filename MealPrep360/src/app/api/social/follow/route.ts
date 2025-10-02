import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serverApiClient } from '@/lib/api-client-server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';


// POST /api/social/follow - Follow a user
export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const response = await serverApiClient.post('/api/social/follow', body);

		if (!response.success) {
			return NextResponse.json({ error: response.error }, { status: 500 });
		}

		return NextResponse.json(response.data);
	} catch (error) {
		console.error('Error following user:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// DELETE /api/social/follow - Unfollow a user
export async function DELETE(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const targetUserId = searchParams.get('targetUserId');

		if (!targetUserId) {
			return NextResponse.json(
				{ error: 'Target user ID required' },
				{ status: 400 }
			);
		}

		const response = await serverApiClient.delete(
			`/api/social/follow?targetUserId=${targetUserId}`
		);

		if (!response.success) {
			return NextResponse.json({ error: response.error }, { status: 500 });
		}

		return NextResponse.json(response.data);
	} catch (error) {
		console.error('Error unfollowing user:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
