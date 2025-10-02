import {
	Notification,
	NotificationTemplate,
	NotificationPreferences,
	NotificationDelivery,
	NotificationBatch,
	NotificationMetrics,
	NotificationProvider,
	NotificationType,
	NotificationChannel,
	NotificationStatus,
} from '../types';
import {
	INotificationDocument,
	INotificationTemplateDocument,
	INotificationPreferencesDocument,
	INotificationDeliveryDocument,
	INotificationBatchDocument,
	INotificationMetricsDocument,
	INotificationProviderDocument,
} from '../types/notifications';

export interface INotificationsService {
	// Notification Management
	sendNotification(
		notification: Omit<Notification, 'id'>
	): Promise<INotificationDocument>;
	getNotification(notificationId: string): Promise<INotificationDocument>;
	listNotifications(filters?: {
		userId?: string;
		type?: NotificationType;
		status?: NotificationStatus;
		channel?: NotificationChannel;
		startDate?: Date;
		endDate?: Date;
	}): Promise<INotificationDocument[]>;
	updateNotificationStatus(
		notificationId: string,
		status: NotificationStatus
	): Promise<INotificationDocument>;
	deleteNotification(notificationId: string): Promise<void>;

	// Template Management
	createTemplate(
		template: Omit<NotificationTemplate, 'id'>
	): Promise<INotificationTemplateDocument>;
	updateTemplate(
		templateId: string,
		updates: Partial<NotificationTemplate>
	): Promise<INotificationTemplateDocument>;
	getTemplate(templateId: string): Promise<INotificationTemplateDocument>;
	listTemplates(filters?: {
		type?: NotificationType;
		channel?: NotificationChannel;
		search?: string;
	}): Promise<INotificationTemplateDocument[]>;
	deleteTemplate(templateId: string): Promise<void>;
	renderTemplate(
		templateId: string,
		data: Record<string, any>
	): Promise<{
		subject?: string;
		body: string;
		html?: string;
	}>;

	// Preferences Management
	setPreferences(
		preferences: Omit<NotificationPreferences, 'id'>
	): Promise<INotificationPreferencesDocument>;
	updatePreferences(
		userId: string,
		updates: Partial<NotificationPreferences>
	): Promise<INotificationPreferencesDocument>;
	getPreferences(userId: string): Promise<INotificationPreferencesDocument>;
	getChannelPreferences(
		userId: string,
		channel: NotificationChannel
	): Promise<{
		enabled: boolean;
		settings?: Record<string, any>;
	}>;
	validateChannelSettings(
		userId: string,
		channel: NotificationChannel,
		settings: Record<string, any>
	): Promise<{
		valid: boolean;
		errors?: string[];
	}>;

	// Delivery Management
	trackDelivery(
		delivery: Omit<NotificationDelivery, 'id'>
	): Promise<INotificationDeliveryDocument>;
	getDeliveryStatus(deliveryId: string): Promise<INotificationDeliveryDocument>;
	listDeliveries(filters?: {
		notificationId?: string;
		channel?: NotificationChannel;
		status?: string;
	}): Promise<INotificationDeliveryDocument[]>;
	retryDelivery(
		deliveryId: string,
		options?: {
			channel?: NotificationChannel;
			provider?: string;
		}
	): Promise<INotificationDeliveryDocument>;

	// Batch Operations
	createBatch(
		batch: Omit<NotificationBatch, 'id'>
	): Promise<INotificationBatchDocument>;
	getBatchStatus(batchId: string): Promise<INotificationBatchDocument>;
	listBatches(filters?: {
		type?: NotificationType;
		status?: string;
		startDate?: Date;
		endDate?: Date;
	}): Promise<INotificationBatchDocument[]>;
	cancelBatch(batchId: string): Promise<void>;
	pauseBatch(batchId: string): Promise<INotificationBatchDocument>;
	resumeBatch(batchId: string): Promise<INotificationBatchDocument>;

	// Provider Management
	registerProvider(
		provider: Omit<NotificationProvider, 'id'>
	): Promise<INotificationProviderDocument>;
	updateProvider(
		providerId: string,
		updates: Partial<NotificationProvider>
	): Promise<INotificationProviderDocument>;
	getProvider(providerId: string): Promise<INotificationProviderDocument>;
	listProviders(filters?: {
		channel?: NotificationChannel;
		enabled?: boolean;
	}): Promise<INotificationProviderDocument[]>;
	testProvider(
		providerId: string,
		testData?: Record<string, any>
	): Promise<{
		success: boolean;
		latency?: number;
		error?: string;
	}>;

	// Analytics & Metrics
	getNotificationMetrics(
		startDate: Date,
		endDate: Date,
		filters?: {
			type?: NotificationType;
			channel?: NotificationChannel;
			userId?: string;
		}
	): Promise<INotificationMetricsDocument>;

	getDeliveryMetrics(
		channel: NotificationChannel,
		startDate: Date,
		endDate: Date
	): Promise<{
		total: number;
		successful: number;
		failed: number;
		avgDeliveryTime: number;
		errors: Array<{
			type: string;
			count: number;
			percentage: number;
		}>;
	}>;

	getUserEngagement(
		userId: string,
		startDate: Date,
		endDate: Date
	): Promise<{
		received: number;
		read: number;
		clicked: number;
		byType: Record<
			NotificationType,
			{
				sent: number;
				engagement: number;
			}
		>;
		preferences: {
			channels: NotificationChannel[];
			activeHours: number[];
			topTypes: NotificationType[];
		};
	}>;

	// Error Handling
	handleNotificationError(
		error: Error,
		context: {
			operation: string;
			notificationId?: string;
			userId?: string;
			data?: any;
		}
	): Promise<{
		handled: boolean;
		action?: 'retry' | 'fail' | 'ignore';
		fallback?: {
			type: string;
			value: any;
		};
	}>;
}
