export type FeedbackType =
	| 'recipe_review'
	| 'meal_plan_rating'
	| 'app_feedback'
	| 'bug_report'
	| 'feature_request'
	| 'support_inquiry'
	| 'satisfaction_survey';

export type FeedbackStatus =
	| 'pending'
	| 'under_review'
	| 'in_progress'
	| 'resolved'
	| 'closed'
	| 'archived';

export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';

export type SentimentType = 'positive' | 'neutral' | 'negative';

export interface Feedback {
	id: string;
	type: FeedbackType;
	userId: string;
	title?: string;
	content: string;
	status: FeedbackStatus;
	priority?: FeedbackPriority;
	category?: string;
	rating?: number;
	sentiment?: SentimentType;
	attachments?: Array<{
		type: string;
		url: string;
		name: string;
		size: number;
	}>;
	metadata?: {
		deviceInfo?: {
			platform: string;
			browser?: string;
			version?: string;
		};
		location?: {
			country?: string;
			region?: string;
			language?: string;
		};
		context?: {
			page?: string;
			action?: string;
			referrer?: string;
		};
		[key: string]: any;
	};
	tags?: string[];
	createdAt: Date;
	updatedAt: Date;
}

export interface FeedbackResponse {
	id: string;
	feedbackId: string;
	responderId: string;
	content: string;
	isPublic: boolean;
	attachments?: Array<{
		type: string;
		url: string;
		name: string;
		size: number;
	}>;
	metadata?: {
		responseTime?: number;
		satisfaction?: number;
		[key: string]: any;
	};
	createdAt: Date;
	updatedAt: Date;
}

export interface FeedbackThread {
	id: string;
	feedbackId: string;
	messages: Array<{
		id: string;
		senderId: string;
		content: string;
		isInternal: boolean;
		attachments?: Array<{
			type: string;
			url: string;
			name: string;
			size: number;
		}>;
		createdAt: Date;
		updatedAt: Date;
	}>;
	participants: Array<{
		userId: string;
		role: 'customer' | 'support' | 'admin';
		joinedAt: Date;
	}>;
	status: 'active' | 'resolved' | 'closed';
	metadata?: {
		lastActivity: Date;
		resolution?: {
			resolvedBy: string;
			resolvedAt: Date;
			reason: string;
		};
		[key: string]: any;
	};
}

export interface FeedbackCategory {
	id: string;
	name: string;
	description?: string;
	parentId?: string;
	attributes?: Array<{
		name: string;
		type: 'text' | 'number' | 'boolean' | 'select';
		required: boolean;
		options?: string[];
	}>;
	routing?: {
		assignTo?: string[];
		priority?: FeedbackPriority;
		sla?: {
			responseTime: number;
			resolutionTime: number;
		};
	};
	metadata?: {
		icon?: string;
		color?: string;
		order?: number;
		[key: string]: any;
	};
	isActive: boolean;
}

export interface FeedbackMetrics {
	period: {
		start: Date;
		end: Date;
	};
	overview: {
		total: number;
		byType: Record<FeedbackType, number>;
		byStatus: Record<FeedbackStatus, number>;
		byPriority: Record<FeedbackPriority, number>;
		bySentiment: Record<SentimentType, number>;
	};
	responsiveness: {
		averageResponseTime: number;
		averageResolutionTime: number;
		responseRate: number;
		resolutionRate: number;
		slaCompliance: number;
	};
	satisfaction: {
		averageRating: number;
		ratingDistribution: Record<number, number>;
		nps?: {
			score: number;
			promoters: number;
			passives: number;
			detractors: number;
		};
	};
	trends: {
		daily: Array<{
			date: Date;
			count: number;
			sentiment: Record<SentimentType, number>;
		}>;
		categories: Array<{
			category: string;
			count: number;
			averageRating: number;
		}>;
		topIssues: Array<{
			issue: string;
			count: number;
			impact: number;
		}>;
	};
	performance: {
		teamMembers: Array<{
			userId: string;
			resolved: number;
			averageResponseTime: number;
			satisfaction: number;
		}>;
		categories: Array<{
			category: string;
			volume: number;
			resolutionTime: number;
			satisfaction: number;
		}>;
	};
}
