import { Document } from 'mongoose';
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
	NotificationPriority,
	NotificationStatus,
} from './index';

export interface INotificationDocument extends Document, Notification {
	processing: {
		status: 'queued' | 'processing' | 'completed' | 'failed';
		attempts: number;
		error?: string;
		nextAttempt?: Date;
	};
	delivery: {
		channels: Record<
			NotificationChannel,
			{
				status: string;
				provider?: string;
				error?: string;
			}
		>;
		firstAttempt?: Date;
		lastAttempt?: Date;
		completedAt?: Date;
	};
	tracking: {
		delivered?: Date;
		read?: Date;
		clicked?: Date;
		device?: {
			type: string;
			os: string;
			browser?: string;
		};
		location?: {
			country?: string;
			region?: string;
			city?: string;
		};
	};
}

export interface INotificationTemplateDocument
	extends Document,
		NotificationTemplate {
	validation: {
		rules: Array<{
			type: string;
			value: any;
			message: string;
		}>;
		customLogic?: string;
	};
	versioning: {
		current: number;
		history: Array<{
			version: number;
			changes: string[];
			date: Date;
			author: string;
		}>;
	};
	usage: {
		count: number;
		lastUsed?: Date;
		successRate?: number;
		averageDeliveryTime?: number;
	};
}

export interface INotificationPreferencesDocument
	extends Document,
		NotificationPreferences {
	validation: {
		channelSettings: Record<
			NotificationChannel,
			{
				verified: boolean;
				verifiedAt?: Date;
				error?: string;
			}
		>;
		lastChecked: Date;
	};
	history: Array<{
		action: string;
		channel?: NotificationChannel;
		type?: NotificationType;
		timestamp: Date;
		changes: Record<string, any>;
	}>;
	defaults: {
		channels: NotificationChannel[];
		priority: NotificationPriority;
		schedule?: {
			timezone: string;
			preferences: Record<string, any>;
		};
	};
}

export interface INotificationDeliveryDocument
	extends Document,
		NotificationDelivery {
	routing: {
		provider: string;
		fallback?: string[];
		priority: number;
	};
	performance: {
		queueTime: number;
		processingTime: number;
		totalTime: number;
	};
	content: {
		rendered: {
			subject?: string;
			body: string;
			html?: string;
		};
		variables?: Record<string, any>;
		attachments?: Array<{
			type: string;
			url: string;
			size: number;
		}>;
	};
}

export interface INotificationBatchDocument
	extends Document,
		NotificationBatch {
	validation: {
		template?: {
			valid: boolean;
			errors?: string[];
		};
		recipients?: {
			valid: boolean;
			errors?: Array<{
				userId: string;
				error: string;
			}>;
		};
	};
	execution: {
		status: 'pending' | 'running' | 'completed' | 'failed';
		startedAt?: Date;
		completedAt?: Date;
		error?: string;
		metrics?: {
			duration: number;
			throughput: number;
			errors: number;
		};
	};
	tracking: {
		progress: number;
		estimates: {
			remainingTime: number;
			completionTime: Date;
		};
		logs: Array<{
			timestamp: Date;
			message: string;
			level: string;
		}>;
	};
}

export interface INotificationMetricsDocument
	extends Document,
		NotificationMetrics {
	trends: {
		daily: Array<{
			date: string;
			sent: number;
			delivered: number;
			read: number;
		}>;
		weekly: Array<{
			week: string;
			sent: number;
			delivered: number;
			read: number;
		}>;
	};
	analysis: {
		patterns: Array<{
			type: string;
			description: string;
			confidence: number;
			data: any;
		}>;
		recommendations: Array<{
			type: string;
			description: string;
			impact: string;
			action?: string;
		}>;
	};
	segmentation: {
		byUserType: Record<
			string,
			{
				sent: number;
				engagement: number;
			}
		>;
		byChannel: Record<
			NotificationChannel,
			{
				success: number;
				cost: number;
			}
		>;
	};
}

export interface INotificationProviderDocument
	extends Document,
		NotificationProvider {
	status: {
		available: boolean;
		lastCheck: Date;
		issues?: Array<{
			type: string;
			message: string;
			timestamp: Date;
		}>;
	};
	performance: {
		latency: {
			avg: number;
			p95: number;
			p99: number;
		};
		reliability: {
			uptime: number;
			errorRate: number;
			deliveryRate: number;
		};
		costs: {
			perMessage: number;
			monthly: number;
			currency: string;
		};
	};
	quotas: {
		daily: {
			limit: number;
			used: number;
			remaining: number;
		};
		monthly: {
			limit: number;
			used: number;
			remaining: number;
		};
		reset: {
			daily: Date;
			monthly: Date;
		};
	};
}
