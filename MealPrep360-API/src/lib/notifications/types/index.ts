export type NotificationType =
	| 'recipe_comment'
	| 'recipe_like'
	| 'meal_plan_shared'
	| 'shopping_list_ready'
	| 'subscription_expiring'
	| 'payment_failed'
	| 'system_alert'
	| 'feature_update'
	| 'security_alert';

export type NotificationChannel =
	| 'email'
	| 'push'
	| 'sms'
	| 'in_app'
	| 'webhook';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationStatus =
	| 'pending'
	| 'sent'
	| 'delivered'
	| 'failed'
	| 'read'
	| 'archived';

export interface Notification {
	type: NotificationType;
	userId: string;
	title: string;
	content: string;
	priority: NotificationPriority;
	status: NotificationStatus;
	channels: NotificationChannel[];
	data?: {
		entityType?: string;
		entityId?: string;
		action?: string;
		[key: string]: any;
	};
	metadata?: {
		sender?: string;
		template?: string;
		version?: string;
		[key: string]: any;
	};
	scheduling?: {
		sendAt?: Date;
		expireAt?: Date;
		timezone?: string;
	};
}

export interface NotificationTemplate {
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
}

export interface NotificationPreferences {
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
}

export interface NotificationDelivery {
	notificationId: string;
	channel: NotificationChannel;
	status: 'pending' | 'sent' | 'delivered' | 'failed';
	attempts: Array<{
		timestamp: Date;
		status: string;
		error?: string;
		provider?: string;
		metadata?: Record<string, any>;
	}>;
	tracking?: {
		deliveredAt?: Date;
		readAt?: Date;
		clickedAt?: Date;
		interactionType?: string;
	};
}

export interface NotificationBatch {
	type: NotificationType;
	recipients: Array<{
		userId: string;
		data?: Record<string, any>;
		status?: string;
	}>;
	content: {
		template: string;
		variables?: Record<string, any>;
	};
	scheduling: {
		startAt: Date;
		endAt?: Date;
		timezone?: string;
		strategy?: 'immediate' | 'throttled' | 'scheduled';
	};
	progress: {
		total: number;
		sent: number;
		failed: number;
		remaining: number;
	};
}

export interface NotificationMetrics {
	period: {
		start: Date;
		end: Date;
	};
	delivery: {
		total: number;
		byStatus: Record<NotificationStatus, number>;
		byType: Record<NotificationType, number>;
		byChannel: Record<NotificationChannel, number>;
	};
	performance: {
		averageDeliveryTime: number;
		deliverySuccess: number;
		readRate: number;
		clickRate: number;
		errorRate: number;
	};
	engagement: {
		byType: Record<
			NotificationType,
			{
				sent: number;
				read: number;
				clicked: number;
			}
		>;
		byTime: Array<{
			hour: number;
			sent: number;
			engagement: number;
		}>;
		topRecipients: Array<{
			userId: string;
			received: number;
			engaged: number;
		}>;
	};
}

export interface NotificationPayload {
	userId: string;
	type: NotificationType;
	title: string;
	content: string;
	channels?: NotificationChannel[];
	data?: Record<string, any>;
	template?: string;
	variables?: Record<string, any>;
	priority?: NotificationPriority;
	scheduling?: {
		sendAt?: Date;
		expireAt?: Date;
		timezone?: string;
	};
}

export interface NotificationDeliveryResult {
	id: string;
	status: NotificationStatus;
	channels: Array<{
		type: NotificationChannel;
		status: 'success' | 'failed';
		error?: string;
		timestamp: Date;
	}>;
	metadata?: Record<string, any>;
}

export interface NotificationDigest {
	userId: string;
	period: 'daily' | 'weekly';
	notifications: Array<{
		id: string;
		type: NotificationType;
		title: string;
		content: string;
		timestamp: Date;
		data?: Record<string, any>;
	}>;
	summary: {
		total: number;
		byType: Record<NotificationType, number>;
		topSenders?: Array<{
			id: string;
			name: string;
			count: number;
		}>;
	};
	generatedAt: Date;
}

export interface NotificationProvider {
	name: string;
	channel: NotificationChannel;
	credentials: {
		apiKey?: string;
		apiSecret?: string;
		[key: string]: any;
	};
	settings: {
		enabled: boolean;
		priority: number;
		rateLimits?: {
			perSecond?: number;
			perMinute?: number;
			perHour?: number;
		};
		retryPolicy?: {
			maxAttempts: number;
			backoffDelay: number;
		};
	};
	capabilities: {
		templates?: boolean;
		scheduling?: boolean;
		tracking?: boolean;
		batching?: boolean;
		attachments?: boolean;
	};
	metadata?: {
		version?: string;
		region?: string;
		features?: string[];
		[key: string]: any;
	};
}
