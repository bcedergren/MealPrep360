import { BaseExternalService } from '../../core/services/BaseExternalService';
import { ISearchService } from '../interfaces/ISearchService';
import {
	SearchQuery,
	SearchResult,
	SearchSuggestion,
	SearchIndex,
	SearchDocument,
	SearchAnalytics,
	SearchSynonym,
	SearchFacet,
	SearchCache,
	SearchEntityType,
} from '../types';
import {
	ISearchQueryDocument,
	ISearchIndexDocument,
	ISearchDocumentDocument,
	ISearchAnalyticsDocument,
	ISearchSynonymDocument,
	ISearchFacetDocument,
	ISearchCacheDocument,
} from '../types/search';

export class ExternalSearchService
	extends BaseExternalService
	implements ISearchService
{
	constructor() {
		super('search');
	}

	// Search Operations
	async search<T = any>(
		query: SearchQuery
	): Promise<{
		results: SearchResult<T>[];
		total: number;
		facets?: SearchFacet[];
		suggestions?: SearchSuggestion[];
		metadata: {
			latency: number;
			cached: boolean;
		};
	}> {
		return await this.resilientClient.post<{
			results: SearchResult<T>[];
			total: number;
			facets?: SearchFacet[];
			suggestions?: SearchSuggestion[];
			metadata: {
				latency: number;
				cached: boolean;
			};
		}>('/search', query);
	}

	async suggest(
		query: string,
		options?: {
			entityTypes?: SearchEntityType[];
			limit?: number;
			minScore?: number;
		}
	): Promise<SearchSuggestion[]> {
		return await this.resilientClient.get<SearchSuggestion[]>('/suggest', {
			params: {
				query,
				...options,
			},
		});
	}

	// Index Management
	async createIndex(
		index: Omit<SearchIndex, 'id'>
	): Promise<ISearchIndexDocument> {
		return await this.resilientClient.post<ISearchIndexDocument>(
			'/indices',
			index
		);
	}

	async updateIndex(
		indexId: string,
		updates: Partial<SearchIndex>
	): Promise<ISearchIndexDocument> {
		return await this.resilientClient.put<ISearchIndexDocument>(
			`/indices/${indexId}`,
			updates
		);
	}

	async getIndex(indexId: string): Promise<ISearchIndexDocument> {
		return await this.resilientClient.get<ISearchIndexDocument>(
			`/indices/${indexId}`
		);
	}

	async listIndices(filters?: {
		entityType?: SearchEntityType;
		status?: string;
	}): Promise<ISearchIndexDocument[]> {
		return await this.resilientClient.get<ISearchIndexDocument[]>('/indices', {
			params: filters,
		});
	}

	async deleteIndex(indexId: string): Promise<void> {
		await this.resilientClient.delete(`/indices/${indexId}`);
	}

	// Document Management
	async indexDocument(
		document: Omit<SearchDocument, 'id'>
	): Promise<ISearchDocumentDocument> {
		return await this.resilientClient.post<ISearchDocumentDocument>(
			'/documents',
			document
		);
	}

	async updateDocument(
		documentId: string,
		updates: Partial<SearchDocument>
	): Promise<ISearchDocumentDocument> {
		return await this.resilientClient.put<ISearchDocumentDocument>(
			`/documents/${documentId}`,
			updates
		);
	}

	async getDocument(documentId: string): Promise<ISearchDocumentDocument> {
		return await this.resilientClient.get<ISearchDocumentDocument>(
			`/documents/${documentId}`
		);
	}

	async listDocuments(filters?: {
		entityType?: SearchEntityType;
		status?: string;
		indexId?: string;
	}): Promise<ISearchDocumentDocument[]> {
		return await this.resilientClient.get<ISearchDocumentDocument[]>(
			'/documents',
			{
				params: filters,
			}
		);
	}

	async deleteDocument(documentId: string): Promise<void> {
		await this.resilientClient.delete(`/documents/${documentId}`);
	}

	async bulkIndex(documents: Array<Omit<SearchDocument, 'id'>>): Promise<{
		successful: number;
		failed: number;
		errors: Array<{
			document: Omit<SearchDocument, 'id'>;
			error: string;
		}>;
	}> {
		return await this.resilientClient.post<{
			successful: number;
			failed: number;
			errors: Array<{
				document: Omit<SearchDocument, 'id'>;
				error: string;
			}>;
		}>('/documents/bulk', {
			documents,
		});
	}

	// Synonym Management
	async createSynonym(
		synonym: Omit<SearchSynonym, 'id'>
	): Promise<ISearchSynonymDocument> {
		return await this.resilientClient.post<ISearchSynonymDocument>(
			'/synonyms',
			synonym
		);
	}

	async updateSynonym(
		synonymId: string,
		updates: Partial<SearchSynonym>
	): Promise<ISearchSynonymDocument> {
		return await this.resilientClient.put<ISearchSynonymDocument>(
			`/synonyms/${synonymId}`,
			updates
		);
	}

	async getSynonym(synonymId: string): Promise<ISearchSynonymDocument> {
		return await this.resilientClient.get<ISearchSynonymDocument>(
			`/synonyms/${synonymId}`
		);
	}

	async listSynonyms(filters?: {
		entityTypes?: SearchEntityType[];
		type?: string;
	}): Promise<ISearchSynonymDocument[]> {
		return await this.resilientClient.get<ISearchSynonymDocument[]>(
			'/synonyms',
			{
				params: filters,
			}
		);
	}

	async deleteSynonym(synonymId: string): Promise<void> {
		await this.resilientClient.delete(`/synonyms/${synonymId}`);
	}

	// Facet Management
	async createFacet(
		facet: Omit<SearchFacet, 'id'>
	): Promise<ISearchFacetDocument> {
		return await this.resilientClient.post<ISearchFacetDocument>(
			'/facets',
			facet
		);
	}

	async updateFacet(
		facetId: string,
		updates: Partial<SearchFacet>
	): Promise<ISearchFacetDocument> {
		return await this.resilientClient.put<ISearchFacetDocument>(
			`/facets/${facetId}`,
			updates
		);
	}

	async getFacet(facetId: string): Promise<ISearchFacetDocument> {
		return await this.resilientClient.get<ISearchFacetDocument>(
			`/facets/${facetId}`
		);
	}

	async listFacets(filters?: {
		field?: string;
		type?: string;
	}): Promise<ISearchFacetDocument[]> {
		return await this.resilientClient.get<ISearchFacetDocument[]>('/facets', {
			params: filters,
		});
	}

	async deleteFacet(facetId: string): Promise<void> {
		await this.resilientClient.delete(`/facets/${facetId}`);
	}

	// Cache Management
	async getCachedResults(
		query: string,
		options?: {
			entityTypes?: SearchEntityType[];
			maxAge?: number;
		}
	): Promise<SearchResult[] | null> {
		return await this.resilientClient.get<SearchResult[] | null>('/cache', {
			params: {
				query,
				...options,
			},
		});
	}

	async cacheResults(
		query: string,
		results: SearchResult[],
		options?: {
			ttl?: number;
			metadata?: Record<string, any>;
		}
	): Promise<ISearchCacheDocument> {
		return await this.resilientClient.post<ISearchCacheDocument>('/cache', {
			query,
			results,
			...options,
		});
	}

	async invalidateCache(
		query?: string,
		options?: {
			entityTypes?: SearchEntityType[];
			olderThan?: Date;
		}
	): Promise<void> {
		await this.resilientClient.post('/cache/invalidate', {
			query,
			...options,
			olderThan: options?.olderThan?.toISOString(),
		});
	}

	// Analytics
	async trackSearchQuery(
		query: SearchQuery,
		results: {
			total: number;
			returned: number;
			latency: number;
			ids: string[];
		}
	): Promise<ISearchQueryDocument> {
		return await this.resilientClient.post<ISearchQueryDocument>(
			'/analytics/track',
			{
				query,
				results,
			}
		);
	}

	async getSearchAnalytics(
		startDate: Date,
		endDate: Date,
		filters?: {
			entityTypes?: SearchEntityType[];
			userId?: string;
		}
	): Promise<ISearchAnalyticsDocument> {
		return await this.resilientClient.get<ISearchAnalyticsDocument>(
			'/analytics',
			{
				params: {
					startDate: startDate.toISOString(),
					endDate: endDate.toISOString(),
					...filters,
				},
			}
		);
	}

	async getPopularQueries(options?: {
		limit?: number;
		minCount?: number;
		entityTypes?: SearchEntityType[];
	}): Promise<
		Array<{
			query: string;
			count: number;
			successRate: number;
		}>
	> {
		return await this.resilientClient.get<
			Array<{
				query: string;
				count: number;
				successRate: number;
			}>
		>('/analytics/popular', {
			params: options,
		});
	}

	async getSearchPerformance(options?: {
		period?: 'hour' | 'day' | 'week';
		entityTypes?: SearchEntityType[];
	}): Promise<{
		latency: {
			avg: number;
			p95: number;
			p99: number;
		};
		success: {
			rate: number;
			noResults: number;
		};
		cache: {
			hitRate: number;
			size: number;
		};
	}> {
		return await this.resilientClient.get<{
			latency: {
				avg: number;
				p95: number;
				p99: number;
			};
			success: {
				rate: number;
				noResults: number;
			};
			cache: {
				hitRate: number;
				size: number;
			};
		}>('/analytics/performance', {
			params: options,
		});
	}

	// Maintenance
	async reindexAll(options?: {
		entityTypes?: SearchEntityType[];
		batchSize?: number;
		refresh?: boolean;
	}): Promise<{
		total: number;
		successful: number;
		failed: number;
		duration: number;
	}> {
		return await this.resilientClient.post<{
			total: number;
			successful: number;
			failed: number;
			duration: number;
		}>('/maintenance/reindex', options);
	}

	async optimizeIndices(options?: {
		entityTypes?: SearchEntityType[];
		maxSegments?: number;
	}): Promise<{
		successful: string[];
		failed: Array<{
			index: string;
			error: string;
		}>;
	}> {
		return await this.resilientClient.post<{
			successful: string[];
			failed: Array<{
				index: string;
				error: string;
			}>;
		}>('/maintenance/optimize', options);
	}

	// Error Handling
	async handleSearchError(
		error: Error,
		context: {
			operation: string;
			query?: string;
			indexId?: string;
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
		return await this.resilientClient.post<{
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
	}
}
