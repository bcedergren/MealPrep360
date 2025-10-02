import {
	SocialInteraction,
	SocialComment,
	SocialFollow,
	SocialCollection,
	SocialReport,
	SocialMetrics,
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

export interface ISocialService {
	// Interaction Management
	createInteraction(
		interaction: Omit<SocialInteraction, 'id' | 'createdAt'>
	): Promise<ISocialInteractionDocument>;
	getInteraction(interactionId: string): Promise<ISocialInteractionDocument>;
	listInteractions(filters?: {
		userId?: string;
		type?: SocialInteractionType;
		entityType?: SocialEntityType;
		entityId?: string;
		startDate?: Date;
		endDate?: Date;
	}): Promise<ISocialInteractionDocument[]>;
	deleteInteraction(interactionId: string): Promise<void>;

	// Comment Management
	createComment(
		comment: Omit<SocialComment, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>
	): Promise<ISocialCommentDocument>;
	updateComment(
		commentId: string,
		updates: Partial<SocialComment>
	): Promise<ISocialCommentDocument>;
	getComment(commentId: string): Promise<ISocialCommentDocument>;
	listComments(filters?: {
		userId?: string;
		entityType?: SocialEntityType;
		entityId?: string;
		status?: string;
		parentId?: string;
	}): Promise<ISocialCommentDocument[]>;
	deleteComment(commentId: string): Promise<void>;
	moderateComment(
		commentId: string,
		action: 'approve' | 'reject' | 'hide',
		moderatorId: string,
		reason?: string
	): Promise<ISocialCommentDocument>;

	// Follow Management
	createFollow(
		follow: Omit<SocialFollow, 'id' | 'createdAt' | 'updatedAt'>
	): Promise<ISocialFollowDocument>;
	updateFollowStatus(
		followId: string,
		status: 'pending' | 'active' | 'blocked'
	): Promise<ISocialFollowDocument>;
	getFollow(followId: string): Promise<ISocialFollowDocument>;
	listFollows(filters?: {
		followerId?: string;
		followedId?: string;
		status?: string;
	}): Promise<ISocialFollowDocument[]>;
	deleteFollow(followId: string): Promise<void>;
	checkFollowStatus(
		followerId: string,
		followedId: string
	): Promise<{
		status: string;
		since?: Date;
		mutual?: boolean;
	}>;

	// Collection Management
	createCollection(
		collection: Omit<
			SocialCollection,
			'id' | 'createdAt' | 'updatedAt' | 'metrics'
		>
	): Promise<ISocialCollectionDocument>;
	updateCollection(
		collectionId: string,
		updates: Partial<SocialCollection>
	): Promise<ISocialCollectionDocument>;
	getCollection(collectionId: string): Promise<ISocialCollectionDocument>;
	listCollections(filters?: {
		userId?: string;
		visibility?: string;
		contains?: {
			type: SocialEntityType;
			id: string;
		};
	}): Promise<ISocialCollectionDocument[]>;
	deleteCollection(collectionId: string): Promise<void>;
	addToCollection(
		collectionId: string,
		item: {
			type: SocialEntityType;
			id: string;
			note?: string;
		}
	): Promise<ISocialCollectionDocument>;
	removeFromCollection(
		collectionId: string,
		itemId: string
	): Promise<ISocialCollectionDocument>;

	// Report Management
	createReport(
		report: Omit<SocialReport, 'id' | 'createdAt' | 'updatedAt'>
	): Promise<ISocialReportDocument>;
	updateReportStatus(
		reportId: string,
		status: 'pending' | 'reviewed' | 'resolved' | 'dismissed',
		moderatorId: string,
		notes?: string
	): Promise<ISocialReportDocument>;
	getReport(reportId: string): Promise<ISocialReportDocument>;
	listReports(filters?: {
		reporterId?: string;
		entityType?: SocialEntityType;
		entityId?: string;
		status?: string;
		reason?: SocialReportReason;
	}): Promise<ISocialReportDocument[]>;
	assignReport(
		reportId: string,
		moderatorId: string,
		priority?: 'low' | 'medium' | 'high' | 'urgent'
	): Promise<ISocialReportDocument>;

	// Settings Management
	createSettings(
		settings: Omit<SocialSettings, 'id'>
	): Promise<ISocialSettingsDocument>;
	updateSettings(
		userId: string,
		updates: Partial<SocialSettings>
	): Promise<ISocialSettingsDocument>;
	getSettings(userId: string): Promise<ISocialSettingsDocument>;
	validateSettings(settings: Partial<SocialSettings>): Promise<{
		valid: boolean;
		errors?: string[];
	}>;
	applyDefaultSettings(
		userId: string,
		template?: string
	): Promise<ISocialSettingsDocument>;

	// Metrics & Analytics
	getSocialMetrics(
		startDate: Date,
		endDate: Date,
		filters?: {
			userId?: string;
			entityType?: SocialEntityType;
			interactionType?: SocialInteractionType;
		}
	): Promise<ISocialMetricsDocument>;

	getUserEngagement(
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
	}>;

	getContentPerformance(
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
	}>;

	// Moderation & Safety
	validateContent(content: {
		type: SocialContentType;
		value: string;
	}): Promise<{
		safe: boolean;
		score: number;
		flags?: string[];
		recommendations?: string[];
	}>;

	checkUserReputation(userId: string): Promise<{
		score: number;
		level: 'low' | 'medium' | 'high';
		flags?: string[];
		restrictions?: string[];
	}>;

	handleContentViolation(violation: {
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
	}>;
}
