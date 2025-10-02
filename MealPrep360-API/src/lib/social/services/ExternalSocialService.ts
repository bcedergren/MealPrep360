import { BaseExternalService } from '../../core/services/BaseExternalService';
import { ISocialService } from '../interfaces/ISocialService';
import {
	SocialInteraction,
	SocialComment,
	SocialFollow,
	SocialCollection,
	SocialReport,
	SocialSettings,
	SocialInteractionType,
	SocialEntityType,
	SocialContentType,
	SocialReportReason,
} from '../types';
import {
	ISocialInteractionDocument,
	ISocialCommentDocument,
	ISocialFollowDocument,
	ISocialCollectionDocument,
	ISocialReportDocument,
	ISocialMetricsDocument,
	ISocialSettingsDocument,
} from '../types/social';

export class ExternalSocialService
	extends BaseExternalService
	implements ISocialService
{
	constructor() {
		super('social');
	}

	// Interaction Management
	async createInteraction(
		interaction: Omit<SocialInteraction, 'id' | 'createdAt'>
	): Promise<ISocialInteractionDocument> {
		return await this.resilientClient.post<ISocialInteractionDocument>(
			'/interactions',
			interaction
		);
	}

	async getInteraction(
		interactionId: string
	): Promise<ISocialInteractionDocument> {
		return await this.resilientClient.get<ISocialInteractionDocument>(
			`/interactions/${interactionId}`
		);
	}

	async listInteractions(filters?: {
		userId?: string;
		type?: SocialInteractionType;
		entityType?: SocialEntityType;
		entityId?: string;
		startDate?: Date;
		endDate?: Date;
	}): Promise<ISocialInteractionDocument[]> {
		return await this.resilientClient.get<ISocialInteractionDocument[]>(
			'/interactions',
			{
				params: {
					...filters,
					startDate: filters?.startDate?.toISOString(),
					endDate: filters?.endDate?.toISOString(),
				},
			}
		);
	}

	async deleteInteraction(interactionId: string): Promise<void> {
		await this.resilientClient.delete(`/interactions/${interactionId}`);
	}

	// Comment Management
	async createComment(
		comment: Omit<SocialComment, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>
	): Promise<ISocialCommentDocument> {
		return await this.resilientClient.post<ISocialCommentDocument>(
			'/comments',
			comment
		);
	}

	async updateComment(
		commentId: string,
		updates: Partial<SocialComment>
	): Promise<ISocialCommentDocument> {
		return await this.resilientClient.put<ISocialCommentDocument>(
			`/comments/${commentId}`,
			updates
		);
	}

	async getComment(commentId: string): Promise<ISocialCommentDocument> {
		return await this.resilientClient.get<ISocialCommentDocument>(
			`/comments/${commentId}`
		);
	}

	async listComments(filters?: {
		userId?: string;
		entityType?: SocialEntityType;
		entityId?: string;
		status?: string;
		parentId?: string;
	}): Promise<ISocialCommentDocument[]> {
		return await this.resilientClient.get<ISocialCommentDocument[]>(
			'/comments',
			{
				params: filters,
			}
		);
	}

	async deleteComment(commentId: string): Promise<void> {
		await this.resilientClient.delete(`/comments/${commentId}`);
	}

	async moderateComment(
		commentId: string,
		action: 'approve' | 'reject' | 'hide',
		moderatorId: string,
		reason?: string
	): Promise<ISocialCommentDocument> {
		return await this.resilientClient.post<ISocialCommentDocument>(
			`/comments/${commentId}/moderate`,
			{ action, moderatorId, reason }
		);
	}

	// Follow Management
	async createFollow(
		follow: Omit<SocialFollow, 'id' | 'createdAt' | 'updatedAt'>
	): Promise<ISocialFollowDocument> {
		return await this.resilientClient.post<ISocialFollowDocument>(
			'/follows',
			follow
		);
	}

	async updateFollowStatus(
		followId: string,
		status: 'pending' | 'active' | 'blocked'
	): Promise<ISocialFollowDocument> {
		return await this.resilientClient.put<ISocialFollowDocument>(
			`/follows/${followId}/status`,
			{ status }
		);
	}

	async getFollow(followId: string): Promise<ISocialFollowDocument> {
		return await this.resilientClient.get<ISocialFollowDocument>(
			`/follows/${followId}`
		);
	}

	async listFollows(filters?: {
		followerId?: string;
		followedId?: string;
		status?: string;
	}): Promise<ISocialFollowDocument[]> {
		return await this.resilientClient.get<ISocialFollowDocument[]>('/follows', {
			params: filters,
		});
	}

	async deleteFollow(followId: string): Promise<void> {
		await this.resilientClient.delete(`/follows/${followId}`);
	}

	async checkFollowStatus(
		followerId: string,
		followedId: string
	): Promise<{
		status: string;
		since?: Date;
		mutual?: boolean;
	}> {
		return await this.resilientClient.get<{
			status: string;
			since?: Date;
			mutual?: boolean;
		}>(`/follows/status/${followerId}/${followedId}`);
	}

	// Collection Management
	async createCollection(
		collection: Omit<
			SocialCollection,
			'id' | 'createdAt' | 'updatedAt' | 'metrics'
		>
	): Promise<ISocialCollectionDocument> {
		return await this.resilientClient.post<ISocialCollectionDocument>(
			'/collections',
			collection
		);
	}

	async updateCollection(
		collectionId: string,
		updates: Partial<SocialCollection>
	): Promise<ISocialCollectionDocument> {
		return await this.resilientClient.put<ISocialCollectionDocument>(
			`/collections/${collectionId}`,
			updates
		);
	}

	async getCollection(
		collectionId: string
	): Promise<ISocialCollectionDocument> {
		return await this.resilientClient.get<ISocialCollectionDocument>(
			`/collections/${collectionId}`
		);
	}

	async listCollections(filters?: {
		userId?: string;
		visibility?: string;
		contains?: {
			type: SocialEntityType;
			id: string;
		};
	}): Promise<ISocialCollectionDocument[]> {
		return await this.resilientClient.get<ISocialCollectionDocument[]>(
			'/collections',
			{
				params: filters,
			}
		);
	}

	async deleteCollection(collectionId: string): Promise<void> {
		await this.resilientClient.delete(`/collections/${collectionId}`);
	}

	async addToCollection(
		collectionId: string,
		item: {
			type: SocialEntityType;
			id: string;
			note?: string;
		}
	): Promise<ISocialCollectionDocument> {
		return await this.resilientClient.post<ISocialCollectionDocument>(
			`/collections/${collectionId}/items`,
			item
		);
	}

	async removeFromCollection(
		collectionId: string,
		itemId: string
	): Promise<ISocialCollectionDocument> {
		return await this.resilientClient.delete<ISocialCollectionDocument>(
			`/collections/${collectionId}/items/${itemId}`
		);
	}

	// Report Management
	async createReport(
		report: Omit<SocialReport, 'id' | 'createdAt' | 'updatedAt'>
	): Promise<ISocialReportDocument> {
		return await this.resilientClient.post<ISocialReportDocument>(
			'/reports',
			report
		);
	}

	async updateReportStatus(
		reportId: string,
		status: 'pending' | 'reviewed' | 'resolved' | 'dismissed',
		moderatorId: string,
		notes?: string
	): Promise<ISocialReportDocument> {
		return await this.resilientClient.put<ISocialReportDocument>(
			`/reports/${reportId}/status`,
			{ status, moderatorId, notes }
		);
	}

	async getReport(reportId: string): Promise<ISocialReportDocument> {
		return await this.resilientClient.get<ISocialReportDocument>(
			`/reports/${reportId}`
		);
	}

	async listReports(filters?: {
		reporterId?: string;
		entityType?: SocialEntityType;
		entityId?: string;
		status?: string;
		reason?: SocialReportReason;
	}): Promise<ISocialReportDocument[]> {
		return await this.resilientClient.get<ISocialReportDocument[]>('/reports', {
			params: filters,
		});
	}

	async assignReport(
		reportId: string,
		moderatorId: string,
		priority?: 'low' | 'medium' | 'high' | 'urgent'
	): Promise<ISocialReportDocument> {
		return await this.resilientClient.put<ISocialReportDocument>(
			`/reports/${reportId}/assign`,
			{ moderatorId, priority }
		);
	}

	// Settings Management
	async createSettings(
		settings: Omit<SocialSettings, 'id'>
	): Promise<ISocialSettingsDocument> {
		return await this.resilientClient.post<ISocialSettingsDocument>(
			'/settings',
			settings
		);
	}

	async updateSettings(
		userId: string,
		updates: Partial<SocialSettings>
	): Promise<ISocialSettingsDocument> {
		return await this.resilientClient.put<ISocialSettingsDocument>(
			`/settings/${userId}`,
			updates
		);
	}

	async getSettings(userId: string): Promise<ISocialSettingsDocument> {
		return await this.resilientClient.get<ISocialSettingsDocument>(
			`/settings/${userId}`
		);
	}

	async validateSettings(settings: Partial<SocialSettings>): Promise<{
		valid: boolean;
		errors?: string[];
	}> {
		return await this.resilientClient.post<{
			valid: boolean;
			errors?: string[];
		}>('/settings/validate', settings);
	}

	async applyDefaultSettings(
		userId: string,
		template?: string
	): Promise<ISocialSettingsDocument> {
		return await this.resilientClient.post<ISocialSettingsDocument>(
			`/settings/${userId}/defaults`,
			{ template }
		);
	}

	// Metrics & Analytics
	async getSocialMetrics(
		startDate: Date,
		endDate: Date,
		filters?: {
			userId?: string;
			entityType?: SocialEntityType;
			interactionType?: SocialInteractionType;
		}
	): Promise<ISocialMetricsDocument> {
		return await this.resilientClient.get<ISocialMetricsDocument>('/metrics', {
			params: {
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
				...filters,
			},
		});
	}

	async getUserEngagement(
		userId: string,
		startDate: Date,
		endDate: Date
	): Promise<{
		interactions: {
			total: number;
			byType: Record<SocialInteractionType, number>;
		};
		content: {
			comments: number;
			collections: number;
			reports: number;
		};
		network: {
			followers: number;
			following: number;
			mutualFollows: number;
		};
		activity: {
			frequency: number;
			lastActive?: Date;
			peakTimes: number[];
		};
	}> {
		return await this.resilientClient.get<{
			interactions: {
				total: number;
				byType: Record<SocialInteractionType, number>;
			};
			content: {
				comments: number;
				collections: number;
				reports: number;
			};
			network: {
				followers: number;
				following: number;
				mutualFollows: number;
			};
			activity: {
				frequency: number;
				lastActive?: Date;
				peakTimes: number[];
			};
		}>(`/metrics/users/${userId}/engagement`, {
			params: {
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
			},
		});
	}

	async getContentPerformance(
		entityType: SocialEntityType,
		entityId: string
	): Promise<{
		interactions: Record<SocialInteractionType, number>;
		engagement: {
			rate: number;
			trend: 'up' | 'down' | 'stable';
		};
		reach: {
			total: number;
			organic: number;
			viral: number;
		};
		demographics?: {
			age?: Record<string, number>;
			location?: Record<string, number>;
			interests?: string[];
		};
	}> {
		return await this.resilientClient.get<{
			interactions: Record<SocialInteractionType, number>;
			engagement: {
				rate: number;
				trend: 'up' | 'down' | 'stable';
			};
			reach: {
				total: number;
				organic: number;
				viral: number;
			};
			demographics?: {
				age?: Record<string, number>;
				location?: Record<string, number>;
				interests?: string[];
			};
		}>(`/metrics/content/${entityType}/${entityId}/performance`);
	}

	// Moderation & Safety
	async validateContent(content: {
		type: SocialContentType;
		value: string;
	}): Promise<{
		safe: boolean;
		score: number;
		flags?: string[];
		recommendations?: string[];
	}> {
		return await this.resilientClient.post<{
			safe: boolean;
			score: number;
			flags?: string[];
			recommendations?: string[];
		}>('/moderation/validate', content);
	}

	async checkUserReputation(userId: string): Promise<{
		score: number;
		level: 'low' | 'medium' | 'high';
		flags?: string[];
		restrictions?: string[];
	}> {
		return await this.resilientClient.get<{
			score: number;
			level: 'low' | 'medium' | 'high';
			flags?: string[];
			restrictions?: string[];
		}>(`/moderation/users/${userId}/reputation`);
	}

	async handleContentViolation(violation: {
		entityType: SocialEntityType;
		entityId: string;
		type: string;
		severity: 'low' | 'medium' | 'high';
		evidence?: any;
	}): Promise<{
		action: string;
		restrictions?: string[];
		duration?: number;
		appeal?: {
			allowed: boolean;
			process?: string;
		};
	}> {
		return await this.resilientClient.post<{
			action: string;
			restrictions?: string[];
			duration?: number;
			appeal?: {
				allowed: boolean;
				process?: string;
			};
		}>('/moderation/violations', violation);
	}
}
