import { RequestValidator } from '../../core/validation/RequestValidator';
import {
	Report,
	ReportTemplate,
	ReportExecution,
	ReportDashboard,
	ReportAlert,
	ReportType,
	ReportFormat,
	ReportFrequency,
	ReportStatus,
	DataSourceType,
} from '../types';

export class ReportValidator extends RequestValidator<Omit<Report, 'id'>> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) => !!data.userId,
			message: 'User ID is required',
		});

		this.addRule({
			validate: (data) =>
				typeof data.name === 'string' && data.name.length >= 3,
			message: 'Name must be at least 3 characters long',
		});

		this.addRule({
			validate: (data) =>
				typeof data.description === 'string' && data.description.length >= 10,
			message: 'Description must be at least 10 characters long',
		});

		this.addRule({
			validate: (data) =>
				[
					'user_activity',
					'recipe_analytics',
					'meal_plan_insights',
					'shopping_trends',
					'nutrition_analysis',
					'cost_analysis',
					'engagement_metrics',
					'system_health',
				].includes(data.type),
			message: 'Invalid report type',
		});

		this.addRule({
			validate: (data) =>
				['json', 'csv', 'pdf', 'excel', 'html', 'dashboard'].includes(
					data.format
				),
			message: 'Invalid report format',
		});

		this.addRule({
			validate: (data) =>
				!data.schedule ||
				(typeof data.schedule === 'object' &&
					[
						'realtime',
						'hourly',
						'daily',
						'weekly',
						'monthly',
						'quarterly',
						'yearly',
						'once',
					].includes(data.schedule.frequency) &&
					data.schedule.startDate instanceof Date &&
					(!data.schedule.endDate || data.schedule.endDate instanceof Date) &&
					typeof data.schedule.timezone === 'string'),
			message: 'Invalid schedule configuration',
		});

		this.addRule({
			validate: (data) =>
				typeof data.parameters === 'object' &&
				(!data.parameters.dateRange ||
					(data.parameters.dateRange.start instanceof Date &&
						data.parameters.dateRange.end instanceof Date)),
			message: 'Invalid parameters configuration',
		});

		this.addRule({
			validate: (data) =>
				['scheduled', 'running', 'completed', 'failed', 'cancelled'].includes(
					data.status
				),
			message: 'Invalid report status',
		});
	}
}

export class ReportDefinitionValidator extends RequestValidator<{
	name: string;
	description: string;
	type: ReportType;
	format: ReportFormat;
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
}> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) =>
				typeof data.name === 'string' && data.name.length >= 3,
			message: 'Name must be at least 3 characters long',
		});

		this.addRule({
			validate: (data) =>
				typeof data.description === 'string' && data.description.length >= 10,
			message: 'Description must be at least 10 characters long',
		});

		this.addRule({
			validate: (data) =>
				[
					'user_activity',
					'recipe_analytics',
					'meal_plan_insights',
					'shopping_trends',
					'nutrition_analysis',
					'cost_analysis',
					'engagement_metrics',
					'system_health',
				].includes(data.type),
			message: 'Invalid report type',
		});

		this.addRule({
			validate: (data) =>
				['json', 'csv', 'pdf', 'excel', 'html', 'dashboard'].includes(
					data.format
				),
			message: 'Invalid report format',
		});

		this.addRule({
			validate: (data) =>
				Array.isArray(data.dataSources) &&
				data.dataSources.length > 0 &&
				data.dataSources.every(
					(ds) =>
						[
							'database',
							'api',
							'file',
							'stream',
							'cache',
							'warehouse',
						].includes(ds.type) &&
						typeof ds.config === 'object' &&
						ds.config !== null &&
						(!ds.transforms ||
							(Array.isArray(ds.transforms) &&
								ds.transforms.every(
									(t) =>
										typeof t.type === 'string' &&
										typeof t.params === 'object' &&
										t.params !== null
								)))
				),
			message: 'Invalid data sources configuration',
		});

		this.addRule({
			validate: (data) =>
				!data.layout ||
				(typeof data.layout === 'object' &&
					Array.isArray(data.layout.sections) &&
					data.layout.sections.every(
						(s) =>
							typeof s.id === 'string' &&
							typeof s.type === 'string' &&
							typeof s.content === 'object' &&
							s.content !== null
					) &&
					(!data.layout.styling ||
						(typeof data.layout.styling === 'object' &&
							data.layout.styling !== null))),
			message: 'Invalid layout configuration',
		});

		this.addRule({
			validate: (data) =>
				Array.isArray(data.parameters) &&
				data.parameters.every(
					(p) =>
						typeof p.name === 'string' &&
						typeof p.type === 'string' &&
						typeof p.required === 'boolean' &&
						(!p.validation ||
							(typeof p.validation === 'object' &&
								Array.isArray(p.validation.rules) &&
								p.validation.rules.every(
									(r) => typeof r.type === 'string' && r.value !== undefined
								)))
				),
			message: 'Invalid parameters configuration',
		});
	}
}
