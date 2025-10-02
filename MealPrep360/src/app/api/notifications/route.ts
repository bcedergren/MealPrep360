import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serverApiClient } from '@/lib/api-client-server';
import { API_CONFIG } from '@/lib/api-config';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';


// GET /api/notifications - Get user notifications
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
			API_CONFIG.endpoints.notifications,
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
		console.error('Error fetching notifications:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// POST /api/notifications - Create new notification
export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const response = await serverApiClient.post(
			API_CONFIG.endpoints.notifications,
			body
		);

		if (!response.success) {
			return NextResponse.json({ error: response.error }, { status: 500 });
		}

		return NextResponse.json(response.data);
	} catch (error) {
		console.error('Error creating notification:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// PUT /api/notifications - Mark notifications as read/unread
export async function PUT(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const response = await serverApiClient.put(
			API_CONFIG.endpoints.notifications,
			body
		);

		if (!response.success) {
			return NextResponse.json({ error: response.error }, { status: 500 });
		}

		return NextResponse.json(response.data);
	} catch (error) {
		console.error('Error updating notifications:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// DELETE /api/notifications - Delete notifications
export async function DELETE(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const notificationIds = searchParams.get('ids')?.split(',') || [];

		if (notificationIds.length === 0) {
			return NextResponse.json(
				{ error: 'Notification IDs required' },
				{ status: 400 }
			);
		}

		// Mock notification deletion - in production, delete from database
		return NextResponse.json({
			success: true,
			deletedCount: notificationIds.length,
			message: `${notificationIds.length} notifications deleted`,
		});
	} catch (error) {
		console.error('Error deleting notifications:', error);
		return NextResponse.json(
			{ error: 'Failed to delete notifications' },
			{ status: 500 }
		);
	}
}
