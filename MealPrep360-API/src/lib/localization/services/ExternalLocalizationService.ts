import { BaseExternalService } from '../../core/services/BaseExternalService';
import { ILocalizationService } from '../interfaces/ILocalizationService';
import { Locale } from '../validation/LocalizationValidator';
import {
	LocaleConfig,
	TranslationKey,
	Translation,
	TranslationBatch,
	TranslationMemory,
	TranslationProvider,
	LocaleCode,
	ContentType,
	TranslationStatus,
} from '../types';
import {
	ILocaleConfigDocument,
	ITranslationKeyDocument,
	ITranslationDocument,
	ITranslationBatchDocument,
	ITranslationMemoryDocument,
	ILocalizationMetricsDocument,
	ITranslationProviderDocument,
} from '../types/localization';

export class ExternalLocalizationService
	extends BaseExternalService
	implements ILocalizationService
{
	constructor() {
		super('localization');
	}

	// Locale Configuration
	async createLocale(locale: Omit<Locale, 'id'>): Promise<Locale> {
		const response = await this.resilientClient.post<Locale>(
			'/locales',
			locale
		);
		return response;
	}

	async updateLocale(
		localeId: string,
		updates: Partial<Locale>
	): Promise<Locale> {
		const response = await this.resilientClient.put<Locale>(
			`/locales/${localeId}`,
			updates
		);
		return response;
	}

	async getLocale(localeId: string): Promise<Locale> {
		const response = await this.resilientClient.get<Locale>(
			`/locales/${localeId}`
		);
		return response;
	}

	async listLocales(filters?: {
		enabled?: boolean;
		region?: string;
	}): Promise<Locale[]> {
		const response = await this.resilientClient.get<Locale[]>('/locales', {
			params: filters,
		});
		return response;
	}

	async deleteLocale(code: LocaleCode): Promise<void> {
		await this.resilientClient.delete(`/locales/${code}`);
	}

	// Translation Keys
	async createTranslationKey(
		key: Omit<TranslationKey, 'id'>
	): Promise<ITranslationKeyDocument> {
		const response = await this.resilientClient.post<ITranslationKeyDocument>(
			'/keys',
			key
		);
		return response;
	}

	async updateTranslationKey(
		keyId: string,
		updates: Partial<TranslationKey>
	): Promise<ITranslationKeyDocument> {
		const response = await this.resilientClient.put<ITranslationKeyDocument>(
			`/keys/${keyId}`,
			updates
		);
		return response;
	}

	async getTranslationKey(keyId: string): Promise<ITranslationKeyDocument> {
		const response = await this.resilientClient.get<ITranslationKeyDocument>(
			`/keys/${keyId}`
		);
		return response;
	}

	async listTranslationKeys(filters?: {
		type?: ContentType;
		namespace?: string;
		search?: string;
	}): Promise<ITranslationKeyDocument[]> {
		const response = await this.resilientClient.get<ITranslationKeyDocument[]>(
			'/keys',
			{
				params: filters,
			}
		);
		return response;
	}

	async deleteTranslationKey(keyId: string): Promise<void> {
		await this.resilientClient.delete(`/keys/${keyId}`);
	}

	// Translations
	async createTranslation(
		translation: Omit<Translation, 'id'>
	): Promise<ITranslationDocument> {
		const response = await this.resilientClient.post<ITranslationDocument>(
			'/translations',
			translation
		);
		return response;
	}

	async updateTranslation(
		translationId: string,
		updates: Partial<Translation>
	): Promise<ITranslationDocument> {
		const response = await this.resilientClient.put<ITranslationDocument>(
			`/translations/${translationId}`,
			updates
		);
		return response;
	}

	async getTranslation(params: {
		key: string;
		locale: string;
		context?: string;
	}): Promise<{
		value: string;
		metadata?: Record<string, any>;
	}> {
		const response = await this.resilientClient.get<{
			value: string;
			metadata?: Record<string, any>;
		}>(`/translations/${params.locale}/${params.key}`, {
			params: { context: params.context },
		});
		return response;
	}

	async listTranslations(filters?: {
		keyId?: string;
		locale?: LocaleCode;
		status?: TranslationStatus;
	}): Promise<ITranslationDocument[]> {
		const response = await this.resilientClient.get<ITranslationDocument[]>(
			'/translations',
			{
				params: filters,
			}
		);
		return response;
	}

	async deleteTranslation(params: {
		key: string;
		locale: string;
		context?: string;
	}): Promise<void> {
		await this.resilientClient.delete(
			`/translations/${params.locale}/${params.key}`,
			{
				params: { context: params.context },
			}
		);
	}

	// Translation Batches
	async createBatch(
		batch: Omit<TranslationBatch, 'id'>
	): Promise<ITranslationBatchDocument> {
		const response = await this.resilientClient.post<ITranslationBatchDocument>(
			'/batches',
			batch
		);
		return response;
	}

	async updateBatch(
		batchId: string,
		updates: Partial<TranslationBatch>
	): Promise<ITranslationBatchDocument> {
		const response = await this.resilientClient.put<ITranslationBatchDocument>(
			`/batches/${batchId}`,
			updates
		);
		return response;
	}

	async getBatch(batchId: string): Promise<ITranslationBatchDocument> {
		const response = await this.resilientClient.get<ITranslationBatchDocument>(
			`/batches/${batchId}`
		);
		return response;
	}

	async listBatches(filters?: {
		status?: TranslationStatus;
		sourceLocale?: LocaleCode;
		targetLocale?: LocaleCode;
	}): Promise<ITranslationBatchDocument[]> {
		const response = await this.resilientClient.get<
			ITranslationBatchDocument[]
		>('/batches', {
			params: filters,
		});
		return response;
	}

	async deleteBatch(batchId: string): Promise<void> {
		await this.resilientClient.delete(`/batches/${batchId}`);
	}

	// Translation Memory
	async createMemory(
		memory: Omit<TranslationMemory, 'id'>
	): Promise<ITranslationMemoryDocument> {
		const response =
			await this.resilientClient.post<ITranslationMemoryDocument>(
				'/memories',
				memory
			);
		return response;
	}

	async updateMemory(
		memoryId: string,
		updates: Partial<TranslationMemory>
	): Promise<ITranslationMemoryDocument> {
		const response = await this.resilientClient.put<ITranslationMemoryDocument>(
			`/memories/${memoryId}`,
			updates
		);
		return response;
	}

	async getMemory(memoryId: string): Promise<ITranslationMemoryDocument> {
		const response = await this.resilientClient.get<ITranslationMemoryDocument>(
			`/memories/${memoryId}`
		);
		return response;
	}

	async listMemories(filters?: {
		sourceLocale?: LocaleCode;
		targetLocale?: LocaleCode;
	}): Promise<ITranslationMemoryDocument[]> {
		const response = await this.resilientClient.get<
			ITranslationMemoryDocument[]
		>('/memories', {
			params: filters,
		});
		return response;
	}

	async deleteMemory(memoryId: string): Promise<void> {
		await this.resilientClient.delete(`/memories/${memoryId}`);
	}

	// Translation Providers
	async registerProvider(
		provider: Omit<TranslationProvider, 'id'>
	): Promise<ITranslationProviderDocument> {
		const response =
			await this.resilientClient.post<ITranslationProviderDocument>(
				'/providers',
				provider
			);
		return response;
	}

	async updateProvider(
		providerId: string,
		updates: Partial<TranslationProvider>
	): Promise<ITranslationProviderDocument> {
		const response =
			await this.resilientClient.put<ITranslationProviderDocument>(
				`/providers/${providerId}`,
				updates
			);
		return response;
	}

	async getProvider(providerId: string): Promise<ITranslationProviderDocument> {
		const response =
			await this.resilientClient.get<ITranslationProviderDocument>(
				`/providers/${providerId}`
			);
		return response;
	}

	async listProviders(filters?: {
		type?: string;
		locale?: LocaleCode;
		capability?: string;
	}): Promise<ITranslationProviderDocument[]> {
		const response = await this.resilientClient.get<
			ITranslationProviderDocument[]
		>('/providers', {
			params: filters,
		});
		return response;
	}

	async deleteProvider(providerId: string): Promise<void> {
		await this.resilientClient.delete(`/providers/${providerId}`);
	}

	// Translation Operations
	async translateText(params: {
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
	}> {
		const response = await this.resilientClient.post<{
			translation: string;
			metadata?: {
				provider: string;
				confidence: number;
				cost?: number;
			};
		}>('/translate', params);
		return response;
	}

	async translateBatch(
		texts: string[],
		sourceLocale: LocaleCode,
		targetLocale: LocaleCode,
		options?: {
			provider?: string;
			context?: string;
			useMemory?: boolean;
		}
	): Promise<
		Array<{
			original: string;
			translation: string;
			provider: string;
			confidence?: number;
		}>
	> {
		const response = await this.resilientClient.post<
			Array<{
				original: string;
				translation: string;
				provider: string;
				confidence?: number;
			}>
		>('/translate/batch', {
			texts,
			sourceLocale,
			targetLocale,
			options,
		});
		return response;
	}

	// Quality Management
	async validateTranslation(
		translationId: string,
		options?: {
			rules?: string[];
			strict?: boolean;
		}
	): Promise<{
		valid: boolean;
		score: number;
		issues: Array<{
			rule: string;
			severity: string;
			message: string;
		}>;
	}> {
		const response = await this.resilientClient.post<{
			valid: boolean;
			score: number;
			issues: Array<{
				rule: string;
				severity: string;
				message: string;
			}>;
		}>(`/translations/${translationId}/validate`, options);
		return response;
	}

	async reviewTranslation(
		translationId: string,
		review: {
			approved: boolean;
			feedback?: string;
			changes?: Record<string, string>;
		}
	): Promise<ITranslationDocument> {
		const response = await this.resilientClient.post<ITranslationDocument>(
			`/translations/${translationId}/review`,
			review
		);
		return response;
	}

	// Memory Operations
	async findInMemory(
		text: string,
		sourceLocale: LocaleCode,
		targetLocale: LocaleCode,
		options?: {
			minSimilarity?: number;
			maxResults?: number;
		}
	): Promise<
		Array<{
			source: string;
			target: string;
			similarity: number;
			context?: string;
		}>
	> {
		const response = await this.resilientClient.get<
			Array<{
				source: string;
				target: string;
				similarity: number;
				context?: string;
			}>
		>('/memories/search', {
			params: {
				text,
				sourceLocale,
				targetLocale,
				...options,
			},
		});
		return response;
	}

	async updateMemoryEntry(
		memoryId: string,
		entry: {
			source: string;
			target: string;
			context?: string;
		}
	): Promise<ITranslationMemoryDocument> {
		const response =
			await this.resilientClient.post<ITranslationMemoryDocument>(
				`/memories/${memoryId}/entries`,
				entry
			);
		return response;
	}

	// Metrics & Analytics
	async getLocalizationMetrics(
		startDate: Date,
		endDate: Date,
		filters?: {
			locale?: LocaleCode;
			type?: ContentType;
		}
	): Promise<ILocalizationMetricsDocument> {
		const response =
			await this.resilientClient.get<ILocalizationMetricsDocument>('/metrics', {
				params: {
					startDate: startDate.toISOString(),
					endDate: endDate.toISOString(),
					...filters,
				},
			});
		return response;
	}

	async getProviderMetrics(
		providerId: string,
		startDate: Date,
		endDate: Date
	): Promise<{
		usage: {
			requests: number;
			words: number;
			costs: number;
		};
		performance: {
			accuracy: number;
			speed: number;
			availability: number;
		};
		quality: {
			score: number;
			issues: number;
			improvements: number;
		};
	}> {
		const response = await this.resilientClient.get<{
			usage: {
				requests: number;
				words: number;
				costs: number;
			};
			performance: {
				accuracy: number;
				speed: number;
				availability: number;
			};
			quality: {
				score: number;
				issues: number;
				improvements: number;
			};
		}>(`/providers/${providerId}/metrics`, {
			params: {
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
			},
		});
		return response;
	}

	// Error Handling
	async handleLocalizationError(
		error: Error,
		context: {
			operation: string;
			locale?: LocaleCode;
			keyId?: string;
			data?: any;
		}
	): Promise<{
		handled: boolean;
		action?: 'retry' | 'fail' | 'ignore';
		fallback?: {
			type: string;
			value: any;
		};
	}> {
		const response = await this.resilientClient.post<{
			handled: boolean;
			action?: 'retry' | 'fail' | 'ignore';
			fallback?: {
				type: string;
				value: any;
			};
		}>('/errors', {
			error: {
				message: error.message,
				stack: error.stack,
			},
			context,
		});
		return response;
	}

	// Required interface methods
	async getTranslations(params: {
		keys: string[];
		locale: string;
		context?: string;
	}): Promise<Record<string, string>> {
		const response = await this.resilientClient.get<Record<string, string>>(
			'/translations/batch',
			{
				params,
			}
		);
		return response;
	}

	async setTranslation(params: {
		key: string;
		locale: string;
		value: string;
		context?: string;
		metadata?: Record<string, any>;
	}): Promise<void> {
		await this.resilientClient.put('/translations', params);
	}

	async importTranslations(params: {
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
	}> {
		const response = await this.resilientClient.post<{
			imported: number;
			skipped: number;
			errors: Array<{
				key: string;
				error: string;
			}>;
		}>('/translations/import', params);
		return response;
	}

	async exportTranslations(params: {
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
	}> {
		const response = await this.resilientClient.get<{
			data: string;
			format: string;
			count: number;
		}>('/translations/export', {
			params: {
				...params,
				updatedSince: params.filter?.updatedSince?.toISOString(),
			},
		});
		return response;
	}

	async validateLocale(locale: string): Promise<{
		valid: boolean;
		available: boolean;
		fallback?: string;
		errors?: string[];
	}> {
		const response = await this.resilientClient.get<{
			valid: boolean;
			available: boolean;
			fallback?: string;
			errors?: string[];
		}>(`/locales/${locale}/validate`);
		return response;
	}

	async detectLocale(params: { text: string; confidence?: number }): Promise<{
		locale: string;
		confidence: number;
		alternatives?: Array<{
			locale: string;
			confidence: number;
		}>;
	}> {
		const response = await this.resilientClient.post<{
			locale: string;
			confidence: number;
			alternatives?: Array<{
				locale: string;
				confidence: number;
			}>;
		}>('/locales/detect', params);
		return response;
	}

	async getLocaleStats(locale: string): Promise<{
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
	}> {
		const response = await this.resilientClient.get<{
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
		}>(`/locales/${locale}/stats`);
		return response;
	}

	async getUsageMetrics(params: {
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
	}> {
		const response = await this.resilientClient.get<{
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
		}>('/metrics/usage', {
			params: {
				...params,
				startDate: params.startDate.toISOString(),
				endDate: params.endDate.toISOString(),
			},
		});
		return response;
	}
}
