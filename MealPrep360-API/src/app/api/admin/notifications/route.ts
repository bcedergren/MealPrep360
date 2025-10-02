import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import connectDB from '@/lib/mongodb/connection';
import { Notification } from '@/models';

/**
 * @swagger
 * /api/admin/notifications:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get notifications (Admin only)
 *     description: Retrieves notifications with filtering and analytics
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, message, mention, like, comment, follow, recipe_share, recipe_update, meal_plan_reminder, shopping_list_reminder, system_announcement, admin_message]
 *         description: Filter by notification type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, read, unread, scheduled, sent, expired]
 *         description: Filter by notification status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [all, low, medium, high, urgent]
 *         description: Filter by priority
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
 *           default: 20
 *         description: Number of notifications per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, scheduledFor, sentAt, priority]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title or content
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [today, week, month, all]
 *           default: all
 *         description: Filter by time range
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                 stats:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request) {
	const authCheck = await adminAuth('canViewAnalytics');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		const { searchParams } = new URL(request.url);
		const userId = searchParams.get('userId');
		const type = searchParams.get('type') || 'all';
		const status = searchParams.get('status') || 'all';
		const priority = searchParams.get('priority') || 'all';
		const search = searchParams.get('search');
		const timeRange = searchParams.get('timeRange') || 'all';
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '20');
		const sortBy = searchParams.get('sortBy') || 'createdAt';
		const sortOrder = searchParams.get('sortOrder') || 'desc';
		const skip = (page - 1) * limit;

		// Build query
		const query: any = {};

		if (userId) {
			query.userId = userId;
		}

		if (type !== 'all') {
			query.type = type;
		}

		if (priority !== 'all') {
			query.priority = priority;
		}

		if (status !== 'all') {
			const now = new Date();
			switch (status) {
				case 'read':
					query.read = true;
					break;
				case 'unread':
					query.read = false;
					break;
				case 'scheduled':
					query.scheduledFor = { $gt: now };
					query.sentAt = { $exists: false };
					break;
				case 'sent':
					query.sentAt = { $exists: true };
					break;
				case 'expired':
					query.expiresAt = { $lt: now };
					break;
			}
		}

		if (search) {
			query.$or = [
				{ title: { $regex: search, $options: 'i' } },
				{ content: { $regex: search, $options: 'i' } },
			];
		}

		// Add time range filter
		if (timeRange !== 'all') {
			const now = new Date();
			let startDate: Date;

			switch (timeRange) {
				case 'today':
					startDate = new Date(
						now.getFullYear(),
						now.getMonth(),
						now.getDate()
					);
					break;
				case 'week':
					startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
					break;
				case 'month':
					startDate = new Date(now.getFullYear(), now.getMonth(), 1);
					break;
				default:
					startDate = new Date(0);
			}

			query.createdAt = { $gte: startDate };
		}

		// Create sort object
		const sortObj: any = {};
		sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

		// Execute queries in parallel
		const [notifications, total, stats] = await Promise.all([
			Notification.find(query).sort(sortObj).skip(skip).limit(limit).lean(),
			Notification.countDocuments(query),
			Notification.aggregate([
				{
					$group: {
						_id: null,
						totalNotifications: { $sum: 1 },
						readNotifications: {
							$sum: { $cond: [{ $eq: ['$read', true] }, 1, 0] },
						},
						unreadNotifications: {
							$sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] },
						},
						scheduledNotifications: {
							$sum: { $cond: [{ $gt: ['$scheduledFor', new Date()] }, 1, 0] },
						},
						sentNotifications: {
							$sum: { $cond: [{ $exists: ['$sentAt', true] }, 1, 0] },
						},
						expiredNotifications: {
							$sum: { $cond: [{ $lt: ['$expiresAt', new Date()] }, 1, 0] },
						},
						byType: {
							$push: '$type',
						},
						byPriority: {
							$push: '$priority',
						},
					},
				},
			]),
		]);

		const statsData = stats[0] || {
			totalNotifications: 0,
			readNotifications: 0,
			unreadNotifications: 0,
			scheduledNotifications: 0,
			sentNotifications: 0,
			expiredNotifications: 0,
			byType: [],
			byPriority: [],
		};

		// Count by type and priority
		const typeCount = statsData.byType.reduce((acc: any, type: string) => {
			acc[type] = (acc[type] || 0) + 1;
			return acc;
		}, {});

		const priorityCount = statsData.byPriority.reduce(
			(acc: any, priority: string) => {
				acc[priority] = (acc[priority] || 0) + 1;
				return acc;
			},
			{}
		);

		statsData.typeDistribution = typeCount;
		statsData.priorityDistribution = priorityCount;
		delete statsData.byType;
		delete statsData.byPriority;

		console.log(
			`[Admin] Retrieved ${notifications.length} notifications (${status})`
		);
		return NextResponse.json({
			notifications,
			pagination: {
				total,
				pages: Math.ceil(total / limit),
				current: page,
			},
			stats: statsData,
		});
	} catch (error) {
		console.error('Error fetching notifications:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch notifications' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/admin/notifications:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create notification (Admin only)
 *     description: Creates a new notification for users
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *                 description: Notification title
 *               content:
 *                 type: string
 *                 description: Notification content
 *               type:
 *                 type: string
 *                 enum: [message, mention, like, comment, follow, recipe_share, recipe_update, meal_plan_reminder, shopping_list_reminder, system_announcement, admin_message]
 *                 description: Notification type
 *               userId:
 *                 type: string
 *                 description: Target user ID (if not provided, sends to all users)
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *                 description: Notification priority
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *                 description: When to send the notification
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: When the notification expires
 *               data:
 *                 type: object
 *                 description: Additional data for the notification
 *     responses:
 *       201:
 *         description: Notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notification:
 *                   type: object
 *                 message:
 *                   type: string
 *                 broadcast:
 *                   type: boolean
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
	const authCheck = await adminAuth('canManageSystem');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		const body = await request.json();
		const {
			title,
			content,
			type,
			userId,
			priority = 'medium',
			scheduledFor,
			expiresAt,
			data = {},
		} = body;

		if (!title || !content || !type) {
			return NextResponse.json(
				{ error: 'Title, content, and type are required' },
				{ status: 400 }
			);
		}

		const notificationData = {
			title,
			content,
			type,
			priority,
			data,
			...(scheduledFor && { scheduledFor: new Date(scheduledFor) }),
			...(expiresAt && { expiresAt: new Date(expiresAt) }),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		let notifications;
		let broadcast = false;

		if (userId) {
			// Send to specific user
			const notification = new Notification({
				...notificationData,
				userId,
			});
			await notification.save();
			notifications = [notification];
		} else {
			// Broadcast to all users - this would need to be implemented based on your user system
			// For now, we'll just create a system announcement
			broadcast = true;
			const notification = new Notification({
				...notificationData,
				userId: 'system', // Special system user ID for broadcasts
			});
			await notification.save();
			notifications = [notification];
		}

		console.log(
			`[Admin] Created ${broadcast ? 'broadcast' : 'targeted'} notification: ${
				notifications[0]._id
			}`
		);
		return NextResponse.json(
			{
				notification: notifications[0],
				message: `Notification created successfully${
					broadcast ? ' (broadcast)' : ''
				}`,
				broadcast,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error creating notification:', error);
		return NextResponse.json(
			{ error: 'Failed to create notification' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
