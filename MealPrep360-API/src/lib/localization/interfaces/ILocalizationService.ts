import { Locale } from '../validation/LocalizationValidator';

export interface ILocalizationService {
	// Locale Management
	createLocale(locale: Omit<Locale, 'id'>): Promise<Locale>;

	getLocale(localeId: string): Promise<Locale>;

	listLocales(filters?: {
		enabled?: boolean;
		region?: string;
	}): Promise<Locale[]>;

	updateLocale(localeId: string, updates: Partial<Locale>): Promise<Locale>;

	deleteLocale(localeId: string): Promise<void>;

	// Translation Management
	getTranslation(params: {
		key: string;
		locale: string;
		context?: string;
	}): Promise<{
		value: string;
		metadata?: Record<string, any>;
	}>;

	getTranslations(params: {
		keys: string[];
		locale: string;
		context?: string;
	}): Promise<Record<string, string>>;

	setTranslation(params: {
		key: string;
		locale: string;
		value: string;
		context?: string;
		metadata?: Record<string, any>;
	}): Promise<void>;

	deleteTranslation(params: {
		key: string;
		locale: string;
		context?: string;
	}): Promise<void>;

	// Import/Export
	importTranslations(params: {
		locale: string;
		format: 'json' | 'yaml' | 'csv';
		data: string;
		overwrite?: boolean;
	}): Promise<{
		imported: number;
		skipped: number;
		errors: Array<{
			key: string;
			error: string;
		}>;
	}>;

	exportTranslations(params: {
		locale: string;
		format: 'json' | 'yaml' | 'csv';
		filter?: {
			keys?: string[];
			context?: string;
			updatedSince?: Date;
		};
	}): Promise<{
		data: string;
		format: string;
		count: number;
	}>;

	// Utilities
	validateLocale(locale: string): Promise<{
		valid: boolean;
		available: boolean;
		fallback?: string;
		errors?: string[];
	}>;

	detectLocale(params: { text: string; confidence?: number }): Promise<{
		locale: string;
		confidence: number;
		alternatives?: Array<{
			locale: string;
			confidence: number;
		}>;
	}>;

	translateText(params: {
		text: string;
		sourceLocale: string;
		targetLocale: string;
		context?: string;
		format?: 'text' | 'html' | 'markdown';
	}): Promise<{
		translation: string;
		metadata?: {
			provider: string;
			confidence: number;
			cost?: number;
		};
	}>;

	// Monitoring & Analytics
	getLocaleStats(locale: string): Promise<{
		translations: {
			total: number;
			missing: number;
			outdated: number;
		};
		usage: {
			requests: number;
			uniqueKeys: number;
			lastAccessed?: Date;
		};
		quality: {
			coverage: number;
			consistency: number;
			issues: Array<{
				type: string;
				count: number;
				examples: string[];
			}>;
		};
	}>;

	getUsageMetrics(params: {
		startDate: Date;
		endDate: Date;
		locale?: string;
	}): Promise<{
		requests: {
			total: number;
			byLocale: Record<string, number>;
			byEndpoint: Record<string, number>;
		};
		performance: {
			avgResponseTime: number;
			cacheHitRate: number;
			errors: number;
		};
		costs?: {
			total: number;
			byService: Record<string, number>;
		};
	}>;
}
