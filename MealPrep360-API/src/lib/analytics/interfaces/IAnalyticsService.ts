import {
	AnalyticsEvent,
	AnalyticsInsight,
	AnalyticsReport,
	AnalyticsSegment,
	AnalyticsDashboard,
	AnalyticsAlert,
} from '../types';

export interface IAnalyticsService {
	// Event Management
	trackEvent(eventData: {
		type: string;
		userId: string;
		sessionId?: string;
		data: Record<string, any>;
		timestamp?: Date;
	}): Promise<AnalyticsEvent>;

	getEvent(eventId: string): Promise<AnalyticsEvent | null>;

	getEvents(filters: {
		type?: string;
		userId?: string;
		sessionId?: string;
		startDate?: Date;
		endDate?: Date;
	}): Promise<AnalyticsEvent[]>;

	deleteEvent(eventId: string): Promise<void>;

	// Analytics & Insights
	aggregateEvents(params: {
		type?: string;
		userId?: string;
		sessionId?: string;
		startDate?: Date;
		endDate?: Date;
		groupBy: string[];
		metrics: string[];
	}): Promise<
		Array<{
			dimensions: Record<string, any>;
			metrics: Record<string, number>;
		}>
	>;

	getUserInsights(userId: string): Promise<{
		activity: {
			totalEvents: number;
			lastActive: Date;
			topEvents: Array<{
				type: string;
				count: number;
			}>;
		};
		engagement: {
			sessionsCount: number;
			averageSessionDuration: number;
			bounceRate: number;
		};
		preferences: {
			favoriteRecipes: string[];
			preferredCuisines: string[];
			dietaryRestrictions: string[];
		};
		trends: Array<{
			period: string;
			metrics: Record<string, number>;
		}>;
	}>;

	getRecommendations(
		userId: string,
		type: string
	): Promise<
		Array<{
			id: string;
			type: string;
			score: number;
			reason: string;
			metadata: Record<string, any>;
		}>
	>;

	// Report Management
	createReport(report: Omit<AnalyticsReport, 'id'>): Promise<AnalyticsReport>;

	getReport(reportId: string): Promise<AnalyticsReport>;

	listReports(filters?: {
		userId?: string;
		type?: string;
		status?: string;
	}): Promise<AnalyticsReport[]>;

	updateReport(
		reportId: string,
		updates: Partial<AnalyticsReport>
	): Promise<AnalyticsReport>;

	deleteReport(reportId: string): Promise<void>;

	executeReport(
		reportId: string,
		parameters?: Record<string, any>
	): Promise<AnalyticsReport>;

	// Performance Metrics
	getPerformanceMetrics(filters: {
		startDate: Date;
		endDate: Date;
		resolution?: string;
	}): Promise<{
		requests: {
			total: number;
			successful: number;
			failed: number;
			latency: {
				avg: number;
				p95: number;
				p99: number;
			};
		};
		errors: Array<{
			type: string;
			count: number;
			rate: number;
		}>;
		resources: {
			cpu: {
				usage: number;
				limit: number;
			};
			memory: {
				usage: number;
				limit: number;
			};
			storage: {
				used: number;
				available: number;
			};
		};
	}>;

	// Usage Statistics
	getUsageStatistics(filters: {
		startDate: Date;
		endDate: Date;
		groupBy?: string[];
	}): Promise<{
		users: {
			total: number;
			active: number;
			new: number;
		};
		features: Record<
			string,
			{
				usage: number;
				uniqueUsers: number;
			}
		>;
		subscriptions: {
			total: number;
			byTier: Record<string, number>;
			revenue: number;
		};
	}>;

	// Segment Management
	createSegment(
		segment: Omit<AnalyticsSegment, 'id'>
	): Promise<AnalyticsSegment>;

	getSegment(segmentId: string): Promise<AnalyticsSegment>;

	listSegments(filters?: {
		type?: string;
		minSize?: number;
	}): Promise<AnalyticsSegment[]>;

	updateSegment(
		segmentId: string,
		updates: Partial<AnalyticsSegment>
	): Promise<AnalyticsSegment>;

	deleteSegment(segmentId: string): Promise<void>;

	// Dashboard Management
	createDashboard(
		dashboard: Omit<AnalyticsDashboard, 'id'>
	): Promise<AnalyticsDashboard>;

	getDashboard(dashboardId: string): Promise<AnalyticsDashboard>;

	listDashboards(filters?: {
		userId?: string;
		shared?: boolean;
	}): Promise<AnalyticsDashboard[]>;

	updateDashboard(
		dashboardId: string,
		updates: Partial<AnalyticsDashboard>
	): Promise<AnalyticsDashboard>;

	deleteDashboard(dashboardId: string): Promise<void>;

	// Alert Management
	createAlert(alert: Omit<AnalyticsAlert, 'id'>): Promise<AnalyticsAlert>;

	getAlert(alertId: string): Promise<AnalyticsAlert>;

	listAlerts(filters?: {
		status?: string;
		severity?: string;
	}): Promise<AnalyticsAlert[]>;

	updateAlert(
		alertId: string,
		updates: Partial<AnalyticsAlert>
	): Promise<AnalyticsAlert>;

	deleteAlert(alertId: string): Promise<void>;

	testAlert(
		alertId: string,
		testData?: Record<string, any>
	): Promise<{
		triggered: boolean;
		evaluations: Array<{
			condition: string;
			result: boolean;
			actual: number;
			expected: number;
		}>;
	}>;
}
