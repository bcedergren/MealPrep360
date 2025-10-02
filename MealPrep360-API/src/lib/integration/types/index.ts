export type IntegrationType =
	| 'grocery_store'
	| 'fitness_app'
	| 'nutrition_api'
	| 'calendar'
	| 'smart_device'
	| 'delivery_service'
	| 'payment_gateway'
	| 'social_platform';

export type IntegrationStatus =
	| 'active'
	| 'inactive'
	| 'pending'
	| 'error'
	| 'expired'
	| 'revoked';

export type IntegrationScope =
	| 'read'
	| 'write'
	| 'delete'
	| 'full_access'
	| 'limited';

export type SyncDirection = 'import' | 'export' | 'bidirectional';

export type SyncFrequency =
	| 'realtime'
	| 'hourly'
	| 'daily'
	| 'weekly'
	| 'monthly'
	| 'manual';

export interface Integration {
	id: string;
	userId: string;
	type: IntegrationType;
	provider: string;
	status: IntegrationStatus;
	scopes: IntegrationScope[];
	credentials: {
		accessToken?: string;
		refreshToken?: string;
		expiresAt?: Date;
		[key: string]: any;
	};
	settings: {
		enabled: boolean;
		syncDirection: SyncDirection;
		syncFrequency: SyncFrequency;
		autoSync: boolean;
		webhookUrl?: string;
		customFields?: Record<string, any>;
	};
	metadata?: {
		version?: string;
		lastSync?: Date;
		nextSync?: Date;
		[key: string]: any;
	};
}

export interface IntegrationSync {
	id: string;
	integrationId: string;
	direction: SyncDirection;
	status: 'pending' | 'in_progress' | 'completed' | 'failed';
	startedAt: Date;
	completedAt?: Date;
	data: {
		totalItems: number;
		processedItems: number;
		failedItems: number;
		skippedItems: number;
	};
	error?: {
		code: string;
		message: string;
		details?: any;
	};
	metadata?: {
		duration?: number;
		batchId?: string;
		checksum?: string;
		[key: string]: any;
	};
}

export interface IntegrationWebhook {
	id: string;
	integrationId: string;
	event: string;
	url: string;
	status: 'active' | 'inactive' | 'failed';
	secret?: string;
	headers?: Record<string, string>;
	retryConfig?: {
		maxAttempts: number;
		backoffDelay: number;
	};
	metadata?: {
		lastTrigger?: Date;
		successRate?: number;
		averageLatency?: number;
		[key: string]: any;
	};
}

export interface IntegrationMapping {
	id: string;
	integrationId: string;
	sourceField: string;
	targetField: string;
	transformations?: Array<{
		type: string;
		params?: Record<string, any>;
	}>;
	validation?: {
		required?: boolean;
		type?: string;
		pattern?: string;
		min?: number;
		max?: number;
		enum?: string[];
	};
	fallback?: {
		value: any;
		condition?: string;
	};
}

export interface IntegrationMetrics {
	period: {
		start: Date;
		end: Date;
	};
	sync: {
		total: number;
		successful: number;
		failed: number;
		averageDuration: number;
		byDirection: Record<SyncDirection, number>;
	};
	data: {
		processed: number;
		failed: number;
		skipped: number;
		byType: Record<string, number>;
	};
	performance: {
		uptime: number;
		responseTime: number;
		errorRate: number;
		quotaUsage?: {
			used: number;
			limit: number;
			resetAt: Date;
		};
	};
	webhooks: {
		delivered: number;
		failed: number;
		averageLatency: number;
		byEvent: Record<
			string,
			{
				attempts: number;
				success: number;
			}
		>;
	};
}

export interface IntegrationProvider {
	id: string;
	name: string;
	type: IntegrationType;
	description?: string;
	version: string;
	status: 'available' | 'deprecated' | 'maintenance' | 'beta';
	auth: {
		type: 'oauth2' | 'apikey' | 'basic' | 'custom';
		config: {
			authUrl?: string;
			tokenUrl?: string;
			scopes?: string[];
			[key: string]: any;
		};
	};
	features: {
		supportedScopes: IntegrationScope[];
		syncDirections: SyncDirection[];
		webhooks: boolean;
		customFields: boolean;
		batchOperations: boolean;
	};
	endpoints: {
		base: string;
		paths: Record<
			string,
			{
				method: string;
				path: string;
				scopes: string[];
			}
		>;
	};
	limits: {
		requestsPerSecond?: number;
		requestsPerDay?: number;
		dataSize?: number;
		users?: number;
	};
	documentation: {
		setup?: string;
		api?: string;
		examples?: string[];
	};
}

export interface IntegrationError {
	id: string;
	integrationId: string;
	type: 'auth' | 'sync' | 'webhook' | 'api' | 'system';
	severity: 'low' | 'medium' | 'high' | 'critical';
	message: string;
	code?: string;
	timestamp: Date;
	context?: {
		operation?: string;
		input?: any;
		output?: any;
		[key: string]: any;
	};
	resolution?: {
		status: 'pending' | 'in_progress' | 'resolved';
		attempts: number;
		lastAttempt?: Date;
		solution?: string;
	};
}
