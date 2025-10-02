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
} from '../types';
import {
	IReportDocument,
	IReportTemplateDocument,
	IReportExecutionDocument,
	IReportDashboardDocument,
	IReportAlertDocument,
	IReportMetricsDocument,
} from '../types/reporting';

export interface IReportingService {
	// Report Management
	createReport(report: Omit<Report, 'id'>): Promise<IReportDocument>;
	getReport(reportId: string): Promise<IReportDocument>;
	listReports(filters?: {
		userId?: string;
		type?: ReportType;
		status?: ReportStatus;
		startDate?: Date;
		endDate?: Date;
	}): Promise<IReportDocument[]>;
	updateReport(
		reportId: string,
		updates: Partial<Report>
	): Promise<IReportDocument>;
	deleteReport(reportId: string): Promise<void>;
	executeReport(
		reportId: string,
		parameters?: Record<string, any>
	): Promise<IReportExecutionDocument>;

	// Template Management
	createTemplate(
		template: Omit<ReportTemplate, 'id'>
	): Promise<IReportTemplateDocument>;
	getTemplate(templateId: string): Promise<IReportTemplateDocument>;
	listTemplates(filters?: {
		type?: ReportType;
		format?: ReportFormat;
	}): Promise<IReportTemplateDocument[]>;
	updateTemplate(
		templateId: string,
		updates: Partial<ReportTemplate>
	): Promise<IReportTemplateDocument>;
	deleteTemplate(templateId: string): Promise<void>;
	validateTemplate(template: Partial<ReportTemplate>): Promise<{
		valid: boolean;
		errors?: string[];
	}>;

	// Execution Management
	getExecution(executionId: string): Promise<IReportExecutionDocument>;
	listExecutions(filters?: {
		reportId?: string;
		status?: ReportStatus;
		startDate?: Date;
		endDate?: Date;
	}): Promise<IReportExecutionDocument[]>;
	cancelExecution(executionId: string): Promise<void>;
	retryExecution(executionId: string): Promise<IReportExecutionDocument>;
	getExecutionStatus(executionId: string): Promise<{
		status: ReportStatus;
		progress: number;
		error?: string;
	}>;

	// Dashboard Management
	createDashboard(
		dashboard: Omit<ReportDashboard, 'id'>
	): Promise<IReportDashboardDocument>;
	getDashboard(dashboardId: string): Promise<IReportDashboardDocument>;
	listDashboards(filters?: {
		userId?: string;
		shared?: boolean;
	}): Promise<IReportDashboardDocument[]>;
	updateDashboard(
		dashboardId: string,
		updates: Partial<ReportDashboard>
	): Promise<IReportDashboardDocument>;
	deleteDashboard(dashboardId: string): Promise<void>;
	refreshDashboard(
		dashboardId: string,
		widgets?: string[]
	): Promise<IReportDashboardDocument>;

	// Alert Management
	createAlert(alert: Omit<ReportAlert, 'id'>): Promise<IReportAlertDocument>;
	getAlert(alertId: string): Promise<IReportAlertDocument>;
	listAlerts(filters?: {
		reportId?: string;
		status?: string;
	}): Promise<IReportAlertDocument[]>;
	updateAlert(
		alertId: string,
		updates: Partial<ReportAlert>
	): Promise<IReportAlertDocument>;
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

	// Metrics & Analytics
	getMetrics(
		startDate: Date,
		endDate: Date,
		filters?: {
			type?: ReportType;
			format?: ReportFormat;
		}
	): Promise<IReportMetricsDocument>;

	getUsageMetrics(
		reportId: string,
		period?: 'day' | 'week' | 'month' | 'year'
	): Promise<{
		executions: number;
		uniqueUsers: number;
		averageRuntime: number;
		errorRate: number;
		resourceUsage: {
			cpu: number;
			memory: number;
			storage: number;
		};
	}>;

	getPerformanceMetrics(
		startDate: Date,
		endDate: Date
	): Promise<{
		throughput: number;
		latency: {
			avg: number;
			p95: number;
			p99: number;
		};
		errors: {
			count: number;
			byType: Record<string, number>;
		};
		availability: number;
	}>;

	// Utility Functions
	validateDataSource(
		type: DataSourceType,
		config: Record<string, any>
	): Promise<{
		valid: boolean;
		connection: boolean;
		permissions: boolean;
		errors?: string[];
	}>;

	previewReport(
		template: Partial<ReportTemplate>,
		data?: Record<string, any>
	): Promise<{
		preview: any;
		metadata: {
			rows: number;
			columns: number;
			format: string;
		};
	}>;

	exportReport(
		reportId: string,
		format: ReportFormat,
		options?: {
			filters?: Record<string, any>;
			pagination?: {
				page: number;
				size: number;
			};
		}
	): Promise<{
		url: string;
		expiresAt: Date;
		metadata: {
			size: number;
			pages: number;
			format: string;
		};
	}>;

	scheduleReport(
		reportId: string,
		schedule: {
			frequency: ReportFrequency;
			startDate: Date;
			endDate?: Date;
			timezone: string;
			parameters?: Record<string, any>;
		}
	): Promise<{
		scheduled: boolean;
		nextRun: Date;
		error?: string;
	}>;

	generateReportToken(
		reportId: string,
		options?: {
			expiresIn?: number;
			permissions?: string[];
			restrictions?: Record<string, any>;
		}
	): Promise<{
		token: string;
		expiresAt: Date;
		permissions: string[];
	}>;
}
