import { BaseExternalService } from '../../core/services/BaseExternalService';
import { INotificationService } from '../interfaces/INotificationService';
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

export class ExternalNotificationService
	extends BaseExternalService
	implements INotificationService
{
	constructor() {
		super('notifications');
	}

	async sendNotification(
		payload: NotificationPayload
	): Promise<NotificationDeliveryResult> {
		return await this.resilientClient.post<NotificationDeliveryResult>(
			'/send',
			payload
		);
	}

	async sendBulkNotifications(
		payloads: NotificationPayload[]
	): Promise<NotificationDeliveryResult[]> {
		return await this.resilientClient.post<NotificationDeliveryResult[]>(
			'/send/bulk',
			{
				notifications: payloads,
			}
		);
	}

	async scheduleNotification(
		payload: NotificationPayload,
		scheduledTime: Date
	): Promise<string> {
		const response = await this.resilientClient.post<{ id: string }>(
			'/schedule',
			{
				payload,
				scheduledTime,
			}
		);
		return response.id;
	}

	async cancelScheduledNotification(notificationId: string): Promise<boolean> {
		await this.resilientClient.delete(`/schedule/${notificationId}`);
		return true;
	}

	async createTemplate(
		template: NotificationTemplate
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
	): Promise<INotificationTemplateDocument | null> {
		return await this.resilientClient.get<INotificationTemplateDocument | null>(
			`/templates/${templateId}`
		);
	}

	async deleteTemplate(templateId: string): Promise<boolean> {
		await this.resilientClient.delete(`/templates/${templateId}`);
		return true;
	}

	async listTemplates(filters?: {
		type?: NotificationType;
		active?: boolean;
		category?: string;
	}): Promise<INotificationTemplateDocument[]> {
		return await this.resilientClient.get<INotificationTemplateDocument[]>(
			'/templates',
			{
				params: filters,
			}
		);
	}

	async getUserPreferences(
		userId: string
	): Promise<INotificationPreferencesDocument> {
		return await this.resilientClient.get<INotificationPreferencesDocument>(
			`/preferences/${userId}`
		);
	}

	async updateUserPreferences(
		userId: string,
		preferences: Partial<NotificationPreferences>
	): Promise<INotificationPreferencesDocument> {
		return await this.resilientClient.put<INotificationPreferencesDocument>(
			`/preferences/${userId}`,
			preferences
		);
	}

	async setChannelPreference(
		userId: string,
		channel: NotificationChannel,
		enabled: boolean
	): Promise<INotificationPreferencesDocument> {
		return await this.resilientClient.put<INotificationPreferencesDocument>(
			`/preferences/${userId}/channels/${channel}`,
			{ enabled }
		);
	}

	async setTypePreference(
		userId: string,
		type: NotificationType,
		settings: {
			enabled: boolean;
			channels?: NotificationChannel[];
		}
	): Promise<INotificationPreferencesDocument> {
		return await this.resilientClient.put<INotificationPreferencesDocument>(
			`/preferences/${userId}/types/${type}`,
			settings
		);
	}

	async getUserNotifications(
		userId: string,
		filters?: {
			type?: NotificationType[];
			status?: string[];
			startDate?: Date;
			endDate?: Date;
			unreadOnly?: boolean;
		}
	): Promise<INotificationDocument[]> {
		return await this.resilientClient.get<INotificationDocument[]>(
			`/notifications/${userId}`,
			{ params: filters }
		);
	}

	async markAsRead(
		notificationId: string,
		userId: string
	): Promise<INotificationDocument> {
		return await this.resilientClient.put<INotificationDocument>(
			`/notifications/${notificationId}/read`,
			{ userId }
		);
	}

	async markAllAsRead(userId: string): Promise<number> {
		const response = await this.resilientClient.put<{ count: number }>(
			`/notifications/${userId}/read-all`
		);
		return response.count;
	}

	async archiveNotification(
		notificationId: string,
		userId: string
	): Promise<INotificationDocument> {
		return await this.resilientClient.put<INotificationDocument>(
			`/notifications/${notificationId}/archive`,
			{ userId }
		);
	}

	async generateUserDigest(
		userId: string,
		period: 'daily' | 'weekly'
	): Promise<NotificationDigest> {
		return await this.resilientClient.post<NotificationDigest>(
			'/digest/generate',
			{
				userId,
				period,
			}
		);
	}

	async scheduleDigests(
		period: 'daily' | 'weekly',
		userIds?: string[]
	): Promise<number> {
		const response = await this.resilientClient.post<{ scheduled: number }>(
			'/digest/schedule',
			{
				period,
				userIds,
			}
		);
		return response.scheduled;
	}

	async getNotificationMetrics(
		startDate: Date,
		endDate: Date
	): Promise<NotificationMetrics> {
		return await this.resilientClient.get<NotificationMetrics>('/metrics', {
			params: {
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
			},
		});
	}

	async getDeliveryStatus(
		notificationId: string
	): Promise<NotificationDeliveryResult> {
		return await this.resilientClient.get<NotificationDeliveryResult>(
			`/status/${notificationId}`
		);
	}

	async retryFailedNotifications(filters?: {
		type?: NotificationType[];
		channel?: NotificationChannel;
		startDate?: Date;
		endDate?: Date;
	}): Promise<{
		attempted: number;
		successful: number;
		failed: number;
	}> {
		return await this.resilientClient.post<{
			attempted: number;
			successful: number;
			failed: number;
		}>('/retry', filters);
	}

	async validateChannelConfig(channel: NotificationChannel): Promise<{
		isValid: boolean;
		errors?: string[];
	}> {
		return await this.resilientClient.post<{
			isValid: boolean;
			errors?: string[];
		}>('/channels/validate', {
			channel,
		});
	}

	async testChannelDelivery(
		channel: NotificationChannel,
		testPayload: NotificationPayload
	): Promise<{
		success: boolean;
		deliveryTime?: number;
		error?: string;
	}> {
		return await this.resilientClient.post<{
			success: boolean;
			deliveryTime?: number;
			error?: string;
		}>('/channels/test', {
			channel,
			payload: testPayload,
		});
	}
}
