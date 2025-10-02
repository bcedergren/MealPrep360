export interface AnalyticsQuery {
	type?: string;
	userId?: string;
	sessionId?: string;
	startDate?: Date;
	endDate?: Date;
	metrics?: string[];
	dimensions?: string[];
	filters?: Record<string, any>;
	limit?: number;
	offset?: number;
}

export interface AnalyticsResult {
	data: Array<{
		dimensions: Record<string, any>;
		metrics: Record<string, number>;
	}>;
	metadata: {
		totalRows: number;
		processedAt: Date;
		executionTime: number;
	};
	summary?: {
		totals: Record<string, number>;
		trends: Array<{
			metric: string;
			change: number;
			direction: 'up' | 'down' | 'stable';
		}>;
	};
}

export interface AnalyticsEvent {
	id: string;
	type: string;
	userId: string;
	sessionId?: string;
	data: Record<string, any>;
	timestamp: Date;
	metadata?: {
		source: string;
		version: string;
		context?: Record<string, any>;
	};
}

export interface AnalyticsSession {
	id: string;
	userId: string;
	deviceId?: string;
	startTime: Date;
	endTime?: Date;
	duration?: number;
	events: string[];
	metadata: {
		platform: string;
		browser: string;
		location?: string;
		referrer?: string;
	};
}

export interface AnalyticsInsight {
	type: string;
	description: string;
	score: number;
	data: Record<string, any>;
	recommendations?: Array<{
		action: string;
		impact: string;
		priority: 'high' | 'medium' | 'low';
	}>;
	metadata: {
		generatedAt: Date;
		validUntil?: Date;
		confidence: number;
	};
}

export interface AnalyticsReport {
	id: string;
	name: string;
	description: string;
	type: string;
	format: 'json' | 'csv' | 'pdf' | 'excel';
	schedule?: {
		frequency: string;
		lastRun?: Date;
		nextRun?: Date;
		timezone: string;
	};
	query: AnalyticsQuery;
	results?: AnalyticsResult;
	status: 'pending' | 'running' | 'completed' | 'failed';
	metadata: {
		createdAt: Date;
		updatedAt: Date;
		createdBy: string;
		version: string;
	};
}

export interface AnalyticsSegment {
	id: string;
	name: string;
	description: string;
	criteria: Array<{
		field: string;
		operator: string;
		value: any;
	}>;
	metadata: {
		size: number;
		lastUpdated: Date;
		updateFrequency: string;
	};
	insights?: Array<{
		type: string;
		value: any;
		significance: number;
	}>;
}

export interface AnalyticsFunnel {
	id: string;
	name: string;
	description: string;
	steps: Array<{
		name: string;
		event: string;
		conditions?: Record<string, any>;
		timeout?: number;
	}>;
	metadata: {
		createdAt: Date;
		updatedAt: Date;
		version: string;
	};
}

export interface AnalyticsExport {
	id: string;
	name: string;
	type: string;
	format: string;
	query: AnalyticsQuery;
	schedule?: {
		frequency: string;
		lastRun?: Date;
		nextRun?: Date;
	};
	destination: {
		type: string;
		config: Record<string, any>;
	};
}

export interface AnalyticsDashboard {
	id: string;
	name: string;
	description: string;
	layout: Array<{
		id: string;
		type: string;
		query: AnalyticsQuery;
		visualization: {
			type: string;
			config: Record<string, any>;
		};
		position: {
			x: number;
			y: number;
			width: number;
			height: number;
		};
	}>;
	filters?: Array<{
		field: string;
		operator: string;
		value: any;
	}>;
	sharing: {
		public: boolean;
		users: string[];
		roles: string[];
	};
	settings: {
		refreshInterval?: number;
		timezone: string;
		theme?: string;
	};
}

export interface AnalyticsAlert {
	id: string;
	name: string;
	description: string;
	query: AnalyticsQuery;
	conditions: Array<{
		metric: string;
		operator: string;
		threshold: number;
		duration?: {
			value: number;
			unit: string;
		};
	}>;
	notifications: Array<{
		type: string;
		config: Record<string, any>;
	}>;
	status: {
		enabled: boolean;
		lastCheck?: Date;
		lastTriggered?: Date;
		state: 'normal' | 'warning' | 'critical';
	};
	metadata: {
		createdAt: Date;
		updatedAt: Date;
		createdBy: string;
		version: string;
	};
}

export type AnalyticsEventType =
	| 'page_view'
	| 'click'
	| 'form_submit'
	| 'custom';

export type AnalyticsDimension =
	| 'user'
	| 'session'
	| 'device'
	| 'location'
	| 'time';

export type AnalyticsMetric = 'count' | 'sum' | 'average' | 'rate' | 'duration';
