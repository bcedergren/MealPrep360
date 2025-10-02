import { Document } from 'mongoose';
import {
	NotificationType,
	NotificationChannel,
	NotificationStatus,
	NotificationPriority,
	NotificationTemplate,
	NotificationPreferences,
} from './index';

export interface INotificationDocument extends Document {
	userId: string;
	templateId: string;
	type: NotificationType;
	channels: NotificationChannel[];
	status: NotificationStatus;
	priority: NotificationPriority;
	content: {
		subject?: string;
		body: string;
		html?: string;
	};
	metadata?: {
		link?: string;
		imageUrl?: string;
		actionButtons?: Array<{
			text: string;
			action: string;
			style?: 'primary' | 'secondary' | 'danger';
		}>;
		expiresAt?: Date;
		category?: string;
		[key: string]: any;
	};
	deliveryAttempts: Array<{
		channel: NotificationChannel;
		timestamp: Date;
		status: NotificationStatus;
		error?: {
			code: string;
			message: string;
			details?: any;
		};
	}>;
	readAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface INotificationTemplateDocument extends Document {
	name: string;
	type: NotificationType;
	channels: NotificationChannel[];
	content: {
		subject?: string;
		body: string;
		html?: string;
		push?: {
			title: string;
			body: string;
		};
		sms?: string;
	};
	variables: Array<{
		name: string;
		type: string;
		required: boolean;
		defaultValue?: any;
		validation?: {
			pattern?: string;
			min?: number;
			max?: number;
			enum?: string[];
		};
	}>;
	settings?: {
		priority?: NotificationPriority;
		retryPolicy?: {
			maxAttempts: number;
			backoffDelay: number;
		};
		rateLimits?: {
			perUser: number;
			perHour: number;
		};
	};
	version: number;
	createdBy: string;
	updatedBy: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface INotificationPreferencesDocument extends Document {
	userId: string;
	channels: Record<
		NotificationChannel,
		{
			enabled: boolean;
			schedule?: {
				days: number[];
				startTime?: string;
				endTime?: string;
				timezone?: string;
			};
			settings?: {
				email?: string;
				phone?: string;
				deviceTokens?: string[];
				webhookUrl?: string;
			};
		}
	>;
	types: Record<
		NotificationType,
		{
			enabled: boolean;
			channels?: NotificationChannel[];
			priority?: NotificationPriority;
		}
	>;
	globalSettings: {
		doNotDisturb?: {
			enabled: boolean;
			startTime?: string;
			endTime?: string;
			timezone?: string;
		};
		batchDelivery?: {
			enabled: boolean;
			frequency: 'hourly' | 'daily' | 'weekly';
			time?: string;
			days?: number[];
		};
		urgentOverride?: boolean;
	};
	lastUpdated: Date;
}
