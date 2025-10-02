export interface Integration {
	id: string;
	name: string;
	type: string;
	provider: string;
	config: Record<string, any>;
	enabled: boolean;
	status: 'active' | 'inactive' | 'error';
	settings: {
		syncInterval?: number;
		retryAttempts?: number;
		timeout?: number;
		[key: string]: any;
	};
	scopes: string[];
	credentials?: {
		apiKey?: string;
		clientId?: string;
		clientSecret?: string;
		[key: string]: any;
	};
	userId: string;
	metadata?: {
		version?: string;
		lastSync?: Date;
		errorCount?: number;
		[key: string]: any;
	};
}

export interface SyncJob {
	id: string;
	integrationId: string;
	direction: 'import' | 'export' | 'bidirectional';
	entities: string[];
	filters?: Record<string, any>;
	schedule?: {
		frequency: string;
		startDate: Date;
		endDate?: Date;
		timezone: string;
	};
	status: 'pending' | 'running' | 'completed' | 'failed';
	progress: {
		current: number;
		total: number;
		errors: number;
	};
	metadata?: {
		startTime?: Date;
		endTime?: Date;
		duration?: number;
		[key: string]: any;
	};
}

export interface IIntegrationService {
	// Integration Management
	createIntegration(integration: Omit<Integration, 'id'>): Promise<Integration>;

	getIntegration(integrationId: string): Promise<Integration>;

	listIntegrations(filters?: {
		userId?: string;
		type?: string;
		provider?: string;
		status?: string;
	}): Promise<Integration[]>;

	updateIntegration(
		integrationId: string,
		updates: Partial<Integration>
	): Promise<Integration>;

	deleteIntegration(integrationId: string): Promise<void>;

	// Sync Management
	createSyncJob(job: Omit<SyncJob, 'id'>): Promise<SyncJob>;

	getSyncJob(jobId: string): Promise<SyncJob>;

	listSyncJobs(filters?: {
		integrationId?: string;
		status?: string;
	}): Promise<SyncJob[]>;

	cancelSyncJob(jobId: string): Promise<void>;

	retrySyncJob(jobId: string): Promise<SyncJob>;

	// Integration Operations
	validateConnection(params: {
		integrationId: string;
		credentials?: Record<string, any>;
	}): Promise<{
		valid: boolean;
		error?: string;
		details?: Record<string, any>;
	}>;

	getAvailableScopes(params: { type: string; provider: string }): Promise<
		Array<{
			name: string;
			description: string;
			required: boolean;
		}>
	>;

	getFieldMappings(params: { integrationId: string; entity: string }): Promise<{
		source: Array<{
			field: string;
			type: string;
			required: boolean;
		}>;
		target: Array<{
			field: string;
			type: string;
			required: boolean;
		}>;
		mappings: Record<string, string>;
	}>;

	updateFieldMappings(params: {
		integrationId: string;
		entity: string;
		mappings: Record<string, string>;
	}): Promise<void>;

	// Monitoring & Analytics
	getIntegrationHealth(integrationId: string): Promise<{
		status: string;
		lastCheck: Date;
		metrics: {
			uptime: number;
			latency: number;
			errorRate: number;
		};
		issues: Array<{
			type: string;
			message: string;
			severity: string;
			timestamp: Date;
		}>;
	}>;

	getIntegrationMetrics(params: {
		integrationId: string;
		startDate: Date;
		endDate: Date;
	}): Promise<{
		sync: {
			total: number;
			successful: number;
			failed: number;
			averageDuration: number;
		};
		data: {
			processed: number;
			created: number;
			updated: number;
			deleted: number;
			errors: number;
		};
		performance: {
			apiCalls: number;
			bandwidth: number;
			rateLimit: {
				remaining: number;
				reset: Date;
			};
		};
	}>;

	// Webhooks & Events
	registerWebhook(params: {
		integrationId: string;
		events: string[];
		url: string;
		secret?: string;
	}): Promise<{
		id: string;
		url: string;
		events: string[];
		status: string;
	}>;

	listWebhooks(integrationId: string): Promise<
		Array<{
			id: string;
			url: string;
			events: string[];
			status: string;
			lastDelivery?: {
				timestamp: Date;
				status: string;
				response?: string;
			};
		}>
	>;

	deleteWebhook(params: {
		integrationId: string;
		webhookId: string;
	}): Promise<void>;

	// Configuration & Settings
	updateSettings(params: {
		integrationId: string;
		settings: Record<string, any>;
	}): Promise<Integration>;

	rotateCredentials(params: {
		integrationId: string;
		type: 'apiKey' | 'clientSecret';
	}): Promise<{
		success: boolean;
		newCredentials?: Record<string, string>;
		expiresAt?: Date;
	}>;

	// Error Handling & Recovery
	getErrorLogs(params: {
		integrationId: string;
		startDate?: Date;
		endDate?: Date;
		severity?: string;
	}): Promise<
		Array<{
			timestamp: Date;
			type: string;
			message: string;
			severity: string;
			context?: Record<string, any>;
			resolution?: string;
		}>
	>;

	resolveError(params: {
		integrationId: string;
		errorId: string;
		resolution: string;
	}): Promise<void>;
}
