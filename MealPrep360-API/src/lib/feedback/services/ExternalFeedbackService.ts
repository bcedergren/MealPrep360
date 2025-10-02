import { BaseExternalService } from '../../core/services/BaseExternalService';
import {
	IFeedbackService,
	Feedback,
	FeedbackResponse,
} from '../interfaces/IFeedbackService';
import {
	FeedbackType,
	FeedbackStatus,
	FeedbackPriority,
	FeedbackCategory,
	FeedbackThread,
} from '../types';

type FeedbackStats = {
	total: number;
	byStatus: Record<string, number>;
	byType: Record<string, number>;
	byPriority: Record<string, number>;
	averageResolutionTime: number;
	responseRate: number;
	trends: Array<{
		period: string;
		count: number;
		resolved: number;
	}>;
};

type TopIssue = {
	category: string;
	count: number;
	impact: number;
	examples: string[];
};

type SentimentAnalysis = {
	score: number;
	aspects: Array<{
		topic: string;
		sentiment: number;
		keywords: string[];
	}>;
	trends: Array<{
		period: string;
		sentiment: number;
	}>;
};

type ExportResult = {
	url: string;
	expiresAt: Date;
	metadata: {
		size: number;
		format: string;
		rows: number;
	};
};

type SyncResult = {
	status: string;
	processed: number;
	errors: Array<{
		item: string;
		error: string;
	}>;
	summary: {
		created: number;
		updated: number;
		skipped: number;
		failed: number;
	};
};

export class ExternalFeedbackService
	extends BaseExternalService
	implements IFeedbackService
{
	constructor() {
		super('feedback');
	}

	// Feedback Management
	async createFeedback(feedback: Omit<Feedback, 'id'>): Promise<Feedback> {
		const response = await this.resilientClient.post<Feedback>(
			'/feedback',
			feedback
		);
		return response;
	}

	async updateFeedback(
		feedbackId: string,
		updates: Partial<Feedback>
	): Promise<Feedback> {
		const response = await this.resilientClient.put<Feedback>(
			`/feedback/${feedbackId}`,
			updates
		);
		return response;
	}

	async getFeedback(feedbackId: string): Promise<Feedback> {
		const response = await this.resilientClient.get<Feedback>(
			`/feedback/${feedbackId}`
		);
		return response;
	}

	async listFeedback(filters?: {
		userId?: string;
		type?: string;
		category?: string;
		priority?: string;
		status?: string;
		startDate?: Date;
		endDate?: Date;
		assignedTo?: string;
		tags?: string[];
	}): Promise<Feedback[]> {
		const response = await this.resilientClient.get<Feedback[]>('/feedback', {
			params: {
				...filters,
				startDate: filters?.startDate?.toISOString(),
				endDate: filters?.endDate?.toISOString(),
			},
		});
		return response;
	}

	async deleteFeedback(feedbackId: string): Promise<void> {
		await this.resilientClient.delete(`/feedback/${feedbackId}`);
	}

	// Response Management
	async createResponse(
		response: Omit<FeedbackResponse, 'id'>
	): Promise<FeedbackResponse> {
		const result = await this.resilientClient.post<FeedbackResponse>(
			'/responses',
			response
		);
		return result;
	}

	async updateResponse(
		responseId: string,
		updates: Partial<FeedbackResponse>
	): Promise<FeedbackResponse> {
		const response = await this.resilientClient.put<FeedbackResponse>(
			`/responses/${responseId}`,
			updates
		);
		return response;
	}

	async getResponse(responseId: string): Promise<FeedbackResponse> {
		const response = await this.resilientClient.get<FeedbackResponse>(
			`/responses/${responseId}`
		);
		return response;
	}

	async listResponses(feedbackId: string): Promise<FeedbackResponse[]> {
		const response = await this.resilientClient.get<FeedbackResponse[]>(
			`/feedback/${feedbackId}/responses`
		);
		return response;
	}

	async deleteResponse(responseId: string): Promise<void> {
		await this.resilientClient.delete(`/responses/${responseId}`);
	}

	// Analytics & Reporting
	async getFeedbackStats(filters?: {
		startDate?: Date;
		endDate?: Date;
		type?: string;
		category?: string;
	}): Promise<FeedbackStats> {
		const response = await this.resilientClient.get<FeedbackStats>('/stats', {
			params: {
				...filters,
				startDate: filters?.startDate?.toISOString(),
				endDate: filters?.endDate?.toISOString(),
			},
		});
		return response;
	}

	async getTopIssues(params: {
		timeframe: string;
		limit?: number;
	}): Promise<TopIssue[]> {
		const response = await this.resilientClient.get<TopIssue[]>('/issues/top', {
			params,
		});
		return response;
	}

	async getSentimentAnalysis(feedbackId: string): Promise<SentimentAnalysis> {
		const response = await this.resilientClient.get<SentimentAnalysis>(
			`/feedback/${feedbackId}/sentiment`
		);
		return response;
	}

	// Workflow Management
	async assignFeedback(params: {
		feedbackId: string;
		userId: string;
		note?: string;
	}): Promise<Feedback> {
		const response = await this.resilientClient.post<Feedback>(
			`/feedback/${params.feedbackId}/assign`,
			{ userId: params.userId, note: params.note }
		);
		return response;
	}

	async changeFeedbackStatus(params: {
		feedbackId: string;
		status: string;
		resolution?: {
			type: string;
			description: string;
		};
	}): Promise<Feedback> {
		const response = await this.resilientClient.put<Feedback>(
			`/feedback/${params.feedbackId}/status`,
			{ status: params.status, resolution: params.resolution }
		);
		return response;
	}

	async mergeFeedback(params: {
		sourceId: string;
		targetId: string;
		note?: string;
	}): Promise<Feedback> {
		const response = await this.resilientClient.post<Feedback>(
			'/feedback/merge',
			params
		);
		return response;
	}

	async linkFeedback(params: {
		feedbackId: string;
		relatedId: string;
		type: 'duplicate' | 'related' | 'blocks' | 'blocked_by';
	}): Promise<void> {
		await this.resilientClient.post(`/feedback/${params.feedbackId}/links`, {
			relatedId: params.relatedId,
			type: params.type,
		});
	}

	// Notifications
	async subscribeFeedback(params: {
		feedbackId: string;
		userId: string;
		preferences?: {
			email?: boolean;
			push?: boolean;
			inApp?: boolean;
		};
	}): Promise<void> {
		await this.resilientClient.post(
			`/feedback/${params.feedbackId}/subscribers`,
			{
				userId: params.userId,
				preferences: params.preferences,
			}
		);
	}

	async unsubscribeFeedback(params: {
		feedbackId: string;
		userId: string;
	}): Promise<void> {
		await this.resilientClient.delete(
			`/feedback/${params.feedbackId}/subscribers/${params.userId}`
		);
	}

	// Export & Integration
	async exportFeedback(params: {
		format: 'csv' | 'json' | 'pdf';
		filters?: Record<string, any>;
		fields?: string[];
	}): Promise<ExportResult> {
		const response = await this.resilientClient.post<ExportResult>(
			'/feedback/export',
			params
		);
		return response;
	}

	async syncFeedback(params: {
		system: string;
		direction: 'import' | 'export' | 'bidirectional';
		filters?: Record<string, any>;
		mappings?: Record<string, string>;
	}): Promise<SyncResult> {
		const response = await this.resilientClient.post<SyncResult>(
			'/feedback/sync',
			params
		);
		return response;
	}
}
