import { Document } from 'mongoose';
import {
	Feedback,
	FeedbackResponse,
	FeedbackThread,
	FeedbackCategory,
	FeedbackMetrics,
	FeedbackType,
	FeedbackStatus,
	FeedbackPriority,
	SentimentType,
} from './index';

export interface IFeedbackDocument extends Document, Omit<Feedback, 'id'> {
	analysis: {
		sentiment?: {
			score: number;
			confidence: number;
			keywords: string[];
		};
		classification?: {
			category: string;
			confidence: number;
			tags: string[];
		};
		priority?: {
			score: number;
			factors: string[];
		};
	};
	workflow: {
		assignedTo?: string;
		dueDate?: Date;
		escalations?: Array<{
			level: number;
			reason: string;
			timestamp: Date;
		}>;
		history: Array<{
			status: FeedbackStatus;
			changedBy: string;
			timestamp: Date;
			reason?: string;
		}>;
	};
	metrics: {
		responseTime?: number;
		resolutionTime?: number;
		reopenCount: number;
		viewCount: number;
		helpfulCount: number;
	};
	relationships?: {
		relatedFeedback: string[];
		parentFeedback?: string;
		duplicateOf?: string;
	};
}

export interface IFeedbackResponseDocument
	extends Document,
		Omit<FeedbackResponse, 'id'> {
	analysis: {
		sentiment?: {
			score: number;
			confidence: number;
		};
		quality?: {
			score: number;
			issues: string[];
		};
	};
	metrics: {
		helpfulCount: number;
		viewCount: number;
		responseTime: number;
	};
	workflow: {
		reviewedBy?: string;
		reviewedAt?: Date;
		status: 'draft' | 'published' | 'archived';
	};
}

export interface IFeedbackThreadDocument
	extends Document,
		Omit<FeedbackThread, 'id'> {
	metrics: {
		messageCount: number;
		participantCount: number;
		averageResponseTime: number;
		lastActivityBy: string;
	};
	workflow: {
		assignedTo?: string;
		priority: FeedbackPriority;
		status: 'active' | 'resolved' | 'closed';
		history: Array<{
			status: string;
			changedBy: string;
			timestamp: Date;
		}>;
	};
	notifications: {
		subscribers: string[];
		lastNotified?: Date;
		settings: {
			onNewMessage: boolean;
			onStatusChange: boolean;
			onResolution: boolean;
		};
	};
}

export interface IFeedbackCategoryDocument
	extends Document,
		Omit<FeedbackCategory, 'id'> {
	metrics: {
		totalFeedback: number;
		averageRating: number;
		responseTime: number;
		resolutionRate: number;
	};
	workflow: {
		autoAssignment?: {
			enabled: boolean;
			rules: Array<{
				condition: string;
				assignTo: string[];
			}>;
		};
		sla?: {
			responseTime: number;
			resolutionTime: number;
			priority: FeedbackPriority;
		};
	};
	validation?: {
		required: string[];
		patterns: Record<string, string>;
		dependencies: Record<string, string[]>;
	};
}

export interface IFeedbackMetricsDocument extends Document, FeedbackMetrics {
	metadata: {
		generatedAt: Date;
		dataPoints: number;
		filters?: Record<string, any>;
	};
	insights: Array<{
		type: string;
		title: string;
		description: string;
		severity: 'info' | 'warning' | 'critical';
		metrics: Record<string, number>;
	}>;
	comparisons?: {
		previousPeriod: {
			start: Date;
			end: Date;
			metrics: Record<string, number>;
		};
		changes: Array<{
			metric: string;
			change: number;
			trend: 'up' | 'down' | 'stable';
		}>;
	};
}
