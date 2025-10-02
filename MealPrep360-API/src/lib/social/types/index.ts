export type SocialInteractionType =
	| 'like'
	| 'comment'
	| 'share'
	| 'follow'
	| 'mention'
	| 'tag'
	| 'save'
	| 'report';

export type SocialEntityType =
	| 'recipe'
	| 'meal_plan'
	| 'shopping_list'
	| 'user'
	| 'comment'
	| 'collection';

export type SocialContentType =
	| 'text'
	| 'image'
	| 'video'
	| 'link'
	| 'recipe'
	| 'meal_plan';

export type SocialReportReason =
	| 'inappropriate'
	| 'spam'
	| 'offensive'
	| 'copyright'
	| 'misinformation'
	| 'other';

export interface SocialInteraction {
	id: string;
	type: SocialInteractionType;
	userId: string;
	entityType: SocialEntityType;
	entityId: string;
	createdAt: Date;
	metadata?: {
		deviceInfo?: {
			type: string;
			os: string;
			browser?: string;
		};
		location?: {
			country?: string;
			region?: string;
			city?: string;
		};
		[key: string]: any;
	};
}

export interface SocialComment {
	id: string;
	userId: string;
	entityType: SocialEntityType;
	entityId: string;
	content: string;
	contentType: SocialContentType;
	parentId?: string;
	createdAt: Date;
	updatedAt?: Date;
	status: 'active' | 'hidden' | 'deleted' | 'reported';
	metadata?: {
		attachments?: Array<{
			type: string;
			url: string;
			thumbnail?: string;
		}>;
		mentions?: string[];
		tags?: string[];
		[key: string]: any;
	};
	metrics?: {
		likes: number;
		replies: number;
		reports: number;
	};
}

export interface SocialFollow {
	id: string;
	followerId: string;
	followedId: string;
	status: 'pending' | 'active' | 'blocked';
	createdAt: Date;
	updatedAt?: Date;
	metadata?: {
		source?: string;
		mutualFollow?: boolean;
		[key: string]: any;
	};
}

export interface SocialCollection {
	id: string;
	userId: string;
	name: string;
	description?: string;
	visibility: 'private' | 'public' | 'shared';
	items: Array<{
		type: SocialEntityType;
		id: string;
		addedAt: Date;
		note?: string;
	}>;
	createdAt: Date;
	updatedAt?: Date;
	metadata?: {
		thumbnail?: string;
		tags?: string[];
		collaborators?: string[];
		[key: string]: any;
	};
	metrics?: {
		items: number;
		views: number;
		saves: number;
		shares: number;
	};
}

export interface SocialReport {
	id: string;
	reporterId: string;
	entityType: SocialEntityType;
	entityId: string;
	reason: SocialReportReason;
	description?: string;
	status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
	createdAt: Date;
	updatedAt?: Date;
	metadata?: {
		evidence?: Array<{
			type: string;
			url: string;
			description?: string;
		}>;
		moderatorNotes?: Array<{
			userId: string;
			note: string;
			timestamp: Date;
		}>;
		resolution?: {
			action: string;
			reason: string;
			timestamp: Date;
			moderatorId: string;
		};
		[key: string]: any;
	};
}

export interface SocialMetrics {
	period: {
		start: Date;
		end: Date;
	};
	interactions: {
		total: number;
		byType: Record<SocialInteractionType, number>;
		byEntity: Record<SocialEntityType, number>;
		trending: Array<{
			entityType: SocialEntityType;
			entityId: string;
			count: number;
			change: number;
		}>;
	};
	engagement: {
		activeUsers: number;
		newUsers: number;
		retentionRate: number;
		averageInteractionsPerUser: number;
		topContributors: Array<{
			userId: string;
			interactions: number;
			influence: number;
		}>;
	};
	content: {
		totalComments: number;
		averageCommentLength: number;
		popularTags: Array<{
			tag: string;
			count: number;
			reach: number;
		}>;
		contentDistribution: Record<SocialContentType, number>;
	};
	moderation: {
		totalReports: number;
		resolvedReports: number;
		averageResolutionTime: number;
		commonReasons: Array<{
			reason: SocialReportReason;
			count: number;
			percentage: number;
		}>;
	};
}

export interface SocialSettings {
	id: string;
	userId: string;
	privacy: {
		profileVisibility: 'public' | 'private' | 'followers';
		activityVisibility: 'public' | 'private' | 'followers';
		allowMentions: boolean;
		allowTags: boolean;
		allowDirectMessages: boolean;
	};
	notifications: {
		likes: boolean;
		comments: boolean;
		follows: boolean;
		mentions: boolean;
		tags: boolean;
		collections: boolean;
	};
	contentFilters: {
		enabled: boolean;
		languages?: string[];
		sensitiveContent?: boolean;
		blockedKeywords?: string[];
		blockedUsers?: string[];
	};
	interactions: {
		autoAcceptFollows: boolean;
		allowReplies: 'everyone' | 'followers' | 'none';
		defaultCollectionVisibility: 'private' | 'public';
		moderationLevel: 'low' | 'medium' | 'high';
	};
}
