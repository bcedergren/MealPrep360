import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Notification } from '@/models/Notification';
import connectDB from '@/lib/mongodb';

interface NotificationQuery {
	userId: string;
	read?: boolean;
}

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     description: Get notifications for the authenticated user
 *     responses:
 *       200:
 *         description: List of notifications
 *   patch:
 *     description: Mark notifications as read
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Notifications marked as read
 */

// Get user notifications
export async function GET(request: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '20');
		const unreadOnly = searchParams.get('unreadOnly') === 'true';

		await connectDB();

		const query: NotificationQuery = { userId };
		if (unreadOnly) {
			query.read = false;
		}

		const notifications = await Notification.find(query)
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit);

		const total = await Notification.countDocuments(query);
		const unreadCount = await Notification.countDocuments({
			userId,
			read: false,
		});

		return NextResponse.json({
			notifications,
			pagination: {
				total,
				page,
				limit,
				pages: Math.ceil(total / limit),
			},
			unreadCount,
		});
	} catch (error) {
		console.error('Error fetching notifications:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// Mark notifications as read
export async function PATCH(request: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { notificationIds } = body;

		if (!notificationIds || !Array.isArray(notificationIds)) {
			return NextResponse.json(
				{ error: 'Invalid notification IDs' },
				{ status: 400 }
			);
		}

		await connectDB();

		await Notification.updateMany(
			{
				_id: { $in: notificationIds },
				userId,
			},
			{ read: true }
		);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error marking notifications as read:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
