import { INotification } from '../models/Notification';
import { INotificationService } from '../interfaces/services';
import { IBaseRepository } from '../interfaces/repositories';

export class NotificationService implements INotificationService {
	constructor(private repository: IBaseRepository<INotification>) {}

	async notifyNewMessage(recipientId: string, senderId: string): Promise<void> {
		await this.repository.create({
			userId: recipientId,
			type: 'message' as const,
			content: `You have a new message from a user`,
			data: {
				senderId,
				type: 'message',
				timestamp: new Date(),
			},
			isRead: false,
			createdAt: new Date(),
		});
	}

	async notifyNewComment(postId: string, commenterId: string): Promise<void> {
		const post = await this.repository.findOne({ _id: postId });
		if (!post) return;

		const authorId = post.get('authorId');
		if (authorId === commenterId) return;

		await this.repository.create({
			userId: authorId,
			type: 'comment' as const,
			content: `Someone commented on your post`,
			data: {
				postId,
				commenterId,
				type: 'comment',
				timestamp: new Date(),
			},
			isRead: false,
			createdAt: new Date(),
		});
	}

	async notifyNewFollower(userId: string, followerId: string): Promise<void> {
		await this.repository.create({
			userId,
			type: 'follow' as const,
			content: `You have a new follower`,
			data: {
				followerId,
				type: 'follow',
				timestamp: new Date(),
			},
			isRead: false,
			createdAt: new Date(),
		});
	}

	async notifyRecipeCollaboration(
		recipeId: string,
		userId: string,
		role: string
	): Promise<void> {
		await this.repository.create({
			userId,
			type: 'collaboration' as const,
			content: `You've been added as a ${role} to a recipe`,
			data: {
				recipeId,
				role,
				type: 'collaboration',
				timestamp: new Date(),
			},
			isRead: false,
			createdAt: new Date(),
		});
	}
}
