import { Document } from 'mongoose';
import {
	Integration as BaseIntegration,
	IntegrationSync as BaseIntegrationSync,
	IntegrationWebhook as BaseIntegrationWebhook,
	IntegrationMapping as BaseIntegrationMapping,
	IntegrationMetrics as BaseIntegrationMetrics,
	IntegrationProvider as BaseIntegrationProvider,
	IntegrationError as BaseIntegrationError,
	IntegrationType,
	IntegrationStatus,
	IntegrationScope,
	SyncDirection,
	SyncFrequency,
} from './index';

// Base document types
export type Integration = Document & Omit<BaseIntegration, 'id'>;
export type IntegrationSync = Document & Omit<BaseIntegrationSync, 'id'>;
export type IntegrationWebhook = Document & Omit<BaseIntegrationWebhook, 'id'>;
export type IntegrationMapping = Document & Omit<BaseIntegrationMapping, 'id'>;
export type IntegrationMetrics = Document & Omit<BaseIntegrationMetrics, 'id'>;
export type IntegrationProvider = Document &
	Omit<BaseIntegrationProvider, 'id'>;
export type IntegrationError = Document & Omit<BaseIntegrationError, 'id'>;

// Document interfaces extend the base types
export type IIntegrationDocument = Integration & {
	auth: {
		method: string;
		grantType?: string;
		clientId?: string;
		clientSecret?: string;
		redirectUri?: string;
		scope?: string[];
	};
	connection: {
		status: 'connected' | 'disconnected' | 'error';
		lastCheck: Date;
		error?: {
			code: string;
			message: string;
			timestamp: Date;
		};
	};
	validation: {
		verified: boolean;
		verifiedAt?: Date;
		verifiedBy?: string;
		issues?: Array<{
			type: string;
			message: string;
			severity: string;
		}>;
	};
	usage: {
		requests: {
			total: number;
			successful: number;
			failed: number;
			lastRequest?: Date;
		};
		data: {
			sent: number;
			received: number;
			lastSync?: Date;
		};
		quotas: {
			daily?: {
				used: number;
				limit: number;
				reset: Date;
			};
			monthly?: {
				used: number;
				limit: number;
				reset: Date;
			};
		};
	};
};

export type IIntegrationSyncDocument = IntegrationSync & {
	execution: {
		strategy: 'immediate' | 'batched' | 'scheduled';
		priority: number;
		retries: number;
		timeout?: number;
	};
	validation: {
		rules: Array<{
			field: string;
			condition: string;
			value: any;
		}>;
		errors: Array<{
			field: string;
			message: string;
			items?: number[];
		}>;
	};
	tracking: {
		stages: Array<{
			name: string;
			status: string;
			duration: number;
			items: number;
		}>;
		progress: number;
		eta?: Date;
		logs: Array<{
			level: string;
			message: string;
			timestamp: Date;
		}>;
	};
	resources: {
		cpu?: number;
		memory?: number;
		storage?: number;
		bandwidth?: number;
	};
};

export type IIntegrationWebhookDocument = IntegrationWebhook & {
	security: {
		authentication?: {
			type: string;
			credentials: Record<string, string>;
		};
		encryption?: {
			enabled: boolean;
			algorithm?: string;
			keyId?: string;
		};
		rateLimit?: {
			requests: number;
			period: number;
		};
	};
	monitoring: {
		health: {
			status: string;
			lastCheck: Date;
			uptime: number;
		};
		alerts: Array<{
			type: string;
			message: string;
			timestamp: Date;
			resolved: boolean;
		}>;
		metrics: {
			requests: number;
			successes: number;
			failures: number;
			latency: number;
		};
	};
	history: Array<{
		event: string;
		payload: any;
		response: {
			status: number;
			body?: any;
		};
		timestamp: Date;
	}>;
};

export type IIntegrationMappingDocument = IntegrationMapping & {
	configuration: {
		direction: 'inbound' | 'outbound' | 'bidirectional';
		priority: number;
		active: boolean;
		version: number;
	};
	processing: {
		preprocessors?: Array<{
			type: string;
			config: Record<string, any>;
		}>;
		postprocessors?: Array<{
			type: string;
			config: Record<string, any>;
		}>;
		errorHandlers?: Array<{
			condition: string;
			action: string;
		}>;
	};
	monitoring: {
		usage: {
			count: number;
			errors: number;
			lastUsed: Date;
		};
		performance: {
			averageTime: number;
			errorRate: number;
			successRate: number;
		};
		validation: {
			failures: Array<{
				field: string;
				reason: string;
				count: number;
			}>;
			successes: number;
		};
	};
};

export type IIntegrationMetricsDocument = IntegrationMetrics & {
	trends: {
		daily: Array<{
			date: string;
			metrics: Record<string, number>;
		}>;
		weekly: Array<{
			week: string;
			metrics: Record<string, number>;
		}>;
		monthly: Array<{
			month: string;
			metrics: Record<string, number>;
		}>;
	};
	analysis: {
		patterns: Array<{
			type: string;
			description: string;
			confidence: number;
		}>;
		anomalies: Array<{
			metric: string;
			value: number;
			expected: number;
			timestamp: Date;
		}>;
		recommendations: Array<{
			type: string;
			description: string;
			priority: number;
		}>;
	};
	resources: {
		usage: {
			cpu: number;
			memory: number;
			storage: number;
			bandwidth: number;
		};
		costs: {
			total: number;
			breakdown: Record<string, number>;
			currency: string;
		};
	};
};

export type IIntegrationProviderDocument = IntegrationProvider & {
	compatibility: {
		platforms: string[];
		languages: string[];
		frameworks: string[];
		versions: {
			min: string;
			max?: string;
			recommended: string;
		};
	};
	security: {
		encryption: {
			supported: string[];
			required: boolean;
		};
		authentication: {
			methods: string[];
			requirements: Record<string, any>;
		};
		compliance: {
			standards: string[];
			certifications: string[];
		};
	};
	support: {
		channels: Array<{
			type: string;
			value: string;
		}>;
		availability: {
			timezone: string;
			hours: string;
			sla?: {
				responseTime: number;
				uptime: number;
			};
		};
		resources: {
			documentation: string[];
			tutorials: string[];
			samples: string[];
		};
	};
};

export type IIntegrationErrorDocument = IntegrationError & {
	analysis: {
		root: {
			cause: string;
			probability: number;
			evidence: any[];
		};
		impact: {
			severity: number;
			scope: string[];
			users: number;
		};
		correlation: {
			errors: string[];
			events: string[];
			patterns: string[];
		};
	};
	handling: {
		automatic: {
			actions: string[];
			results: Record<string, any>;
		};
		manual: {
			required: boolean;
			assignee?: string;
			deadline?: Date;
		};
		escalation: {
			level: number;
			path: string[];
			notified: string[];
		};
	};
	recovery: {
		plan: {
			steps: string[];
			estimated: number;
			dependencies: string[];
		};
		execution: {
			status: string;
			progress: number;
			completed: string[];
		};
		verification: {
			tests: string[];
			results: Record<string, boolean>;
		};
	};
};
