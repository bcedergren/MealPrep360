import { RequestValidator } from '../../core/validation/RequestValidator';
import { Integration, SyncJob } from '../interfaces/IIntegrationService';

export class IntegrationValidator extends RequestValidator<
	Omit<Integration, 'id' | 'userId'>
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
			validate: (data) => typeof data.type === 'string',
			message: 'Integration type is required',
		});

		this.addRule({
			validate: (data) => typeof data.provider === 'string',
			message: 'Provider is required',
		});

		this.addRule({
			validate: (data) =>
				typeof data.config === 'object' && data.config !== null,
			message: 'Configuration must be an object',
		});

		this.addRule({
			validate: (data) => typeof data.enabled === 'boolean',
			message: 'Enabled flag must be a boolean',
		});

		this.addRule({
			validate: (data) => ['active', 'inactive', 'error'].includes(data.status),
			message: 'Invalid status',
		});

		this.addRule({
			validate: (data) =>
				typeof data.settings === 'object' && data.settings !== null,
			message: 'Settings must be an object',
		});

		this.addRule({
			validate: (data) =>
				Array.isArray(data.scopes) &&
				data.scopes.every((s) => typeof s === 'string'),
			message: 'Scopes must be an array of strings',
		});

		this.addRule({
			validate: (data) =>
				!data.credentials ||
				(typeof data.credentials === 'object' && data.credentials !== null),
			message: 'Credentials must be an object if provided',
		});

		this.addRule({
			validate: (data) =>
				!data.metadata ||
				(typeof data.metadata === 'object' && data.metadata !== null),
			message: 'Invalid metadata format',
		});
	}
}

export class IntegrationConfigValidator extends RequestValidator<{
	type: string;
	config: Record<string, any>;
	enabled: boolean;
	credentials?: {
		apiKey?: string;
		clientId?: string;
		clientSecret?: string;
		[key: string]: any;
	};
}> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) => typeof data.type === 'string',
			message: 'Integration type is required',
		});

		this.addRule({
			validate: (data) =>
				typeof data.config === 'object' && data.config !== null,
			message: 'Configuration must be an object',
		});

		this.addRule({
			validate: (data) => typeof data.enabled === 'boolean',
			message: 'Enabled flag must be a boolean',
		});

		this.addRule({
			validate: (data) =>
				!data.credentials ||
				(typeof data.credentials === 'object' && data.credentials !== null),
			message: 'Credentials must be an object if provided',
		});
	}
}

export class IntegrationSyncValidator extends RequestValidator<
	Omit<SyncJob, 'id' | 'status' | 'progress' | 'metadata'>
> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) => typeof data.integrationId === 'string',
			message: 'Integration ID is required',
		});

		this.addRule({
			validate: (data) =>
				['import', 'export', 'bidirectional'].includes(data.direction),
			message: 'Invalid sync direction',
		});

		this.addRule({
			validate: (data) =>
				Array.isArray(data.entities) &&
				data.entities.length > 0 &&
				data.entities.every((e) => typeof e === 'string'),
			message: 'At least one entity must be specified',
		});

		this.addRule({
			validate: (data) =>
				!data.filters ||
				(typeof data.filters === 'object' && data.filters !== null),
			message: 'Filters must be an object if provided',
		});

		this.addRule({
			validate: (data) =>
				!data.schedule ||
				(typeof data.schedule === 'object' &&
					data.schedule !== null &&
					typeof data.schedule.frequency === 'string' &&
					data.schedule.startDate instanceof Date &&
					(!data.schedule.endDate || data.schedule.endDate instanceof Date) &&
					typeof data.schedule.timezone === 'string'),
			message: 'Invalid schedule configuration',
		});
	}
}
