export type LocaleCode = string; // e.g., 'en-US', 'es-ES', 'fr-FR'

export type ContentType =
	| 'recipe'
	| 'ingredient'
	| 'category'
	| 'unit'
	| 'dietary_restriction'
	| 'cooking_method'
	| 'ui_element'
	| 'error_message'
	| 'email_template'
	| 'help_article';

export type TranslationStatus =
	| 'pending'
	| 'in_progress'
	| 'review_needed'
	| 'approved'
	| 'published'
	| 'outdated';

export interface LocaleConfig {
	code: LocaleCode;
	name: string;
	nativeName: string;
	direction: 'ltr' | 'rtl';
	region?: string;
	fallback?: LocaleCode;
	dateFormat: string;
	timeFormat: string;
	numberFormat: {
		decimal: string;
		thousand: string;
		precision: number;
		currency: {
			code: string;
			symbol: string;
			position: 'before' | 'after';
		};
	};
	metadata?: {
		enabled: boolean;
		default?: boolean;
		priority?: number;
		supportLevel: 'full' | 'partial' | 'basic';
		[key: string]: any;
	};
}

export interface TranslationKey {
	id: string;
	type: ContentType;
	context?: string;
	namespace?: string;
	pluralizable?: boolean;
	variables?: Array<{
		name: string;
		type: string;
		description?: string;
		example?: string;
	}>;
	metadata?: {
		maxLength?: number;
		tags?: string[];
		notes?: string;
		[key: string]: any;
	};
}

export interface Translation {
	id: string;
	keyId: string;
	locale: LocaleCode;
	value: string;
	pluralForms?: Record<string, string>;
	status: TranslationStatus;
	metadata?: {
		translator?: string;
		reviewer?: string;
		lastModified?: Date;
		version?: number;
		notes?: string;
		[key: string]: any;
	};
}

export interface TranslationBatch {
	id: string;
	name: string;
	description?: string;
	sourceLocale: LocaleCode;
	targetLocales: LocaleCode[];
	keys: string[];
	status: TranslationStatus;
	dueDate?: Date;
	priority?: 'low' | 'medium' | 'high';
	metadata?: {
		requestedBy: string;
		project?: string;
		context?: string;
		[key: string]: any;
	};
}

export interface TranslationMemory {
	id: string;
	sourceLocale: LocaleCode;
	targetLocale: LocaleCode;
	entries: Array<{
		source: string;
		target: string;
		context?: string;
		lastUsed: Date;
		useCount: number;
		quality?: number;
	}>;
	metadata?: {
		provider?: string;
		lastUpdated?: Date;
		entryCount?: number;
		[key: string]: any;
	};
}

export interface LocalizationMetrics {
	period: {
		start: Date;
		end: Date;
	};
	coverage: {
		overall: number;
		byLocale: Record<LocaleCode, number>;
		byType: Record<ContentType, number>;
	};
	translations: {
		total: number;
		pending: number;
		approved: number;
		outdated: number;
		byLocale: Record<LocaleCode, number>;
		byType: Record<ContentType, number>;
	};
	quality: {
		overall: number;
		byLocale: Record<
			LocaleCode,
			{
				score: number;
				issues: number;
				reviewed: number;
			}
		>;
		commonIssues: Array<{
			type: string;
			count: number;
			examples: string[];
		}>;
	};
	performance: {
		averageTranslationTime: number;
		averageReviewTime: number;
		throughput: number;
		byTranslator: Array<{
			userId: string;
			completed: number;
			quality: number;
			speed: number;
		}>;
	};
	usage: {
		activeUsers: number;
		requestsByLocale: Record<LocaleCode, number>;
		popularKeys: Array<{
			keyId: string;
			type: ContentType;
			requests: number;
		}>;
		missingTranslations: Array<{
			keyId: string;
			locale: LocaleCode;
			requests: number;
		}>;
	};
}

export interface TranslationProvider {
	id: string;
	name: string;
	type: 'machine' | 'human' | 'hybrid';
	supportedLocales: LocaleCode[];
	capabilities: Array<
		'translation' | 'review' | 'glossary' | 'memory' | 'batch' | 'quality_check'
	>;
	config: {
		apiKey?: string;
		endpoint?: string;
		options?: Record<string, any>;
	};
	pricing?: {
		currency: string;
		ratePerWord: number;
		minimumCharge?: number;
		rushFee?: number;
	};
	quality?: {
		accuracy: number;
		consistency: number;
		speed: number;
	};
	metadata?: {
		active: boolean;
		priority?: number;
		notes?: string;
		[key: string]: any;
	};
}
