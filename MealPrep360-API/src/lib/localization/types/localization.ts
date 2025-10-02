import { Document } from 'mongoose';
import {
	LocaleConfig,
	TranslationKey,
	Translation,
	TranslationBatch,
	TranslationMemory,
	LocalizationMetrics,
	TranslationProvider,
	LocaleCode,
	ContentType,
	TranslationStatus,
} from './index';

// Base document types
export type LocaleConfigDoc = Document & Omit<LocaleConfig, 'code'>;
export type TranslationKeyDoc = Document & Omit<TranslationKey, 'id'>;
export type TranslationDoc = Document & Omit<Translation, 'id'>;
export type TranslationBatchDoc = Document & Omit<TranslationBatch, 'id'>;
export type TranslationMemoryDoc = Document & Omit<TranslationMemory, 'id'>;
export type LocalizationMetricsDoc = Document & Omit<LocalizationMetrics, 'id'>;
export type TranslationProviderDoc = Document & Omit<TranslationProvider, 'id'>;

// Document interfaces extend the base types
export interface ILocaleConfigDocument extends LocaleConfigDoc {
	validation: {
		dateFormats: string[];
		timeFormats: string[];
		numberFormats: {
			decimals: string[];
			thousands: string[];
			currencyFormats: string[];
		};
	};
	customization: {
		dateTimePresets?: Record<string, string>;
		numberPresets?: Record<string, any>;
		pluralRules?: string;
	};
	resources: {
		fonts?: string[];
		icons?: string[];
		images?: string[];
	};
}

export interface ITranslationKeyDocument extends TranslationKeyDoc {
	usage: {
		count: number;
		lastUsed?: Date;
		contexts: string[];
	};
	validation: {
		constraints?: Record<string, any>;
		regex?: string;
		dependencies?: string[];
	};
	history: Array<{
		action: string;
		timestamp: Date;
		user: string;
		changes?: Record<string, any>;
	}>;
}

export interface ITranslationDocument extends TranslationDoc {
	history: Array<{
		value: string;
		pluralForms?: Record<string, string>;
		status: TranslationStatus;
		timestamp: Date;
		user: string;
		notes?: string;
	}>;
	validation: {
		issues?: Array<{
			type: string;
			severity: 'error' | 'warning' | 'info';
			message: string;
			position?: number;
		}>;
		lastChecked?: Date;
		score?: number;
	};
	usage: {
		count: number;
		lastUsed?: Date;
		contexts: string[];
	};
}

export interface ITranslationBatchDocument extends TranslationBatchDoc {
	progress: {
		total: number;
		completed: number;
		approved: number;
		rejected: number;
	};
	assignments: Array<{
		locale: LocaleCode;
		translator?: string;
		reviewer?: string;
		dueDate?: Date;
		status: TranslationStatus;
	}>;
	history: Array<{
		action: string;
		timestamp: Date;
		user: string;
		details?: any;
	}>;
	notifications: {
		onCompletion?: boolean;
		onReview?: boolean;
		recipients?: string[];
	};
}

export interface ITranslationMemoryDocument extends TranslationMemoryDoc {
	stats: {
		totalEntries: number;
		uniqueSources: number;
		averageQuality: number;
		lastUpdated: Date;
	};
	maintenance: {
		lastCleaned?: Date;
		lastOptimized?: Date;
		duplicates?: number;
	};
	access: {
		readers: string[];
		writers: string[];
		lastAccessed?: Date;
	};
}

export interface ILocalizationMetricsDocument extends LocalizationMetricsDoc {
	trends: {
		daily: Array<{
			date: Date;
			translations: number;
			quality: number;
		}>;
		weekly: Array<{
			week: string;
			translations: number;
			quality: number;
		}>;
	};
	insights: Array<{
		type: string;
		severity: 'info' | 'warning' | 'critical';
		message: string;
		data?: any;
	}>;
	workload: {
		pending: number;
		inProgress: number;
		backlog: Array<{
			type: ContentType;
			count: number;
			priority: number;
		}>;
	};
}

export interface ITranslationProviderDocument extends TranslationProviderDoc {
	status: {
		available: boolean;
		lastCheck: Date;
		issues?: Array<{
			type: string;
			message: string;
			timestamp: Date;
		}>;
	};
	usage: {
		totalRequests: number;
		totalWords: number;
		costs: {
			current: number;
			projected: number;
			currency: string;
		};
	};
	performance: {
		responseTime: number;
		errorRate: number;
		availability: number;
	};
}
