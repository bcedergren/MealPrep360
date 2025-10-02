import { Document, Types } from 'mongoose';
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
} from './index';

export interface ISocialInteractionDocument
	extends Omit<SocialInteraction, 'id'>,
		Document {
	id: Types.ObjectId;
	tracking: {
		ip?: string;
		userAgent?: string;
		referrer?: string;
		sessionId?: string;
	};
	validation: {
		verified: boolean;
		verifiedAt?: Date;
		verifiedBy?: string;
		score?: number;
	};
	processing: {
		status: 'pending' | 'processed' | 'failed';
		error?: string;
		attempts: number;
		lastAttempt?: Date;
	};
}

export interface ISocialCommentDocument
	extends Omit<SocialComment, 'id'>,
		Document {
	id: Types.ObjectId;
	moderation: {
		status: 'pending' | 'approved' | 'rejected';
		score?: number;
		flags?: Array<{
			type: string;
			confidence: number;
		}>;
		reviewedBy?: string;
		reviewedAt?: Date;
	};
	analytics: {
		impressions: number;
		engagement: number;
		sentiment?: {
			score: number;
			type: string;
		};
		reach?: {
			direct: number;
			indirect: number;
		};
	};
	history: Array<{
		content: string;
		contentType: SocialContentType;
		metadata?: Record<string, any>;
		timestamp: Date;
	}>;
}

export interface ISocialFollowDocument
	extends Omit<SocialFollow, 'id'>,
		Document {
	id: Types.ObjectId;
	validation: {
		verified: boolean;
		verifiedAt?: Date;
		method?: string;
		token?: string;
	};
	history: Array<{
		status: string;
		reason?: string;
		timestamp: Date;
		initiator: string;
	}>;
	metrics: {
		interactions: number;
		lastInteraction?: Date;
		commonInterests?: string[];
		strength?: number;
	};
	privacy: {
		visibility: 'visible' | 'hidden';
		allowNotifications: boolean;
		customSettings?: Record<string, any>;
	};
}

export interface ISocialCollectionDocument
	extends Omit<SocialCollection, 'id'>,
		Document {
	id: Types.ObjectId;
	organization: {
		categories?: string[];
		order?: 'manual' | 'date' | 'popularity';
		layout?: 'grid' | 'list' | 'gallery';
		filters?: Record<string, any>;
	};
	collaboration: {
		enabled: boolean;
		roles?: Record<
			string,
			{
				role: 'owner' | 'editor' | 'viewer';
				addedAt: Date;
				addedBy: string;
			}
		>;
		invites?: Array<{
			email: string;
			role: string;
			status: string;
			expiresAt: Date;
		}>;
	};
	analytics: {
		views: Array<{
			userId?: string;
			timestamp: Date;
			source?: string;
		}>;
		shares: Array<{
			platform: string;
			count: number;
			lastShared: Date;
		}>;
		popularity: {
			score: number;
			trend: 'up' | 'down' | 'stable';
			rank?: number;
		};
	};
}

export interface ISocialReportDocument
	extends Omit<SocialReport, 'id'>,
		Document {
	id: Types.ObjectId;
	processing: {
		status: 'queued' | 'reviewing' | 'actioned' | 'closed';
		priority: 'low' | 'medium' | 'high' | 'urgent';
		assignedTo?: string;
		dueDate?: Date;
	};
	analysis: {
		severity: number;
		confidence: number;
		categories: string[];
		relatedReports?: string[];
		automaticActions?: Array<{
			type: string;
			timestamp: Date;
			result: string;
		}>;
	};
	communication: {
		notifications: Array<{
			type: string;
			recipient: string;
			status: string;
			sentAt: Date;
		}>;
		responses: Array<{
			from: string;
			content: string;
			timestamp: Date;
			internal: boolean;
		}>;
	};
}

export interface ISocialMetricsDocument extends Document, SocialMetrics {
	analysis: {
		trends: Array<{
			metric: string;
			period: string;
			value: number;
			change: number;
			insight: string;
		}>;
		patterns: Array<{
			type: string;
			description: string;
			confidence: number;
			impact: 'low' | 'medium' | 'high';
		}>;
		recommendations: Array<{
			target: string;
			action: string;
			expectedImpact: string;
			priority: number;
		}>;
	};
	segments: {
		userGroups: Array<{
			name: string;
			size: number;
			characteristics: Record<string, any>;
			engagement: number;
		}>;
		contentTypes: Array<{
			type: string;
			volume: number;
			performance: number;
			audience: string[];
		}>;
		timeFrames: Array<{
			period: string;
			activity: number;
			peak: Date;
			low: Date;
		}>;
	};
	benchmarks: {
		industry: Record<string, number>;
		historical: Array<{
			period: string;
			metrics: Record<string, number>;
		}>;
		targets: Record<
			string,
			{
				current: number;
				target: number;
				progress: number;
			}
		>;
	};
}

export interface ISocialSettingsDocument
	extends Omit<SocialSettings, 'id'>,
		Document {
	id: Types.ObjectId;
	preferences: {
		language: string;
		timezone: string;
		theme?: string;
		accessibility?: {
			highContrast?: boolean;
			textSize?: string;
			reduceMotion?: boolean;
		};
	};
	security: {
		twoFactorEnabled: boolean;
		loginHistory: Array<{
			timestamp: Date;
			ip: string;
			device: string;
			location?: string;
		}>;
		blockedEntities: Array<{
			type: SocialEntityType;
			id: string;
			reason?: string;
			timestamp: Date;
		}>;
	};
	features: {
		beta?: string[];
		customizations?: Record<string, any>;
		limits?: Record<string, number>;
		permissions?: string[];
	};
	integrations: {
		connectedAccounts?: Record<
			string,
			{
				id: string;
				status: string;
				lastSync: Date;
			}
		>;
		webhooks?: Array<{
			url: string;
			events: string[];
			active: boolean;
		}>;
		api?: {
			enabled: boolean;
			key?: string;
			usage: number;
		};
	};
}
