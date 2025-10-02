import { BaseExternalService } from '../../core/services/BaseExternalService';
import { IReportingService } from '../interfaces/IReportingService';
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

export class ExternalReportingService
	extends BaseExternalService
	implements IReportingService
{
	constructor() {
		super('reporting');
	}

	// Report Management
	async createReport(report: Omit<Report, 'id'>): Promise<IReportDocument> {
		return await this.resilientClient.post<IReportDocument>('/reports', report);
	}

	async getReport(reportId: string): Promise<IReportDocument> {
		return await this.resilientClient.get<IReportDocument>(
			`/reports/${reportId}`
		);
	}

	async listReports(filters?: {
		userId?: string;
		type?: ReportType;
		status?: ReportStatus;
		startDate?: Date;
		endDate?: Date;
	}): Promise<IReportDocument[]> {
		return await this.resilientClient.get<IReportDocument[]>('/reports', {
			params: {
				...filters,
				startDate: filters?.startDate?.toISOString(),
				endDate: filters?.endDate?.toISOString(),
			},
		});
	}

	async updateReport(
		reportId: string,
		updates: Partial<Report>
	): Promise<IReportDocument> {
		return await this.resilientClient.put<IReportDocument>(
			`/reports/${reportId}`,
			updates
		);
	}

	async deleteReport(reportId: string): Promise<void> {
		await this.resilientClient.delete(`/reports/${reportId}`);
	}

	async executeReport(
		reportId: string,
		parameters?: Record<string, any>
	): Promise<IReportExecutionDocument> {
		return await this.resilientClient.post<IReportExecutionDocument>(
			`/reports/${reportId}/execute`,
			{ parameters }
		);
	}

	// Template Management
	async createTemplate(
		template: Omit<ReportTemplate, 'id'>
	): Promise<IReportTemplateDocument> {
		return await this.resilientClient.post<IReportTemplateDocument>(
			'/templates',
			template
		);
	}

	async getTemplate(templateId: string): Promise<IReportTemplateDocument> {
		return await this.resilientClient.get<IReportTemplateDocument>(
			`/templates/${templateId}`
		);
	}

	async listTemplates(filters?: {
		type?: ReportType;
		format?: ReportFormat;
	}): Promise<IReportTemplateDocument[]> {
		return await this.resilientClient.get<IReportTemplateDocument[]>(
			'/templates',
			{
				params: filters,
			}
		);
	}

	async updateTemplate(
		templateId: string,
		updates: Partial<ReportTemplate>
	): Promise<IReportTemplateDocument> {
		return await this.resilientClient.put<IReportTemplateDocument>(
			`/templates/${templateId}`,
			updates
		);
	}

	async deleteTemplate(templateId: string): Promise<void> {
		await this.resilientClient.delete(`/templates/${templateId}`);
	}

	async validateTemplate(template: Partial<ReportTemplate>): Promise<{
		valid: boolean;
		errors?: string[];
	}> {
		return await this.resilientClient.post<{
			valid: boolean;
			errors?: string[];
		}>('/templates/validate', template);
	}

	// Execution Management
	async getExecution(executionId: string): Promise<IReportExecutionDocument> {
		return await this.resilientClient.get<IReportExecutionDocument>(
			`/executions/${executionId}`
		);
	}

	async listExecutions(filters?: {
		reportId?: string;
		status?: ReportStatus;
		startDate?: Date;
		endDate?: Date;
	}): Promise<IReportExecutionDocument[]> {
		return await this.resilientClient.get<IReportExecutionDocument[]>(
			'/executions',
			{
				params: {
					...filters,
					startDate: filters?.startDate?.toISOString(),
					endDate: filters?.endDate?.toISOString(),
				},
			}
		);
	}

	async cancelExecution(executionId: string): Promise<void> {
		await this.resilientClient.post(`/executions/${executionId}/cancel`);
	}

	async retryExecution(executionId: string): Promise<IReportExecutionDocument> {
		return await this.resilientClient.post<IReportExecutionDocument>(
			`/executions/${executionId}/retry`
		);
	}

	async getExecutionStatus(executionId: string): Promise<{
		status: ReportStatus;
		progress: number;
		error?: string;
	}> {
		return await this.resilientClient.get<{
			status: ReportStatus;
			progress: number;
			error?: string;
		}>(`/executions/${executionId}/status`);
	}

	// Dashboard Management
	async createDashboard(
		dashboard: Omit<ReportDashboard, 'id'>
	): Promise<IReportDashboardDocument> {
		return await this.resilientClient.post<IReportDashboardDocument>(
			'/dashboards',
			dashboard
		);
	}

	async getDashboard(dashboardId: string): Promise<IReportDashboardDocument> {
		return await this.resilientClient.get<IReportDashboardDocument>(
			`/dashboards/${dashboardId}`
		);
	}

	async listDashboards(filters?: {
		userId?: string;
		shared?: boolean;
	}): Promise<IReportDashboardDocument[]> {
		return await this.resilientClient.get<IReportDashboardDocument[]>(
			'/dashboards',
			{
				params: filters,
			}
		);
	}

	async updateDashboard(
		dashboardId: string,
		updates: Partial<ReportDashboard>
	): Promise<IReportDashboardDocument> {
		return await this.resilientClient.put<IReportDashboardDocument>(
			`/dashboards/${dashboardId}`,
			updates
		);
	}

	async deleteDashboard(dashboardId: string): Promise<void> {
		await this.resilientClient.delete(`/dashboards/${dashboardId}`);
	}

	async refreshDashboard(
		dashboardId: string,
		widgets?: string[]
	): Promise<IReportDashboardDocument> {
		return await this.resilientClient.post<IReportDashboardDocument>(
			`/dashboards/${dashboardId}/refresh`,
			{ widgets }
		);
	}

	// Alert Management
	async createAlert(
		alert: Omit<ReportAlert, 'id'>
	): Promise<IReportAlertDocument> {
		return await this.resilientClient.post<IReportAlertDocument>(
			'/alerts',
			alert
		);
	}

	async getAlert(alertId: string): Promise<IReportAlertDocument> {
		return await this.resilientClient.get<IReportAlertDocument>(
			`/alerts/${alertId}`
		);
	}

	async listAlerts(filters?: {
		reportId?: string;
		status?: string;
	}): Promise<IReportAlertDocument[]> {
		return await this.resilientClient.get<IReportAlertDocument[]>('/alerts', {
			params: filters,
		});
	}

	async updateAlert(
		alertId: string,
		updates: Partial<ReportAlert>
	): Promise<IReportAlertDocument> {
		return await this.resilientClient.put<IReportAlertDocument>(
			`/alerts/${alertId}`,
			updates
		);
	}

	async deleteAlert(alertId: string): Promise<void> {
		await this.resilientClient.delete(`/alerts/${alertId}`);
	}

	async testAlert(
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
	}> {
		return await this.resilientClient.post<{
			triggered: boolean;
			evaluations: Array<{
				condition: string;
				result: boolean;
				actual: number;
				expected: number;
			}>;
		}>(`/alerts/${alertId}/test`, { testData });
	}

	// Metrics & Analytics
	async getMetrics(
		startDate: Date,
		endDate: Date,
		filters?: {
			type?: ReportType;
			format?: ReportFormat;
		}
	): Promise<IReportMetricsDocument> {
		return await this.resilientClient.get<IReportMetricsDocument>('/metrics', {
			params: {
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
				...filters,
			},
		});
	}

	async getUsageMetrics(
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
	}> {
		return await this.resilientClient.get<{
			executions: number;
			uniqueUsers: number;
			averageRuntime: number;
			errorRate: number;
			resourceUsage: {
				cpu: number;
				memory: number;
				storage: number;
			};
		}>(`/metrics/usage/${reportId}`, {
			params: { period },
		});
	}

	async getPerformanceMetrics(
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
	}> {
		return await this.resilientClient.get<{
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
		}>('/metrics/performance', {
			params: {
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
			},
		});
	}

	// Utility Functions
	async validateDataSource(
		type: DataSourceType,
		config: Record<string, any>
	): Promise<{
		valid: boolean;
		connection: boolean;
		permissions: boolean;
		errors?: string[];
	}> {
		return await this.resilientClient.post<{
			valid: boolean;
			connection: boolean;
			permissions: boolean;
			errors?: string[];
		}>('/datasources/validate', {
			type,
			config,
		});
	}

	async previewReport(
		template: Partial<ReportTemplate>,
		data?: Record<string, any>
	): Promise<{
		preview: any;
		metadata: {
			rows: number;
			columns: number;
			format: string;
		};
	}> {
		return await this.resilientClient.post<{
			preview: any;
			metadata: {
				rows: number;
				columns: number;
				format: string;
			};
		}>('/reports/preview', {
			template,
			data,
		});
	}

	async exportReport(
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
	}> {
		return await this.resilientClient.post<{
			url: string;
			expiresAt: Date;
			metadata: {
				size: number;
				pages: number;
				format: string;
			};
		}>(`/reports/${reportId}/export`, {
			format,
			...options,
		});
	}

	async scheduleReport(
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
	}> {
		return await this.resilientClient.post<{
			scheduled: boolean;
			nextRun: Date;
			error?: string;
		}>(`/reports/${reportId}/schedule`, schedule);
	}

	async generateReportToken(
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
	}> {
		return await this.resilientClient.post<{
			token: string;
			expiresAt: Date;
			permissions: string[];
		}>(`/reports/${reportId}/token`, options);
	}
}
