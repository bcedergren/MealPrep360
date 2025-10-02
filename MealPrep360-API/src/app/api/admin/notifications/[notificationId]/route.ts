import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import connectDB from '@/lib/mongodb/connection';
import { Notification } from '@/models';
import mongoose from 'mongoose';

/**
 * @swagger
 * /api/admin/notifications/{notificationId}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get notification details (Admin only)
 *     description: Retrieves detailed information about a specific notification
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID to retrieve
 *     responses:
 *       200:
 *         description: Notification details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notification:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
export async function GET(
	request: Request,
	{ params }: { params: { notificationId: string } }
) {
	const authCheck = await adminAuth('canViewAnalytics');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		if (!mongoose.Types.ObjectId.isValid(params.notificationId)) {
			return NextResponse.json(
				{ error: 'Invalid notification ID' },
				{ status: 400 }
			);
		}

		const notification = await Notification.findById(
			params.notificationId
		).lean();

		if (!notification) {
			return NextResponse.json(
				{ error: 'Notification not found' },
				{ status: 404 }
			);
		}

		console.log(
			`[Admin] Retrieved notification details: ${params.notificationId}`
		);
		return NextResponse.json({ notification });
	} catch (error) {
		console.error('Error fetching notification details:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch notification details' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/admin/notifications/{notificationId}:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Update notification (Admin only)
 *     description: Updates a notification
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Updated notification title
 *               content:
 *                 type: string
 *                 description: Updated notification content
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 description: Updated priority
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *                 description: Updated scheduled time
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Updated expiration time
 *               read:
 *                 type: boolean
 *                 description: Mark as read/unread
 *               action:
 *                 type: string
 *                 enum: [send, cancel, reschedule]
 *                 description: Action to perform
 *               data:
 *                 type: object
 *                 description: Updated additional data
 *     responses:
 *       200:
 *         description: Notification updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notification:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
export async function PATCH(
	request: Request,
	{ params }: { params: { notificationId: string } }
) {
	const authCheck = await adminAuth('canManageSystem');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		if (!mongoose.Types.ObjectId.isValid(params.notificationId)) {
			return NextResponse.json(
				{ error: 'Invalid notification ID' },
				{ status: 400 }
			);
		}

		const body = await request.json();
		const {
			title,
			content,
			priority,
			scheduledFor,
			expiresAt,
			read,
			action,
			data,
		} = body;

		const notification = await Notification.findById(params.notificationId);
		if (!notification) {
			return NextResponse.json(
				{ error: 'Notification not found' },
				{ status: 404 }
			);
		}

		// Build update object
		const updateData: any = {
			updatedAt: new Date(),
		};

		if (title !== undefined) {
			updateData.title = title;
		}

		if (content !== undefined) {
			updateData.content = content;
		}

		if (priority !== undefined) {
			updateData.priority = priority;
		}

		if (scheduledFor !== undefined) {
			updateData.scheduledFor = scheduledFor ? new Date(scheduledFor) : null;
		}

		if (expiresAt !== undefined) {
			updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
		}

		if (read !== undefined) {
			updateData.read = read;
		}

		if (data !== undefined) {
			updateData.data = { ...notification.data, ...data };
		}

		// Handle actions
		if (action) {
			switch (action) {
				case 'send':
					updateData.sentAt = new Date();
					updateData.scheduledFor = null;
					break;
				case 'cancel':
					updateData.scheduledFor = null;
					updateData.sentAt = null;
					break;
				case 'reschedule':
					if (!scheduledFor) {
						return NextResponse.json(
							{ error: 'scheduledFor is required for reschedule action' },
							{ status: 400 }
						);
					}
					updateData.sentAt = null;
					break;
			}
		}

		const updatedNotification = await Notification.findByIdAndUpdate(
			params.notificationId,
			updateData,
			{ new: true }
		).lean();

		console.log(
			`[Admin] Updated notification: ${params.notificationId} (${
				action || 'content update'
			})`
		);
		return NextResponse.json({
			notification: updatedNotification,
			message: 'Notification updated successfully',
		});
	} catch (error) {
		console.error('Error updating notification:', error);
		return NextResponse.json(
			{ error: 'Failed to update notification' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/admin/notifications/{notificationId}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete notification (Admin only)
 *     description: Permanently deletes a notification
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID to delete
 *       - in: query
 *         name: reason
 *         schema:
 *           type: string
 *         description: Reason for deletion
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(
	request: Request,
	{ params }: { params: { notificationId: string } }
) {
	const authCheck = await adminAuth('canManageSystem');
	if (authCheck) return authCheck;

	try {
		await connectDB();

		if (!mongoose.Types.ObjectId.isValid(params.notificationId)) {
			return NextResponse.json(
				{ error: 'Invalid notification ID' },
				{ status: 400 }
			);
		}

		const { searchParams } = new URL(request.url);
		const reason = searchParams.get('reason');

		const notification = await Notification.findById(params.notificationId);
		if (!notification) {
			return NextResponse.json(
				{ error: 'Notification not found' },
				{ status: 404 }
			);
		}

		await Notification.findByIdAndDelete(params.notificationId);

		console.log(
			`[Admin] Deleted notification: ${params.notificationId} (${
				reason || 'no reason provided'
			})`
		);
		return NextResponse.json({
			success: true,
			message: 'Notification deleted successfully',
		});
	} catch (error) {
		console.error('Error deleting notification:', error);
		return NextResponse.json(
			{ error: 'Failed to delete notification' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
