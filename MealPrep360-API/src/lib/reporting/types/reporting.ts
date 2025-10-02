import { Document } from 'mongoose';
import {
	Report,
	ReportTemplate,
	ReportExecution,
	ReportDashboard,
	ReportAlert,
	ReportMetrics,
	ReportType,
	ReportFormat,
	ReportFrequency,
	ReportStatus,
	DataSourceType,
} from './index';

export interface IReportDocument extends Document, Report {
	access: {
		owner: string;
		shared: Array<{
			type: 'user' | 'role' | 'public';
			id?: string;
			permissions: Array<'view' | 'edit' | 'delete' | 'share'>;
		}>;
		history: Array<{
			action: string;
			user: string;
			timestamp: Date;
		}>;
	};
	execution: {
		history: Array<{
			id: string;
			status: ReportStatus;
			startTime: Date;
			endTime?: Date;
			error?: string;
		}>;
		stats: {
			totalRuns: number;
			successRate: number;
			averageTime: number;
			lastSuccess?: Date;
		};
	};
	validation: {
		rules: Array<{
			field: string;
			type: string;
			params: Record<string, any>;
		}>;
		dependencies: Array<{
			type: string;
			id: string;
			required: boolean;
		}>;
		constraints: {
			maxRows?: number;
			timeout?: number;
			caching?: {
				enabled: boolean;
				ttl: number;
			};
		};
	};
	optimization: {
		caching: {
			enabled: boolean;
			strategy: string;
			invalidation: Array<{
				event: string;
				action: string;
			}>;
		};
		performance: {
			indexes: string[];
			partitioning?: {
				enabled: boolean;
				strategy: string;
			};
			materialization?: {
				enabled: boolean;
				schedule: string;
			};
		};
	};
}

export interface IReportTemplateDocument extends Document, ReportTemplate {
	versioning: {
		current: string;
		history: Array<{
			version: string;
			changes: string[];
			author: string;
			timestamp: Date;
		}>;
		draft?: {
			content: any;
			editor: string;
			lastModified: Date;
		};
	};
	usage: {
		reports: Array<{
			id: string;
			name: string;
			created: Date;
		}>;
		stats: {
			totalReports: number;
			activeReports: number;
			lastUsed?: Date;
		};
	};
	customization: {
		variables: Record<string, any>;
		functions: Array<{
			name: string;
			type: string;
			body: string;
		}>;
		styling: {
			theme?: string;
			fonts?: string[];
			colors?: Record<string, string>;
		};
	};
	security: {
		encryption?: {
			enabled: boolean;
			algorithm: string;
			keyId: string;
		};
		audit: {
			enabled: boolean;
			events: string[];
			retention: number;
		};
		compliance: {
			standards: string[];
			certifications: string[];
		};
	};
}

export interface IReportExecutionDocument extends Document, ReportExecution {
	resources: {
		cpu: {
			usage: number;
			limit: number;
		};
		memory: {
			usage: number;
			peak: number;
			limit: number;
		};
		storage: {
			temp: number;
			output: number;
		};
	};
	monitoring: {
		stages: Array<{
			name: string;
			status: string;
			duration: number;
			metrics: Record<string, number>;
		}>;
		logs: Array<{
			level: string;
			message: string;
			timestamp: Date;
			context?: Record<string, any>;
		}>;
		alerts: Array<{
			type: string;
			message: string;
			timestamp: Date;
			severity: string;
		}>;
	};
	caching: {
		hit: boolean;
		key: string;
		ttl: number;
		size: number;
		invalidation?: {
			reason: string;
			timestamp: Date;
		};
	};
	distribution: {
		node: string;
		cluster: string;
		region: string;
		partitions?: Array<{
			id: string;
			size: number;
			status: string;
		}>;
	};
}

