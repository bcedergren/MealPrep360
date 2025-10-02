import { Notification } from '@/models/Notification';
import connectDB from '@/lib/mongodb';

export type NotificationType =
	| 'message'
	| 'mention'
	| 'like'
	| 'comment'
        | 'follow'
        | 'recipe_share'
        | 'recipe_update'
        | 'collaboration_invite'
        | 'collaboration_removed';

interface CreateNotificationParams {
	userId: string;
	type: NotificationType;
	content: string;
	data?: {
		senderId?: string;
		postId?: string;
		recipeId?: string;
		commentId?: string;
		version?: number;
	};
}

/**
 * Create a new notification
 */
export async function createNotification({
	userId,
	type,
	content,
	data,
}: CreateNotificationParams): Promise<void> {
	try {
		await connectDB();
		await Notification.create({
			userId,
			type,
			content,
			data,
		});
	} catch (error) {
		console.error('Error creating notification:', error);
	}
}

/**
 * Create notifications for multiple users
 */
export async function createBulkNotifications(
	userIds: string[],
	params: Omit<CreateNotificationParams, 'userId'>
): Promise<void> {
	try {
		await connectDB();
		const notifications = userIds.map((userId) => ({
			userId,
			...params,
		}));
		await Notification.insertMany(notifications);
	} catch (error) {
		console.error('Error creating bulk notifications:', error);
	}
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
	try {
		await connectDB();
		return await Notification.countDocuments({ userId, read: false });
	} catch (error) {
		console.error('Error getting unread count:', error);
		return 0;
	}
}

/**
 * Mark notifications as read
 */
export async function markAsRead(
	userId: string,
	notificationIds: string[]
): Promise<void> {
	try {
		await connectDB();
		await Notification.updateMany(
			{
				_id: { $in: notificationIds },
				userId,
			},
			{ read: true }
		);
	} catch (error) {
		console.error('Error marking notifications as read:', error);
	}
}

/**
 * Delete old notifications
 */
export async function cleanupOldNotifications(
	daysToKeep: number = 30
): Promise<void> {
	try {
		await connectDB();
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

		await Notification.deleteMany({
			createdAt: { $lt: cutoffDate },
			read: true,
		});
	} catch (error) {
		console.error('Error cleaning up old notifications:', error);
	}
}
