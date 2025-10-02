import { IMessageRepository } from '../interfaces/repositories';
import { BaseRepository } from './BaseRepository';
import { IMessage } from '../models/Message';

export class MessageRepository
	extends BaseRepository<IMessage>
	implements IMessageRepository
{
	async findConversation(
		userId1: string,
		userId2: string
	): Promise<IMessage[]> {
		return this.model
			.find({
				$or: [
					{ senderId: userId1, recipientId: userId2 },
					{ senderId: userId2, recipientId: userId1 },
				],
			})
			.sort({ createdAt: 1 });
	}

	async markAsRead(messageId: string): Promise<IMessage | null> {
		return this.model.findByIdAndUpdate(
			messageId,
			{ isRead: true },
			{ new: true }
		);
	}
}
