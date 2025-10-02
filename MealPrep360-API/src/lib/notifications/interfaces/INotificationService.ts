import {
	NotificationPayload,
	NotificationTemplate,
	NotificationPreferences,
	NotificationDeliveryResult,
	NotificationDigest,
	NotificationMetrics,
	NotificationType,
	NotificationChannel,
} from '../types';
import {
	INotificationDocument,
	INotificationTemplateDocument,
	INotificationPreferencesDocument,
} from '../types/notification';

export interface INotificationService {
	// Notification Management
	sendNotification(
		payload: NotificationPayload
	): Promise<NotificationDeliveryResult>;
	sendBulkNotifications(
		payloads: NotificationPayload[]
	): Promise<NotificationDeliveryResult[]>;
	scheduleNotification(
		payload: NotificationPayload,
		scheduledTime: Date
	): Promise<string>;
	cancelScheduledNotification(notificationId: string): Promise<boolean>;

	// Template Management
	createTemplate(
		template: NotificationTemplate
	): Promise<INotificationTemplateDocument>;
	updateTemplate(
		templateId: string,
		updates: Partial<NotificationTemplate>
	): Promise<INotificationTemplateDocument>;
	getTemplate(
		templateId: string
	): Promise<INotificationTemplateDocument | null>;
	deleteTemplate(templateId: string): Promise<boolean>;
	listTemplates(filters?: {
		type?: NotificationType;
		active?: boolean;
		category?: string;
	}): Promise<INotificationTemplateDocument[]>;

	// Preferences Management
	getUserPreferences(userId: string): Promise<INotificationPreferencesDocument>;
	updateUserPreferences(
		userId: string,
		preferences: Partial<NotificationPreferences>
	): Promise<INotificationPreferencesDocument>;
	setChannelPreference(
		userId: string,
		channel: NotificationChannel,
		enabled: boolean
	): Promise<INotificationPreferencesDocument>;
	setTypePreference(
		userId: string,
		type: NotificationType,
		settings: {
			enabled: boolean;
			channels?: NotificationChannel[];
		}
	): Promise<INotificationPreferencesDocument>;

	// Notification History
	getUserNotifications(
		userId: string,
		filters?: {
			type?: NotificationType[];
			status?: string[];
			startDate?: Date;
			endDate?: Date;
			unreadOnly?: boolean;
		}
	): Promise<INotificationDocument[]>;
	markAsRead(
		notificationId: string,
		userId: string
	): Promise<INotificationDocument>;
	markAllAsRead(userId: string): Promise<number>;
	archiveNotification(
		notificationId: string,
		userId: string
	): Promise<INotificationDocument>;

	// Digest Generation
	generateUserDigest(
		userId: string,
		period: 'daily' | 'weekly'
	): Promise<NotificationDigest>;
	scheduleDigests(
		period: 'daily' | 'weekly',
		userIds?: string[]
	): Promise<number>;

	// Analytics & Monitoring
	getNotificationMetrics(
		startDate: Date,
		endDate: Date
	): Promise<NotificationMetrics>;
	getDeliveryStatus(
		notificationId: string
	): Promise<NotificationDeliveryResult>;
	retryFailedNotifications(filters?: {
		type?: NotificationType[];
		channel?: NotificationChannel;
		startDate?: Date;
		endDate?: Date;
	}): Promise<{
		attempted: number;
		successful: number;
		failed: number;
	}>;

	// Channel Management
	validateChannelConfig(channel: NotificationChannel): Promise<{
		isValid: boolean;
		errors?: string[];
	}>;
	testChannelDelivery(
		channel: NotificationChannel,
		testPayload: NotificationPayload
	): Promise<{
		success: boolean;
		deliveryTime?: number;
		error?: string;
	}>;
}
