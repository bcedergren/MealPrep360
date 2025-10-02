import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import connectDB from '@/lib/mongodb/connection';
import { Message, Conversation } from '@/models';

/**
 * @swagger
 * /api/admin/messaging/messages:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get messages (Admin only)
 *     description: Retrieves messages with filtering and moderation capabilities
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: conversationId
 *         schema:
 *           type: string
 *         description: Filter by conversation ID
 *       - in: query
 *         name: senderId
 *         schema:
 *           type: string
 *         description: Filter by sender user ID
 *       - in: query
 *         name: receiverId
 *         schema:
 *           type: string
 *         description: Filter by receiver user ID
 *       - in: query
 *         name: messageType
 *         schema:
 *           type: string
 *           enum: [all, text, image, recipe_share, meal_plan_share, system_message]
 *         description: Filter by message type
 *       - in: query
 *         name: moderationStatus
 *         schema:
 *           type: string
 *           enum: [all, approved, pending, flagged, removed]
 *         description: Filter by moderation status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [all, low, medium, high]
 *         description: Filter by priority
 *       - in: query
 *         name: read
 *         schema:
 *           type: string
 *           enum: [all, read, unread]
 *         description: Filter by read status
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
 *         description: Number of messages per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt]
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
 *         description: Search in message content
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [today, week, month, all]
 *           default: all
 *         description: Filter by time range
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
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
	const authCheck = await adminAuth('canModerateContent');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		const { searchParams } = new URL(request.url);
		const conversationId = searchParams.get('conversationId');
		const senderId = searchParams.get('senderId');
		const receiverId = searchParams.get('receiverId');
		const messageType = searchParams.get('messageType') || 'all';
		const moderationStatus = searchParams.get('moderationStatus') || 'all';
		const priority = searchParams.get('priority') || 'all';
		const read = searchParams.get('read') || 'all';
		const search = searchParams.get('search');
		const timeRange = searchParams.get('timeRange') || 'all';
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '20');
		const sortBy = searchParams.get('sortBy') || 'createdAt';
		const sortOrder = searchParams.get('sortOrder') || 'desc';
		const skip = (page - 1) * limit;

		// Build query
		const query: any = {};

		if (conversationId) {
			query.conversationId = conversationId;
		}

		if (senderId) {
			query.senderId = senderId;
		}

		if (receiverId) {
			query.receiverId = receiverId;
		}

		if (messageType !== 'all') {
			query.messageType = messageType;
		}

		if (moderationStatus !== 'all') {
			query.moderationStatus = moderationStatus;
		}

		if (priority !== 'all') {
			query.priority = priority;
		}

		if (read !== 'all') {
			switch (read) {
				case 'read':
					query.read = true;
					break;
				case 'unread':
					query.read = false;
					break;
			}
		}

		if (search) {
			query.content = { $regex: search, $options: 'i' };
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
		const [messages, total, stats] = await Promise.all([
			Message.find(query).sort(sortObj).skip(skip).limit(limit).lean(),
			Message.countDocuments(query),
			Message.aggregate([
				{
					$group: {
						_id: null,
						totalMessages: { $sum: 1 },
						readMessages: {
							$sum: { $cond: [{ $eq: ['$read', true] }, 1, 0] },
						},
						unreadMessages: {
							$sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] },
						},
						systemMessages: {
							$sum: { $cond: [{ $eq: ['$isSystemMessage', true] }, 1, 0] },
						},
						flaggedMessages: {
							$sum: {
								$cond: [{ $eq: ['$moderationStatus', 'flagged'] }, 1, 0],
							},
						},
						removedMessages: {
							$sum: {
								$cond: [{ $eq: ['$moderationStatus', 'removed'] }, 1, 0],
							},
						},
						byType: {
							$push: '$messageType',
						},
						byPriority: {
							$push: '$priority',
						},
					},
				},
			]),
		]);

		const statsData = stats[0] || {
			totalMessages: 0,
			readMessages: 0,
			unreadMessages: 0,
			systemMessages: 0,
			flaggedMessages: 0,
			removedMessages: 0,
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
			`[Admin] Retrieved ${messages.length} messages (${moderationStatus})`
		);
		return NextResponse.json({
			messages,
			pagination: {
				total,
				pages: Math.ceil(total / limit),
				current: page,
			},
			stats: statsData,
		});
	} catch (error) {
		console.error('Error fetching messages:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch messages' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/admin/messaging/messages:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Send admin message (Admin only)
 *     description: Sends a message as an admin for support or announcements
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - conversationId
 *               - receiverId
 *             properties:
 *               content:
 *                 type: string
 *                 description: Message content
 *               conversationId:
 *                 type: string
 *                 description: Conversation ID
 *               receiverId:
 *                 type: string
 *                 description: Receiver user ID
 *               messageType:
 *                 type: string
 *                 enum: [text, image, recipe_share, meal_plan_share, system_message]
 *                 default: text
 *                 description: Message type
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *                 description: Message priority
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Message attachments
 *               isSystemMessage:
 *                 type: boolean
 *                 default: true
 *                 description: Mark as system message
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: object
 *                 conversationUpdated:
 *                   type: boolean
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Conversation not found
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
			content,
			conversationId,
			receiverId,
			messageType = 'text',
			priority = 'medium',
			attachments = [],
			isSystemMessage = true,
		} = body;

		if (!content || !conversationId || !receiverId) {
			return NextResponse.json(
				{ error: 'Content, conversationId, and receiverId are required' },
				{ status: 400 }
			);
		}

		// Verify conversation exists
		const conversation = await Conversation.findById(conversationId);
		if (!conversation) {
			return NextResponse.json(
				{ error: 'Conversation not found' },
				{ status: 404 }
			);
		}

		// Create the message
		const message = new Message({
			senderId: 'admin', // Special admin sender ID
			receiverId,
			conversationId,
			content,
			messageType,
			priority,
			attachments,
			isSystemMessage,
			moderationStatus: 'approved', // Admin messages are pre-approved
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await message.save();

		// Update conversation's last message and activity
		const conversationUpdate = await Conversation.findByIdAndUpdate(
			conversationId,
			{
				'lastMessage.content': content,
				'lastMessage.senderId': 'admin',
				'lastMessage.timestamp': new Date(),
				lastActivity: new Date(),
				updatedAt: new Date(),
			},
			{ new: true }
		);

		console.log(
			`[Admin] Sent ${messageType} message to ${receiverId} in conversation ${conversationId}`
		);
		return NextResponse.json(
			{
				message,
				conversationUpdated: !!conversationUpdate,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error sending message:', error);
		return NextResponse.json(
			{ error: 'Failed to send message' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
