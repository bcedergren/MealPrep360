export type ReportType =
	| 'user_activity'
	| 'recipe_analytics'
	| 'meal_plan_insights'
	| 'shopping_trends'
	| 'nutrition_analysis'
	| 'cost_analysis'
	| 'engagement_metrics'
	| 'system_health';

export type ReportFormat =
	| 'json'
	| 'csv'
	| 'pdf'
	| 'excel'
	| 'html'
	| 'dashboard';

export type ReportFrequency =
	| 'realtime'
	| 'hourly'
	| 'daily'
	| 'weekly'
	| 'monthly'
	| 'quarterly'
	| 'yearly'
	| 'once';

export type ReportStatus =
	| 'scheduled'
	| 'running'
	| 'completed'
	| 'failed'
	| 'cancelled';

export type DataSourceType =
	| 'database'
	| 'api'
	| 'file'
	| 'stream'
	| 'cache'
	| 'warehouse';

export interface Report {
	userId: string;
	name: string;
	description: string;
	type: ReportType;
	format: ReportFormat;
	schedule?: {
		frequency: ReportFrequency;
		startDate: Date;
		endDate?: Date;
		timezone: string;
		lastRun?: Date;
		nextRun?: Date;
	};
	parameters: {
		dateRange?: {
			start: Date;
			end: Date;
		};
		filters?: Record<string, any>;
		groupBy?: string[];
		metrics?: string[];
		dimensions?: string[];
		limit?: number;
		offset?: number;
	};
	delivery?: {
		method: 'email' | 'webhook' | 'storage' | 'dashboard';
		recipients?: string[];
		webhookUrl?: string;
		storagePath?: string;
	};
	status: ReportStatus;
	metadata?: {
		version?: string;
		tags?: string[];
		category?: string;
		priority?: number;
		[key: string]: any;
	};
}

export interface ReportTemplate {
	name: string;
	description: string;
	type: ReportType;
	format: ReportFormat;
	definition: {
		dataSources: Array<{
			type: DataSourceType;
			config: Record<string, any>;
			transforms?: Array<{
				type: string;
				params: Record<string, any>;
			}>;
		}>;
		layout?: {
			sections: Array<{
				id: string;
				type: string;
				content: Record<string, any>;
			}>;
			styling?: Record<string, any>;
		};
		parameters: Array<{
			name: string;
			type: string;
			required: boolean;
			defaultValue?: any;
			validation?: {
				rules: Array<{
					type: string;
					value: any;
				}>;
			};
		}>;
	};
	permissions?: {
		roles: string[];
		users: string[];
		public: boolean;
	};
	metadata?: {
		version: string;
		author: string;
		created: Date;
		updated: Date;
		tags: string[];
	};
}

export interface ReportExecution {
	reportId: string;
	startTime: Date;
	endTime?: Date;
	status: ReportStatus;
	parameters: Record<string, any>;
	results?: {
		data: any;
		summary?: {
			rowCount: number;
			totalPages: number;
			executionTime: number;
		};
		visualizations?: Array<{
			type: string;
			data: any;
			config: Record<string, any>;
		}>;
	};
	error?: {
		code: string;
		message: string;
		details?: any;
	};
	performance: {
		queryTime: number;
		processingTime: number;
		renderingTime: number;
		totalTime: number;
	};
}

export interface ReportDashboard {
	name: string;
	description: string;
	layout: {
		type: 'grid' | 'flex' | 'custom';
		config: Record<string, any>;
		widgets: Array<{
			id: string;
			type: string;
			reportId?: string;
			position: {
				x: number;
				y: number;
				width: number;
				height: number;
			};
			config: Record<string, any>;
		}>;
	};
	filters?: {
		global: Record<string, any>;
		widgets: Record<string, Record<string, any>>;
	};
	sharing: {
		public: boolean;
		roles: string[];
		users: string[];
		expiresAt?: Date;
	};
	settings: {
		refreshInterval?: number;
		theme?: string;
		interactivity?: {
			drilldown: boolean;
			filters: boolean;
			export: boolean;
		};
	};
}

export interface ReportAlert {
	reportId: string;
	name: string;
	description: string;
	conditions: Array<{
		metric: string;
		operator: string;
		value: number;
		timeframe?: {
			duration: number;
			unit: string;
		};
	}>;
	notifications: Array<{
		type: 'email' | 'webhook' | 'slack' | 'sms';
		recipients: string[];
		template?: string;
		config?: Record<string, any>;
	}>;
	schedule: {
		frequency: string;
		timezone: string;
		active: boolean;
	};
	status: {
		lastCheck: Date;
		lastTrigger?: Date;
		triggered: number;
		state: 'normal' | 'warning' | 'critical';
	};
}

export interface ReportMetrics {
	period: {
		start: Date;
		end: Date;
	};
	usage: {
		totalReports: number;
		activeReports: number;
		byType: Record<ReportType, number>;
		byFormat: Record<ReportFormat, number>;
	};
	performance: {
		averageExecutionTime: number;
		p95ExecutionTime: number;
		errorRate: number;
		concurrentExecutions: number;
	};
	storage: {
		totalSize: number;
		byFormat: Record<ReportFormat, number>;
		growth: number;
	};
	delivery: {
		successful: number;
		failed: number;
		byMethod: Record<string, number>;
	};
	users: {
		total: number;
		active: number;
		byRole: Record<string, number>;
	};
}