export interface IReportDashboardDocument extends Document, ReportDashboard {
	state: {
		lastRefresh: Date;
		widgetStatus: Record<
			string,
			{
				status: string;
				error?: string;
				lastUpdate: Date;
			}
		>;
		userSessions: Array<{
			userId: string;
			startTime: Date;
			active: boolean;
		}>;
	};
	interactions: {
		filters: Array<{
			id: string;
			type: string;
			value: any;
			appliedBy: string;
			timestamp: Date;
		}>;
		drilldowns: Array<{
			widgetId: string;
			path: string[];
			user: string;
			timestamp: Date;
		}>;
		exports: Array<{
			type: string;
			user: string;
			timestamp: Date;
			format: string;
		}>;
	};
	optimization: {
		refreshStrategy: {
			mode: 'full' | 'incremental' | 'selective';
			dependencies: Record<string, string[]>;
			schedule?: {
				cron: string;
				timezone: string;
			};
		};
		caching: {
			enabled: boolean;
			policy: {
				ttl: number;
				invalidation: string[];
			};
			storage: {
				type: string;
				config: Record<string, any>;
			};
		};
	};
	customization: {
		css?: string;
		scripts?: Array<{
			url: string;
			loading: 'async' | 'defer';
		}>;
		variables: Record<string, any>;
		hooks: Array<{
			event: string;
			handler: string;
		}>;
	};
}

export interface IReportAlertDocument extends Document, ReportAlert {
	evaluation: {
		history: Array<{
			timestamp: Date;
			result: boolean;
			metrics: Record<string, number>;
			threshold: Record<string, number>;
		}>;
		trends: Array<{
			metric: string;
			values: Array<{
				timestamp: Date;
				value: number;
			}>;
		}>;
		incidents: Array<{
			startTime: Date;
			endTime?: Date;
			severity: string;
			resolution?: string;
		}>;
	};
	notificationHistory: {
		history: Array<{
			type: string;
			recipient: string;
			status: string;
			timestamp: Date;
			error?: string;
		}>;
		throttling: {
			enabled: boolean;
			window: number;
			limit: number;
			current: number;
		};
		templates: Record<
			string,
			{
				subject: string;
				body: string;
				format: string;
			}
		>;
	};
	escalation: {
		levels: Array<{
			threshold: number;
			actions: Array<{
				type: string;
				config: Record<string, any>;
			}>;
		}>;
		current: {
			level: number;
			since: Date;
			actions: string[];
		};
	};
	recovery: {
		automatic: {
			enabled: boolean;
			actions: Array<{
				type: string;
				config: Record<string, any>;
			}>;
		};
		manual: {
			required: boolean;
			approvers: string[];
			steps: string[];
		};
	};
}

export interface IReportMetricsDocument extends Document, ReportMetrics {
	analysis: {
		trends: Array<{
			metric: string;
			period: string;
			values: Array<{
				timestamp: Date;
				value: number;
			}>;
			insights: Array<{
				type: string;
				description: string;
				significance: number;
			}>;
		}>;
		correlations: Array<{
			metrics: string[];
			coefficient: number;
			confidence: number;
			period: string;
		}>;
		anomalies: Array<{
			metric: string;
			timestamp: Date;
			expected: number;
			actual: number;
			severity: number;
		}>;
	};
	resources: {
		utilization: {
			cpu: Array<{
				timestamp: Date;
				usage: number;
				limit: number;
			}>;
			memory: Array<{
				timestamp: Date;
				usage: number;
				limit: number;
			}>;
			storage: {
				total: number;
				available: number;
				growth: number;
			};
		};
		costs: {
			total: number;
			byResource: Record<string, number>;
			byReport: Record<string, number>;
			forecast: Array<{
				period: string;
				amount: number;
			}>;
		};
	};
	quality: {
		accuracy: {
			score: number;
			issues: Array<{
				type: string;
				count: number;
				impact: string;
			}>;
		};
		reliability: {
			uptime: number;
			mtbf: number;
			mttr: number;
			incidents: Array<{
				type: string;
				count: number;
				duration: number;
			}>;
		};
		performance: {
			sla: {
				target: number;
				actual: number;
				breaches: number;
			};
			optimization: Array<{
				type: string;
				impact: number;
				recommendation: string;
			}>;
		};
	};
}
