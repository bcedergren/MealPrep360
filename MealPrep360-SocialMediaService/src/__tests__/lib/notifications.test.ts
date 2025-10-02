import {
	createNotification,
	createBulkNotifications,
	getUnreadCount,
	markAsRead,
	cleanupOldNotifications,
} from '@/lib/notifications';
import { Notification } from '@/models/Notification';
import connectDB from '@/lib/mongodb';

// Mock mongoose models
jest.mock('@/models/Notification', () => ({
	Notification: {
		create: jest.fn(),
		insertMany: jest.fn(),
		countDocuments: jest.fn(),
		updateMany: jest.fn(),
		deleteMany: jest.fn(),
	},
}));

// Mock database connection
jest.mock('@/lib/mongodb', () => ({
	__esModule: true,
	default: jest.fn(),
}));

describe('Notification Functions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('createNotification', () => {
		it('should create a notification successfully', async () => {
			const notificationData = {
				userId: 'user123',
				type: 'LIKE',
				content: 'Someone liked your post',
				data: { postId: 'post123' },
			};

			await createNotification(notificationData);

			expect(connectDB).toHaveBeenCalled();
			expect(Notification.create).toHaveBeenCalledWith(notificationData);
		});

		it('should handle errors gracefully', async () => {
			const error = new Error('Database error');
			(Notification.create as jest.Mock).mockRejectedValueOnce(error);

			const notificationData = {
				userId: 'user123',
				type: 'LIKE',
				content: 'Test notification',
			};

			await createNotification(notificationData);

			expect(console.error).toHaveBeenCalledWith(
				'Error creating notification:',
				error
			);
		});
	});

	describe('createBulkNotifications', () => {
		it('should create multiple notifications successfully', async () => {
			const userIds = ['user1', 'user2', 'user3'];
			const notificationData = {
				type: 'SYSTEM',
				content: 'System update',
				data: { updateId: 'update123' },
			};

			await createBulkNotifications(userIds, notificationData);

			expect(connectDB).toHaveBeenCalled();
			expect(Notification.insertMany).toHaveBeenCalledWith(
				userIds.map((userId) => ({
					userId,
					...notificationData,
				}))
			);
		});
	});

	describe('getUnreadCount', () => {
		it('should return correct unread count', async () => {
			const userId = 'user123';
			const expectedCount = 5;
			(Notification.countDocuments as jest.Mock).mockResolvedValueOnce(
				expectedCount
			);

			const count = await getUnreadCount(userId);

			expect(count).toBe(expectedCount);
			expect(Notification.countDocuments).toHaveBeenCalledWith({
				userId,
				read: false,
			});
		});

		it('should return 0 on error', async () => {
			(Notification.countDocuments as jest.Mock).mockRejectedValueOnce(
				new Error()
			);

			const count = await getUnreadCount('user123');

			expect(count).toBe(0);
		});
	});

	describe('markAsRead', () => {
		it('should mark notifications as read', async () => {
			const userId = 'user123';
			const notificationIds = ['notif1', 'notif2'];

			await markAsRead(userId, notificationIds);

			expect(Notification.updateMany).toHaveBeenCalledWith(
				{
					_id: { $in: notificationIds },
					userId,
				},
				{ read: true }
			);
		});
	});

	describe('cleanupOldNotifications', () => {
		it('should delete old read notifications', async () => {
			const daysToKeep = 30;
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

			await cleanupOldNotifications(daysToKeep);

			expect(Notification.deleteMany).toHaveBeenCalledWith({
				createdAt: { $lt: cutoffDate },
				read: true,
			});
		});
	});
});
