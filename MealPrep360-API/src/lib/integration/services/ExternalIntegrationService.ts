import { BaseExternalService } from '../../core/services/BaseExternalService';
import {
	IIntegrationService,
	Integration,
	SyncJob,
} from '../interfaces/IIntegrationService';
import {
	IntegrationProvider,
	IntegrationError,
	IntegrationType,
} from '../types';
import { AxiosResponse } from 'axios';
import { ResilientClient } from '../../services/resilience';
import {
	IIntegrationProviderDocument,
	IIntegrationErrorDocument,
} from '../types/integration';

type ResilientResponse<T> = {
	data: T;
};

export class ExternalIntegrationService
	extends BaseExternalService
	implements IIntegrationService
{
	constructor() {
		super('integration');
	}

	// Integration Management
	async createIntegration(
		integration: Omit<Integration, 'id'>
	): Promise<Integration> {
		const response = await this.resilientClient.post<
			ResilientResponse<Integration>
		>('/integrations', integration);
		return response.data;
	}

	async updateIntegration(
		integrationId: string,
		updates: Partial<Integration>
	): Promise<Integration> {
		const response = await this.resilientClient.put<
			ResilientResponse<Integration>
		>(`/integrations/${integrationId}`, updates);
		return response.data;
	}

	async getIntegration(integrationId: string): Promise<Integration> {
		const response = await this.resilientClient.get<
			ResilientResponse<Integration>
		>(`/integrations/${integrationId}`);
		return response.data;
	}

	async listIntegrations(filters?: {
		userId?: string;
		type?: string;
		provider?: string;
		status?: string;
	}): Promise<Integration[]> {
		const response = await this.resilientClient.get<
			ResilientResponse<Integration[]>
		>('/integrations', {
			params: filters,
		});
		return response.data;
	}

	async deleteIntegration(integrationId: string): Promise<void> {
		await this.resilientClient.delete(`/integrations/${integrationId}`);
	}

	async validateConnection(params: {
		integrationId: string;
		credentials?: Record<string, any>;
	}): Promise<{
		valid: boolean;
		error?: string;
		details?: Record<string, any>;
	}> {
		const response = await this.resilientClient.post<
			ResilientResponse<{
				valid: boolean;
				error?: string;
				details?: Record<string, any>;
			}>
		>(`/integrations/${params.integrationId}/validate`, {
			credentials: params.credentials,
		});
		return response.data;
	}

	// Sync Operations
	async createSyncJob(job: Omit<SyncJob, 'id'>): Promise<SyncJob> {
		const response = await this.resilientClient.post<
			ResilientResponse<SyncJob>
		>('/syncs', job);
		return response.data;
	}

	async getSyncJob(jobId: string): Promise<SyncJob> {
		const response = await this.resilientClient.get<ResilientResponse<SyncJob>>(
			`/syncs/${jobId}`
		);
		return response.data;
	}

	async listSyncJobs(filters?: {
		integrationId?: string;
		status?: string;
	}): Promise<SyncJob[]> {
		const response = await this.resilientClient.get<
			ResilientResponse<SyncJob[]>
		>('/syncs', {
			params: filters,
		});
		return response.data;
	}

	async cancelSyncJob(jobId: string): Promise<void> {
		await this.resilientClient.post(`/syncs/${jobId}/cancel`);
	}

	async retrySyncJob(jobId: string): Promise<SyncJob> {
		const response = await this.resilientClient.post<
			ResilientResponse<SyncJob>
		>(`/syncs/${jobId}/retry`);
		return response.data;
	}

	// Webhook Management
	async registerWebhook(params: {
		integrationId: string;
		events: string[];
		url: string;
		secret?: string;
	}): Promise<{
		id: string;
		url: string;
		events: string[];
		status: string;
	}> {
		const response = await this.resilientClient.post<
			ResilientResponse<{
				id: string;
				url: string;
				events: string[];
				status: string;
			}>
		>('/webhooks', params);
		return response.data;
	}

	async listWebhooks(integrationId: string): Promise<
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
	> {
		const response = await this.resilientClient.get<
			ResilientResponse<
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
			>
		>(`/webhooks/${integrationId}`);
		return response.data;
	}

	async deleteWebhook(params: {
		integrationId: string;
		webhookId: string;
	}): Promise<void> {
		await this.resilientClient.delete(
			`/webhooks/${params.integrationId}/${params.webhookId}`
		);
	}

	async testWebhook(
		webhookId: string,
		payload?: any
	): Promise<{
		success: boolean;
		statusCode?: number;
		response?: any;
		latency?: number;
	}> {
		const response = await this.resilientClient.post<
			ResilientResponse<{
				success: boolean;
				statusCode?: number;
				response?: any;
				latency?: number;
			}>
		>(`/webhooks/${webhookId}/test`, { payload });
		return response.data;
	}

	// Field Mappings
	async getFieldMappings(params: {
		integrationId: string;
		entity: string;
	}): Promise<{
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
	}> {
		const response = await this.resilientClient.get<
			ResilientResponse<{
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
			}>
		>(`/integrations/${params.integrationId}/mappings/${params.entity}`);
		return response.data;
	}

	async updateFieldMappings(params: {
		integrationId: string;
		entity: string;
		mappings: Record<string, string>;
	}): Promise<void> {
		await this.resilientClient.put(
			`/integrations/${params.integrationId}/mappings/${params.entity}`,
			{ mappings: params.mappings }
		);
	}

	// Provider Management
	async registerProvider(
		provider: Omit<IntegrationProvider, 'id'>
	): Promise<IIntegrationProviderDocument> {
		const response = await this.resilientClient.post<
			ResilientResponse<IIntegrationProviderDocument>
		>('/providers', provider);
		return response.data;
	}

	async updateProvider(
		providerId: string,
		updates: Partial<IntegrationProvider>
	): Promise<IIntegrationProviderDocument> {
		const response = await this.resilientClient.put<
			ResilientResponse<IIntegrationProviderDocument>
		>(`/providers/${providerId}`, updates);
		return response.data;
	}

	async getProvider(providerId: string): Promise<IIntegrationProviderDocument> {
		const response = await this.resilientClient.get<
			ResilientResponse<IIntegrationProviderDocument>
		>(`/providers/${providerId}`);
		return response.data;
	}

	async listProviders(filters?: {
		type?: IntegrationType;
		status?: string;
		features?: string[];
	}): Promise<IIntegrationProviderDocument[]> {
		const response = await this.resilientClient.get<
			ResilientResponse<IIntegrationProviderDocument[]>
		>('/providers', {
			params: filters,
		});
		return response.data;
	}

	async validateProvider(providerId: string): Promise<{
		status: string;
		features: string[];
		compatibility: Record<string, boolean>;
	}> {
		const response = await this.resilientClient.post<
			ResilientResponse<{
				status: string;
				features: string[];
				compatibility: Record<string, boolean>;
			}>
		>(`/providers/${providerId}/validate`);
		return response.data;
	}

	// Error Handling
	async logError(
		error: Omit<IntegrationError, 'id' | 'timestamp'>
	): Promise<IIntegrationErrorDocument> {
		const response = await this.resilientClient.post<
			ResilientResponse<IIntegrationErrorDocument>
		>('/errors', error);
		return response.data;
	}

	async getError(errorId: string): Promise<IIntegrationErrorDocument> {
		const response = await this.resilientClient.get<
			ResilientResponse<IIntegrationErrorDocument>
		>(`/errors/${errorId}`);
		return response.data;
	}

	async listErrors(filters?: {
		integrationId?: string;
		type?: string;
		severity?: string;
		startDate?: Date;
		endDate?: Date;
	}): Promise<IIntegrationErrorDocument[]> {
		const response = await this.resilientClient.get<
			ResilientResponse<IIntegrationErrorDocument[]>
		>('/errors', {
			params: {
				...filters,
				startDate: filters?.startDate?.toISOString(),
				endDate: filters?.endDate?.toISOString(),
			},
		});
		return response.data;
	}

	async resolveError(params: {
		integrationId: string;
		errorId: string;
		resolution: string;
	}): Promise<void> {
		await this.resilientClient.post(`/errors/${params.errorId}/resolve`, {
			resolution: params.resolution,
		});
	}

	// Metrics & Analytics
	async getIntegrationMetrics(params: {
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
	}> {
		const response = await this.resilientClient.get<
			ResilientResponse<{
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
			}>
		>('/metrics', {
			params: {
				integrationId: params.integrationId,
				startDate: params.startDate.toISOString(),
				endDate: params.endDate.toISOString(),
			},
		});
		return response.data;
	}

	async getIntegrationHealth(integrationId: string): Promise<{
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
	}> {
		const response = await this.resilientClient.get<
			ResilientResponse<{
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
			}>
		>(`/integrations/${integrationId}/health`);
		return response.data;
	}

	// Configuration & Settings
	async updateSettings(params: {
		integrationId: string;
		settings: Record<string, any>;
	}): Promise<Integration> {
		const response = await this.resilientClient.put<
			ResilientResponse<Integration>
		>(`/integrations/${params.integrationId}/settings`, {
			settings: params.settings,
		});
		return response.data;
	}

	async rotateCredentials(params: {
		integrationId: string;
		type: 'apiKey' | 'clientSecret';
	}): Promise<{
		success: boolean;
		newCredentials?: Record<string, string>;
		expiresAt?: Date;
	}> {
		const response = await this.resilientClient.post<
			ResilientResponse<{
				success: boolean;
				newCredentials?: Record<string, string>;
				expiresAt?: Date;
			}>
		>(`/integrations/${params.integrationId}/credentials/rotate`, {
			type: params.type,
		});
		return response.data;
	}

	// Error Logs
	async getErrorLogs(params: {
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
	> {
		const response = await this.resilientClient.get<
			ResilientResponse<
				Array<{
					timestamp: Date;
					type: string;
					message: string;
					severity: string;
					context?: Record<string, any>;
					resolution?: string;
				}>
			>
		>(`/integrations/${params.integrationId}/error-logs`, {
			params: {
				startDate: params.startDate?.toISOString(),
				endDate: params.endDate?.toISOString(),
				severity: params.severity,
			},
		});
		return response.data;
	}

	// Scopes
	async getAvailableScopes(params: { type: string; provider: string }): Promise<
		Array<{
			name: string;
			description: string;
			required: boolean;
		}>
	> {
		const response = await this.resilientClient.get<
			ResilientResponse<
				Array<{
					name: string;
					description: string;
					required: boolean;
				}>
			>
		>(`/providers/${params.provider}/scopes`, {
			params: {
				type: params.type,
			},
		});
		return response.data;
	}
}
