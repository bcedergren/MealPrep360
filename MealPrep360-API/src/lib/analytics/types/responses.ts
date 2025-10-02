import {
	AnalyticsEvent,
	AnalyticsReport,
	AnalyticsSegment,
	AnalyticsDashboard,
	AnalyticsAlert,
} from './index';

export interface ApiResponse<T> {
	data: T;
	metadata?: {
		timestamp: string;
		version: string;
	};
}

export interface EventResponse extends ApiResponse<AnalyticsEvent> {}
export interface EventListResponse extends ApiResponse<AnalyticsEvent[]> {}
export interface ReportResponse extends ApiResponse<AnalyticsReport> {}
export interface ReportListResponse extends ApiResponse<AnalyticsReport[]> {}
export interface SegmentResponse extends ApiResponse<AnalyticsSegment> {}
export interface SegmentListResponse extends ApiResponse<AnalyticsSegment[]> {}
export interface DashboardResponse extends ApiResponse<AnalyticsDashboard> {}
export interface DashboardListResponse
	extends ApiResponse<AnalyticsDashboard[]> {}
export interface AlertResponse extends ApiResponse<AnalyticsAlert> {}
export interface AlertListResponse extends ApiResponse<AnalyticsAlert[]> {}

export interface AggregateResponse
	extends ApiResponse<
		Array<{
			dimensions: Record<string, any>;
			metrics: Record<string, number>;
		}>
	> {}

export interface InsightsResponse
	extends ApiResponse<{
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
	}> {}

export interface RecommendationsResponse
	extends ApiResponse<
		Array<{
			id: string;
			type: string;
			score: number;
			reason: string;
			metadata: Record<string, any>;
		}>
	> {}

export interface PerformanceMetricsResponse
	extends ApiResponse<{
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
	}> {}

export interface UsageStatisticsResponse
	extends ApiResponse<{
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
	}> {}

export interface AlertTestResponse
	extends ApiResponse<{
		triggered: boolean;
		evaluations: Array<{
			condition: string;
			result: boolean;
			actual: number;
			expected: number;
		}>;
	}> {}
