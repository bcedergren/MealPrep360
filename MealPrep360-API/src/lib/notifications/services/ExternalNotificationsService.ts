import { BaseExternalService } from '../../core/services/BaseExternalService';
import { INotificationsService } from '../interfaces/INotificationsService';
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

export class ExternalNotificationsService
	extends BaseExternalService
	implements INotificationsService
{
	constructor() {
		super('notifications');
	}

	// Notification Management
	async sendNotification(
		notification: Omit<Notification, 'id'>
	): Promise<INotificationDocument> {
		return await this.resilientClient.post<INotificationDocument>(
			'/notifications',
			notification
		);
	}

	async getNotification(
		notificationId: string
	): Promise<INotificationDocument> {
		return await this.resilientClient.get<INotificationDocument>(
			`/notifications/${notificationId}`
		);
	}

	async listNotifications(filters?: {
		userId?: string;
		type?: NotificationType;
		status?: NotificationStatus;
		channel?: NotificationChannel;
		startDate?: Date;
		endDate?: Date;
	}): Promise<INotificationDocument[]> {
		return await this.resilientClient.get<INotificationDocument[]>(
			'/notifications',
			{
				params: {
					...filters,
					startDate: filters?.startDate?.toISOString(),
					endDate: filters?.endDate?.toISOString(),
				},
			}
		);
	}

	async updateNotificationStatus(
		notificationId: string,
		status: NotificationStatus
	): Promise<INotificationDocument> {
		return await this.resilientClient.put<INotificationDocument>(
			`/notifications/${notificationId}/status`,
			{ status }
		);
	}

	async deleteNotification(notificationId: string): Promise<void> {
		await this.resilientClient.delete(`/notifications/${notificationId}`);
	}

	// Template Management
	async createTemplate(
		template: Omit<NotificationTemplate, 'id'>
	): Promise<INotificationTemplateDocument> {
		return await this.resilientClient.post<INotificationTemplateDocument>(
			'/templates',
			template
		);
	}

	async updateTemplate(
		templateId: string,
		updates: Partial<NotificationTemplate>
	): Promise<INotificationTemplateDocument> {
		return await this.resilientClient.put<INotificationTemplateDocument>(
			`/templates/${templateId}`,
			updates
		);
	}

	async getTemplate(
		templateId: string
	): Promise<INotificationTemplateDocument> {
		return await this.resilientClient.get<INotificationTemplateDocument>(
			`/templates/${templateId}`
		);
	}

	async listTemplates(filters?: {
		type?: NotificationType;
		channel?: NotificationChannel;
		search?: string;
	}): Promise<INotificationTemplateDocument[]> {
		return await this.resilientClient.get<INotificationTemplateDocument[]>(
			'/templates',
			{
				params: filters,
			}
		);
	}

	async deleteTemplate(templateId: string): Promise<void> {
		await this.resilientClient.delete(`/templates/${templateId}`);
	}

	async renderTemplate(
		templateId: string,
		data: Record<string, any>
	): Promise<{
		subject?: string;
		body: string;
		html?: string;
	}> {
		return await this.resilientClient.post<{
			subject?: string;
			body: string;
			html?: string;
		}>(`/templates/${templateId}/render`, data);
	}

	// Preferences Management
	async setPreferences(
		preferences: Omit<NotificationPreferences, 'id'>
	): Promise<INotificationPreferencesDocument> {
		return await this.resilientClient.post<INotificationPreferencesDocument>(
			'/preferences',
			preferences
		);
	}

	async updatePreferences(
		userId: string,
		updates: Partial<NotificationPreferences>
	): Promise<INotificationPreferencesDocument> {
		return await this.resilientClient.put<INotificationPreferencesDocument>(
			`/preferences/${userId}`,
			updates
		);
	}

	async getPreferences(
		userId: string
	): Promise<INotificationPreferencesDocument> {
		return await this.resilientClient.get<INotificationPreferencesDocument>(
			`/preferences/${userId}`
		);
	}

	async getChannelPreferences(
		userId: string,
		channel: NotificationChannel
	): Promise<{
		enabled: boolean;
		settings?: Record<string, any>;
	}> {
		return await this.resilientClient.get<{
			enabled: boolean;
			settings?: Record<string, any>;
		}>(`/preferences/${userId}/channels/${channel}`);
	}

	async validateChannelSettings(
		userId: string,
		channel: NotificationChannel,
		settings: Record<string, any>
	): Promise<{
		valid: boolean;
		errors?: string[];
	}> {
		return await this.resilientClient.post<{
			valid: boolean;
			errors?: string[];
		}>(`/preferences/${userId}/channels/${channel}/validate`, settings);
	}

	// Delivery Management
	async trackDelivery(
		delivery: Omit<NotificationDelivery, 'id'>
	): Promise<INotificationDeliveryDocument> {
		return await this.resilientClient.post<INotificationDeliveryDocument>(
			'/deliveries',
			delivery
		);
	}

	async getDeliveryStatus(
		deliveryId: string
	): Promise<INotificationDeliveryDocument> {
		return await this.resilientClient.get<INotificationDeliveryDocument>(
			`/deliveries/${deliveryId}`
		);
	}

	async listDeliveries(filters?: {
		notificationId?: string;
		channel?: NotificationChannel;
		status?: string;
	}): Promise<INotificationDeliveryDocument[]> {
		return await this.resilientClient.get<INotificationDeliveryDocument[]>(
			'/deliveries',
			{
				params: filters,
			}
		);
	}

	async retryDelivery(
		deliveryId: string,
		options?: {
			channel?: NotificationChannel;
			provider?: string;
		}
	): Promise<INotificationDeliveryDocument> {
		return await this.resilientClient.post<INotificationDeliveryDocument>(
			`/deliveries/${deliveryId}/retry`,
			options
		);
	}

	// Batch Operations
	async createBatch(
		batch: Omit<NotificationBatch, 'id'>
	): Promise<INotificationBatchDocument> {
		return await this.resilientClient.post<INotificationBatchDocument>(
			'/batches',
			batch
		);
	}

	async getBatchStatus(batchId: string): Promise<INotificationBatchDocument> {
		return await this.resilientClient.get<INotificationBatchDocument>(
			`/batches/${batchId}`
		);
	}

	async listBatches(filters?: {
		type?: NotificationType;
		status?: string;
		startDate?: Date;
		endDate?: Date;
	}): Promise<INotificationBatchDocument[]> {
		return await this.resilientClient.get<INotificationBatchDocument[]>(
			'/batches',
			{
				params: {
					...filters,
					startDate: filters?.startDate?.toISOString(),
					endDate: filters?.endDate?.toISOString(),
				},
			}
		);
	}

	async cancelBatch(batchId: string): Promise<void> {
		await this.resilientClient.post(`/batches/${batchId}/cancel`);
	}

	async pauseBatch(batchId: string): Promise<INotificationBatchDocument> {
		return await this.resilientClient.post<INotificationBatchDocument>(
			`/batches/${batchId}/pause`
		);
	}

	async resumeBatch(batchId: string): Promise<INotificationBatchDocument> {
		return await this.resilientClient.post<INotificationBatchDocument>(
			`/batches/${batchId}/resume`
		);
	}

	// Provider Management
	async registerProvider(
		provider: Omit<NotificationProvider, 'id'>
	): Promise<INotificationProviderDocument> {
		return await this.resilientClient.post<INotificationProviderDocument>(
			'/providers',
			provider
		);
	}

	async updateProvider(
		providerId: string,
		updates: Partial<NotificationProvider>
	): Promise<INotificationProviderDocument> {
		return await this.resilientClient.put<INotificationProviderDocument>(
			`/providers/${providerId}`,
			updates
		);
	}

	async getProvider(
		providerId: string
	): Promise<INotificationProviderDocument> {
		return await this.resilientClient.get<INotificationProviderDocument>(
			`/providers/${providerId}`
		);
	}

	async listProviders(filters?: {
		channel?: NotificationChannel;
		enabled?: boolean;
	}): Promise<INotificationProviderDocument[]> {
		return await this.resilientClient.get<INotificationProviderDocument[]>(
			'/providers',
			{
				params: filters,
			}
		);
	}

	async testProvider(
		providerId: string,
		testData?: Record<string, any>
	): Promise<{
		success: boolean;
		latency?: number;
		error?: string;
	}> {
		return await this.resilientClient.post<{
			success: boolean;
			latency?: number;
			error?: string;
		}>(`/providers/${providerId}/test`, testData);
	}

	// Analytics & Metrics
	async getNotificationMetrics(
		startDate: Date,
		endDate: Date,
		filters?: {
			type?: NotificationType;
			channel?: NotificationChannel;
			userId?: string;
		}
	): Promise<INotificationMetricsDocument> {
		return await this.resilientClient.get<INotificationMetricsDocument>(
			'/metrics',
			{
				params: {
					startDate: startDate.toISOString(),
					endDate: endDate.toISOString(),
					...filters,
				},
			}
		);
	}

	async getDeliveryMetrics(
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
	}> {
		return await this.resilientClient.get<{
			total: number;
			successful: number;
			failed: number;
			avgDeliveryTime: number;
			errors: Array<{
				type: string;
				count: number;
				percentage: number;
			}>;
		}>('/metrics/delivery', {
			params: {
				channel,
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
			},
		});
	}

	async getUserEngagement(
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
	}> {
		return await this.resilientClient.get<{
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
		}>(`/metrics/users/${userId}/engagement`, {
			params: {
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
			},
		});
	}

	// Error Handling
	async handleNotificationError(
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
	}> {
		return await this.resilientClient.post<{
			handled: boolean;
			action?: 'retry' | 'fail' | 'ignore';
			fallback?: {
				type: string;
				value: any;
			};
		}>('/errors', {
			error: {
				message: error.message,
				stack: error.stack,
			},
			context,
		});
	}
}
