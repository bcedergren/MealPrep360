import { Document } from 'mongoose';
import {
	AnalyticsEvent,
	AnalyticsSession,
	AnalyticsReport,
	AnalyticsSegment,
	AnalyticsFunnel,
	AnalyticsInsight,
	AnalyticsExport,
	AnalyticsEventType,
	AnalyticsDimension,
	AnalyticsMetric,
} from './index';

// Omit the id field from the base types since Document will provide it
export interface IAnalyticsEventDocument
	extends Document,
		Omit<AnalyticsEvent, 'id'> {
	processing: {
		status: 'pending' | 'processed' | 'failed';
		attempts: number;
		error?: string;
	};
	enrichment: {
		userAgent?: string;
		ipAddress?: string;
		geoLocation?: {
			latitude?: number;
			longitude?: number;
			accuracy?: number;
		};
	};
	validation: {
		isValid: boolean;
		errors?: string[];
	};
}

export interface IAnalyticsSessionDocument
	extends Document,
		Omit<AnalyticsSession, 'id'> {
	analysis: {
		engagementScore?: number;
		bounceRate?: number;
		conversionRate?: number;
		averageEventTime?: number;
	};
	segments: Array<{
		id: string;
		name: string;
		conditions: any[];
	}>;
	tracking: {
		utm?: Record<string, string>;
		cookies?: Record<string, string>;
		pixels?: string[];
	};
}

export interface IAnalyticsReportDocument
	extends Document,
		Omit<AnalyticsReport, 'id'> {
	execution: {
		lastRun?: Date;
		duration?: number;
		status: 'active' | 'paused' | 'failed';
		error?: string;
	};
	access: {
		owner: string;
		sharedWith: string[];
		public: boolean;
	};
	version: {
		current: number;
		history: Array<{
			version: number;
			changes: string[];
			date: Date;
		}>;
	};
}

export interface IAnalyticsSegmentDocument
	extends Document,
		Omit<AnalyticsSegment, 'id'> {
	usage: {
		reports: string[];
		funnels: string[];
		lastUsed?: Date;
	};
	validation: {
		rules: Array<{
			type: string;
			value: any;
			message: string;
		}>;
		status: 'valid' | 'invalid' | 'warning';
	};
	computation: {
		sql?: string;
		cache?: {
			enabled: boolean;
			ttl: number;
		};
	};
}

export interface IAnalyticsFunnelDocument
	extends Document,
		Omit<AnalyticsFunnel, 'id'> {
	performance: {
		conversionRate: number;
		dropOffPoints: Array<{
			step: number;
			rate: number;
			count: number;
		}>;
		trends: Array<{
			date: string;
			rates: number[];
		}>;
	};
	segments: Array<{
		id: string;
		name: string;
		performance: {
			conversionRate: number;
			significance: number;
		};
	}>;
	monitoring: {
		alerts: Array<{
			condition: string;
			threshold: number;
			status: 'active' | 'triggered' | 'resolved';
		}>;
		lastChecked?: Date;
	};
}

export interface IAnalyticsInsightDocument
	extends Document,
		Omit<AnalyticsInsight, 'id'> {
	validation: {
		methodology: string;
		confidence: number;
		limitations?: string[];
	};
	actions: Array<{
		type: string;
		description: string;
		priority: 'low' | 'medium' | 'high';
		status: 'pending' | 'in_progress' | 'completed';
	}>;
	feedback: Array<{
		userId: string;
		rating: number;
		comment?: string;
		timestamp: Date;
	}>;
}

export interface IAnalyticsExportDocument
	extends Document,
		Omit<AnalyticsExport, 'id'> {
	processing: {
		progress: number;
		startTime?: Date;
		endTime?: Date;
		error?: string;
	};
	storage: {
		path: string;
		size: number;
		format: string;
		compression?: string;
	};
	security: {
		accessKey?: string;
		expiresAt: Date;
		downloadCount: number;
	};
}
