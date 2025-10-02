import { RequestValidator } from '../../core/validation/RequestValidator';

export class AnalyticsQueryValidator extends RequestValidator<{
	type?: string;
	userId?: string;
	sessionId?: string;
	startDate?: Date;
	endDate?: Date;
	metrics?: string[];
	dimensions?: string[];
	filters?: Record<string, any>;
	limit?: number;
	offset?: number;
}> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) => !data.type || typeof data.type === 'string',
			message: 'Type must be a string',
		});

		this.addRule({
			validate: (data) => !data.userId || typeof data.userId === 'string',
			message: 'User ID must be a string',
		});

		this.addRule({
			validate: (data) => !data.sessionId || typeof data.sessionId === 'string',
			message: 'Session ID must be a string',
		});

		this.addRule({
			validate: (data) => !data.startDate || data.startDate instanceof Date,
			message: 'Start date must be a valid date',
		});

		this.addRule({
			validate: (data) => !data.endDate || data.endDate instanceof Date,
			message: 'End date must be a valid date',
		});

		this.addRule({
			validate: (data) =>
				!data.metrics ||
				(Array.isArray(data.metrics) &&
					data.metrics.every((m) => typeof m === 'string')),
			message: 'Metrics must be an array of strings',
		});

		this.addRule({
			validate: (data) =>
				!data.dimensions ||
				(Array.isArray(data.dimensions) &&
					data.dimensions.every((d) => typeof d === 'string')),
			message: 'Dimensions must be an array of strings',
		});

		this.addRule({
			validate: (data) =>
				!data.filters ||
				(typeof data.filters === 'object' && data.filters !== null),
			message: 'Filters must be an object',
		});

		this.addRule({
			validate: (data) =>
				!data.limit || (typeof data.limit === 'number' && data.limit > 0),
			message: 'Limit must be a positive number',
		});

		this.addRule({
			validate: (data) =>
				!data.offset || (typeof data.offset === 'number' && data.offset >= 0),
			message: 'Offset must be a non-negative number',
		});
	}
}

export class AnalyticsReportValidator extends RequestValidator<{
	name: string;
	description: string;
	type: string;
	metrics: string[];
	dimensions?: string[];
	filters?: Record<string, any>;
	schedule?: {
		frequency: string;
		startDate: Date;
		endDate?: Date;
		timezone: string;
	};
	delivery?: {
		type: 'email' | 'webhook' | 'storage';
		config: Record<string, any>;
	};
}> {
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
				typeof data.description === 'string' && data.description.length >= 10,
			message: 'Description must be at least 10 characters long',
		});

		this.addRule({
			validate: (data) => typeof data.type === 'string',
			message: 'Type is required',
		});

		this.addRule({
			validate: (data) =>
				Array.isArray(data.metrics) &&
				data.metrics.length > 0 &&
				data.metrics.every((m) => typeof m === 'string'),
			message: 'At least one metric is required',
		});

		this.addRule({
			validate: (data) =>
				!data.dimensions ||
				(Array.isArray(data.dimensions) &&
					data.dimensions.every((d) => typeof d === 'string')),
			message: 'Dimensions must be an array of strings',
		});

		this.addRule({
			validate: (data) =>
				!data.filters ||
				(typeof data.filters === 'object' && data.filters !== null),
			message: 'Filters must be an object',
		});

		this.addRule({
			validate: (data) =>
				!data.schedule ||
				(typeof data.schedule === 'object' &&
					typeof data.schedule.frequency === 'string' &&
					data.schedule.startDate instanceof Date &&
					(!data.schedule.endDate || data.schedule.endDate instanceof Date) &&
					typeof data.schedule.timezone === 'string'),
			message: 'Invalid schedule configuration',
		});

		this.addRule({
			validate: (data) =>
				!data.delivery ||
				(typeof data.delivery === 'object' &&
					['email', 'webhook', 'storage'].includes(data.delivery.type) &&
					typeof data.delivery.config === 'object' &&
					data.delivery.config !== null),
			message: 'Invalid delivery configuration',
		});
	}
}
