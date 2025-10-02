import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import connectDB from '@/lib/mongodb/connection';
import { Conversation, Message } from '@/models';

/**
 * @swagger
 * /api/admin/messaging/conversations:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get conversations (Admin only)
 *     description: Retrieves conversations with filtering and analytics
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, direct, group, support]
 *         description: Filter by conversation type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, inactive]
 *         description: Filter by conversation status
 *       - in: query
 *         name: participant
 *         schema:
 *           type: string
 *         description: Filter by participant user ID
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
 *         description: Number of conversations per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [lastActivity, createdAt]
 *           default: lastActivity
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
 *         description: Search in conversation title or last message
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [today, week, month, all]
 *           default: all
 *         description: Filter by time range
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversations:
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
		const type = searchParams.get('type') || 'all';
		const status = searchParams.get('status') || 'all';
		const participant = searchParams.get('participant');
		const search = searchParams.get('search');
		const timeRange = searchParams.get('timeRange') || 'all';
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '20');
		const sortBy = searchParams.get('sortBy') || 'lastActivity';
		const sortOrder = searchParams.get('sortOrder') || 'desc';
		const skip = (page - 1) * limit;

		// Build query
		const query: any = {};

		if (type !== 'all') {
			query.type = type;
		}

		if (status !== 'all') {
			switch (status) {
				case 'active':
					query.isActive = true;
					break;
				case 'inactive':
					query.isActive = false;
					break;
			}
		}

		if (participant) {
			query.participants = participant;
		}

		if (search) {
			query.$or = [
				{ title: { $regex: search, $options: 'i' } },
				{ 'lastMessage.content': { $regex: search, $options: 'i' } },
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

			query.lastActivity = { $gte: startDate };
		}

		// Create sort object
		const sortObj: any = {};
		sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

		// Execute queries in parallel
		const [conversations, total, stats] = await Promise.all([
			Conversation.find(query).sort(sortObj).skip(skip).limit(limit).lean(),
			Conversation.countDocuments(query),
			Conversation.aggregate([
				{
					$group: {
						_id: null,
						totalConversations: { $sum: 1 },
						activeConversations: {
							$sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
						},
						inactiveConversations: {
							$sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] },
						},
						directConversations: {
							$sum: { $cond: [{ $eq: ['$type', 'direct'] }, 1, 0] },
						},
						groupConversations: {
							$sum: { $cond: [{ $eq: ['$type', 'group'] }, 1, 0] },
						},
						supportConversations: {
							$sum: { $cond: [{ $eq: ['$type', 'support'] }, 1, 0] },
						},
						avgParticipants: { $avg: { $size: '$participants' } },
					},
				},
			]),
		]);

		const statsData = stats[0] || {
			totalConversations: 0,
			activeConversations: 0,
			inactiveConversations: 0,
			directConversations: 0,
			groupConversations: 0,
			supportConversations: 0,
			avgParticipants: 0,
		};

		console.log(
			`[Admin] Retrieved ${conversations.length} conversations (${type})`
		);
		return NextResponse.json({
			conversations,
			pagination: {
				total,
				pages: Math.ceil(total / limit),
				current: page,
			},
			stats: statsData,
		});
	} catch (error) {
		console.error('Error fetching conversations:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch conversations' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/admin/messaging/conversations:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create conversation (Admin only)
 *     description: Creates a new conversation for support or admin purposes
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participants
 *               - type
 *             properties:
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of participant user IDs
 *               type:
 *                 type: string
 *                 enum: [direct, group, support]
 *                 description: Conversation type
 *               title:
 *                 type: string
 *                 description: Conversation title (required for group/support)
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for support tickets
 *     responses:
 *       201:
 *         description: Conversation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversation:
 *                   type: object
 *                 message:
 *                   type: string
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
		const { participants, type, title, metadata = {} } = body;

		if (
			!participants ||
			!Array.isArray(participants) ||
			participants.length === 0
		) {
			return NextResponse.json(
				{ error: 'Participants array is required and must not be empty' },
				{ status: 400 }
			);
		}

		if (!type) {
			return NextResponse.json({ error: 'Type is required' }, { status: 400 });
		}

		if ((type === 'group' || type === 'support') && !title) {
			return NextResponse.json(
				{ error: 'Title is required for group and support conversations' },
				{ status: 400 }
			);
		}

		// Create the conversation
		const conversation = new Conversation({
			participants,
			type,
			title,
			metadata,
			lastActivity: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await conversation.save();

		console.log(
			`[Admin] Created ${type} conversation: ${conversation._id} with ${participants.length} participants`
		);
		return NextResponse.json(
			{
				conversation,
				message: 'Conversation created successfully',
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error creating conversation:', error);
		return NextResponse.json(
			{ error: 'Failed to create conversation' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
