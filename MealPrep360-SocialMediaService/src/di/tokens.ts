import { Document } from 'mongoose';
import {
	IMessageService,
	INotificationService,
	IModerationService,
	IAuthService,
} from '../interfaces/services';
import { ModerationResult } from '../lib/moderation';

export abstract class MessageServiceToken implements IMessageService {
	abstract create(data: Partial<Document>): Promise<Document>;
	abstract getById(id: string): Promise<Document | null>;
	abstract update(
		id: string,
		data: Partial<Document>
	): Promise<Document | null>;
	abstract delete(id: string): Promise<boolean>;
	abstract sendMessage(
		senderId: string,
		recipientId: string,
		content: string
	): Promise<Document>;
	abstract getConversation(
		userId1: string,
		userId2: string
	): Promise<Document[]>;
	abstract markAsRead(
		messageId: string,
		userId: string
	): Promise<Document | null>;
}

export abstract class NotificationServiceToken implements INotificationService {
	abstract notifyNewMessage(
		recipientId: string,
		senderId: string
	): Promise<void>;
	abstract notifyNewComment(postId: string, commenterId: string): Promise<void>;
	abstract notifyNewFollower(userId: string, followerId: string): Promise<void>;
	abstract notifyRecipeCollaboration(
		recipeId: string,
		userId: string,
		role: string
	): Promise<void>;
}

export abstract class ModerationServiceToken implements IModerationService {
	abstract moderateContent(content: string): Promise<ModerationResult>;
	abstract reportContent(
		contentId: string,
		reporterId: string,
		reason: string
	): Promise<void>;
	abstract reviewReport(
		reportId: string,
		moderatorId: string,
		action: 'approve' | 'reject'
	): Promise<void>;
}

export abstract class AuthServiceToken implements IAuthService {
	abstract validateUser(userId: string): Promise<boolean>;
	abstract checkPermission(
		userId: string,
		resource: string,
		action: string
	): Promise<boolean>;
	abstract getUserRoles(userId: string): Promise<string[]>;
}
