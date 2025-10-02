import { Document } from 'mongoose';
import { ModerationResult } from '../lib/moderation';

export interface IBaseService<T extends Document> {
	create(data: Partial<T>): Promise<T>;
	getById(id: string): Promise<T | null>;
	update(id: string, data: Partial<T>): Promise<T | null>;
	delete(id: string): Promise<boolean>;
}

export interface IMessageService extends IBaseService<Document> {
	sendMessage(
		senderId: string,
		recipientId: string,
		content: string
	): Promise<Document>;
	getConversation(userId1: string, userId2: string): Promise<Document[]>;
	markAsRead(messageId: string, userId: string): Promise<Document | null>;
}

export interface INotificationService {
	notifyNewMessage(recipientId: string, senderId: string): Promise<void>;
	notifyNewComment(postId: string, commenterId: string): Promise<void>;
	notifyNewFollower(userId: string, followerId: string): Promise<void>;
	notifyRecipeCollaboration(
		recipeId: string,
		userId: string,
		role: string
	): Promise<void>;
}

export interface IModerationService {
	moderateContent(content: string): Promise<ModerationResult>;
	reportContent(
		contentId: string,
		reporterId: string,
		reason: string
	): Promise<void>;
	reviewReport(
		reportId: string,
		moderatorId: string,
		action: 'approve' | 'reject'
	): Promise<void>;
}

export interface IAuthService {
	validateUser(userId: string): Promise<boolean>;
	checkPermission(
		userId: string,
		resource: string,
		action: string
	): Promise<boolean>;
	getUserRoles(userId: string): Promise<string[]>;
}
