import { RequestValidator } from '../../core/validation/RequestValidator';
import {
	Notification,
	NotificationTemplate,
	NotificationPreferences,
	NotificationBatch,
	NotificationProvider,
	NotificationType,
	NotificationChannel,
	NotificationPriority,
} from '../types';

export class NotificationValidator extends RequestValidator<
	Omit<Notification, 'id'>
> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) =>
				[
					'recipe_comment',
					'recipe_like',
					'meal_plan_shared',
					'shopping_list_ready',
					'subscription_expiring',
					'payment_failed',
					'system_alert',
					'feature_update',
					'security_alert',
				].includes(data.type),
			message: 'Invalid notification type',
		});

		this.addRule({
			validate: (data) => !!data.userId,
			message: 'User ID is required',
		});

		this.addRule({
			validate: (data) =>
				typeof data.title === 'string' && data.title.length >= 3,
			message: 'Title must be at least 3 characters long',
		});

		this.addRule({
			validate: (data) =>
				typeof data.content === 'string' && data.content.length >= 10,
			message: 'Content must be at least 10 characters long',
		});

		this.addRule({
			validate: (data) =>
				['low', 'medium', 'high', 'urgent'].includes(data.priority),
			message: 'Invalid priority level',
		});

		this.addRule({
			validate: (data) =>
				Array.isArray(data.channels) &&
				data.channels.length > 0 &&
				data.channels.every((channel) =>
					['email', 'push', 'sms', 'in_app', 'webhook'].includes(channel)
				),
			message: 'At least one valid channel is required',
		});
	}
}

export class NotificationTemplateValidator extends RequestValidator<
	Omit<NotificationTemplate, 'id'>
> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) =>
				typeof data.name === 'string' && data.name.length >= 3,
			message: 'Name must be at least 3 characters long',
		});

		this.addRule({
			validate: (data) =>
				[
					'recipe_comment',
					'recipe_like',
					'meal_plan_shared',
					'shopping_list_ready',
					'subscription_expiring',
					'payment_failed',
					'system_alert',
					'feature_update',
					'security_alert',
				].includes(data.type),
			message: 'Invalid notification type',
		});

		this.addRule({
			validate: (data) =>
				Array.isArray(data.channels) &&
				data.channels.length > 0 &&
				data.channels.every((channel) =>
					['email', 'push', 'sms', 'in_app', 'webhook'].includes(channel)
				),
			message: 'At least one valid channel is required',
		});

		this.addRule({
			validate: (data) =>
				typeof data.content === 'object' &&
				data.content !== null &&
				typeof data.content.body === 'string' &&
				data.content.body.length > 0,
			message: 'Content body is required',
		});

		this.addRule({
			validate: (data) =>
				Array.isArray(data.variables) &&
				data.variables.every(
					(v) =>
						typeof v.name === 'string' &&
						typeof v.type === 'string' &&
						typeof v.required === 'boolean'
				),
			message: 'Invalid variables configuration',
		});
	}
}

export class NotificationPreferencesValidator extends RequestValidator<
	Omit<NotificationPreferences, 'id'>
> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) => !!data.userId,
			message: 'User ID is required',
		});

		this.addRule({
			validate: (data) =>
				typeof data.channels === 'object' &&
				Object.entries(data.channels).every(
					([channel, config]) =>
						['email', 'push', 'sms', 'in_app', 'webhook'].includes(channel) &&
						typeof config.enabled === 'boolean'
				),
			message: 'Invalid channels configuration',
		});

		this.addRule({
			validate: (data) =>
				typeof data.types === 'object' &&
				Object.entries(data.types).every(
					([type, config]) =>
						[
							'recipe_comment',
							'recipe_like',
							'meal_plan_shared',
							'shopping_list_ready',
							'subscription_expiring',
							'payment_failed',
							'system_alert',
							'feature_update',
							'security_alert',
						].includes(type) && typeof config.enabled === 'boolean'
				),
			message: 'Invalid notification types configuration',
		});

		this.addRule({
			validate: (data) =>
				typeof data.globalSettings === 'object' &&
				(!data.globalSettings.doNotDisturb ||
					typeof data.globalSettings.doNotDisturb.enabled === 'boolean') &&
				(!data.globalSettings.batchDelivery ||
					typeof data.globalSettings.batchDelivery.enabled === 'boolean'),
			message: 'Invalid global settings configuration',
		});
	}
}

export class NotificationBatchValidator extends RequestValidator<
	Omit<NotificationBatch, 'id'>
> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) =>
				[
					'recipe_comment',
					'recipe_like',
					'meal_plan_shared',
					'shopping_list_ready',
					'subscription_expiring',
					'payment_failed',
					'system_alert',
					'feature_update',
					'security_alert',
				].includes(data.type),
			message: 'Invalid notification type',
		});

		this.addRule({
			validate: (data) =>
				Array.isArray(data.recipients) &&
				data.recipients.length > 0 &&
				data.recipients.every((r) => typeof r.userId === 'string'),
			message: 'At least one recipient is required',
		});

		this.addRule({
			validate: (data) =>
				typeof data.content === 'object' &&
				typeof data.content.template === 'string',
			message: 'Template ID is required',
		});

		this.addRule({
			validate: (data) =>
				typeof data.scheduling === 'object' &&
				data.scheduling.startAt instanceof Date &&
				(!data.scheduling.strategy ||
					['immediate', 'throttled', 'scheduled'].includes(
						data.scheduling.strategy
					)),
			message: 'Invalid scheduling configuration',
		});
	}
}

export class NotificationProviderValidator extends RequestValidator<
	Omit<NotificationProvider, 'id'>
> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) =>
				typeof data.name === 'string' && data.name.length >= 3,
			message: 'Name must be at least 3 characters long',
		});

		this.addRule({
			validate: (data) =>
				['email', 'push', 'sms', 'in_app', 'webhook'].includes(data.channel),
			message: 'Invalid notification channel',
		});

		this.addRule({
			validate: (data) =>
				typeof data.credentials === 'object' && data.credentials !== null,
			message: 'Provider credentials are required',
		});

		this.addRule({
			validate: (data) =>
				typeof data.settings === 'object' &&
				typeof data.settings.enabled === 'boolean' &&
				typeof data.settings.priority === 'number',
			message: 'Invalid provider settings',
		});

		this.addRule({
			validate: (data) =>
				typeof data.capabilities === 'object' &&
				Object.values(data.capabilities).every((v) => typeof v === 'boolean'),
			message: 'Invalid capabilities configuration',
		});
	}
}
