import { RequestValidator } from '../../core/validation/RequestValidator';
import {
	NotificationPayload,
	NotificationTemplate,
	NotificationPreferences,
} from '../types';

export class NotificationPayloadValidator extends RequestValidator<NotificationPayload> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) => !!data.template,
			message: 'Template ID is required',
		});

		this.addRule({
			validate: (data) => !!data.userId,
			message: 'User ID is required',
		});

		this.addRule({
			validate: (data) =>
				typeof data.variables === 'object' && data.variables !== null,
			message: 'Variables must be an object',
		});

		this.addRule({
			validate: (data) => {
				if (!data.priority) return true;
				return ['low', 'medium', 'high', 'urgent'].includes(data.priority);
			},
			message: 'Invalid priority level',
		});

		this.addRule({
			validate: (data) => {
				if (!data.channels) return true;
				return data.channels.every((channel) =>
					['email', 'push', 'in_app', 'sms'].includes(channel)
				);
			},
			message: 'Invalid notification channel',
		});
	}
}

export class NotificationTemplateValidator extends RequestValidator<NotificationTemplate> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) => !!data.type,
			message: 'Notification type is required',
		});

		this.addRule({
			validate: (data) => !!data.name && data.name.length >= 3,
			message: 'Name must be at least 3 characters long',
		});

		this.addRule({
			validate: (data) => !!data.content?.body,
			message: 'Body template is required',
		});

		this.addRule({
			validate: (data) =>
				Array.isArray(data.variables) &&
				data.variables.every((v) => typeof v === 'string'),
			message: 'Variables must be an array of strings',
		});

		this.addRule({
			validate: (data) =>
				Array.isArray(data.channels) && data.channels.length > 0,
			message: 'At least one channel is required',
		});

		this.addRule({
			validate: (data) =>
				!data.settings?.priority ||
				['low', 'medium', 'high', 'urgent'].includes(data.settings.priority),
			message: 'Invalid default priority',
		});
	}
}

export class NotificationPreferencesValidator extends RequestValidator<NotificationPreferences> {
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
			validate: (data) => {
				const channels = data.channels;
				return Object.entries(channels).every(
					([channel, settings]) =>
						['email', 'push', 'in_app', 'sms'].includes(channel) &&
						typeof settings.enabled === 'boolean'
				);
			},
			message: 'Invalid channel settings',
		});

		this.addRule({
			validate: (data) => {
				if (!data.channels) return true;
				return Object.values(data.channels).every((channel) => {
					if (!channel.schedule?.startTime || !channel.schedule?.endTime)
						return true;
					return (
						/^([01]\d|2[0-3]):([0-5]\d)$/.test(channel.schedule.startTime) &&
						/^([01]\d|2[0-3]):([0-5]\d)$/.test(channel.schedule.endTime)
					);
				});
			},
			message: 'Invalid quiet hours format (use HH:mm)',
		});

		this.addRule({
			validate: (data) => {
				if (!data.globalSettings?.batchDelivery?.frequency) return true;
				return ['hourly', 'daily', 'weekly'].includes(
					data.globalSettings.batchDelivery.frequency
				);
			},
			message: 'Invalid digest frequency',
		});
	}
}
