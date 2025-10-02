import { IMessage } from '../models/Message';
import { BaseService } from './BaseService';
import { IMessageService } from '../interfaces/services';
import { IMessageRepository } from '../interfaces/repositories';
import {
	IModerationService,
	INotificationService,
} from '../interfaces/services';

export class MessageService
	extends BaseService<IMessage>
	implements IMessageService
{
	constructor(
		repository: IMessageRepository,
		private readonly moderationService: IModerationService,
		private readonly notificationService: INotificationService
	) {
		super(repository);
	}

	async sendMessage(
		senderId: string,
		recipientId: string,
		content: string
	): Promise<IMessage> {
		const moderationResult =
			await this.moderationService.moderateContent(content);
		if (!moderationResult.isAppropriate) {
			throw new Error(`Content moderation failed: ${moderationResult.reason}`);
		}

		const message = await this.repository.create({
			senderId,
			recipientId,
			content,
			isRead: false,
			createdAt: new Date(),
		});

		await this.notificationService.notifyNewMessage(recipientId, senderId);
		return message;
	}

	async getConversation(userId1: string, userId2: string): Promise<IMessage[]> {
		return (this.repository as IMessageRepository).findConversation(
			userId1,
			userId2
		);
	}

	async markAsRead(
		messageId: string,
		userId: string
	): Promise<IMessage | null> {
		const message = await this.repository.findById(messageId);
		if (!message || message.recipientId !== userId) {
			throw new Error('Unauthorized or message not found');
		}
		return (this.repository as IMessageRepository).markAsRead(messageId);
	}
}
