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

export interface ISearchService {
	// Search Operations
	search<T = any>(
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
	}>;

	suggest(
		query: string,
		options?: {
			entityTypes?: SearchEntityType[];
			limit?: number;
			minScore?: number;
		}
	): Promise<SearchSuggestion[]>;

	// Index Management
	createIndex(index: Omit<SearchIndex, 'id'>): Promise<ISearchIndexDocument>;
	updateIndex(
		indexId: string,
		updates: Partial<SearchIndex>
	): Promise<ISearchIndexDocument>;
	getIndex(indexId: string): Promise<ISearchIndexDocument>;
	listIndices(filters?: {
		entityType?: SearchEntityType;
		status?: string;
	}): Promise<ISearchIndexDocument[]>;
	deleteIndex(indexId: string): Promise<void>;

	// Document Management
	indexDocument(
		document: Omit<SearchDocument, 'id'>
	): Promise<ISearchDocumentDocument>;
	updateDocument(
		documentId: string,
		updates: Partial<SearchDocument>
	): Promise<ISearchDocumentDocument>;
	getDocument(documentId: string): Promise<ISearchDocumentDocument>;
	listDocuments(filters?: {
		entityType?: SearchEntityType;
		status?: string;
		indexId?: string;
	}): Promise<ISearchDocumentDocument[]>;
	deleteDocument(documentId: string): Promise<void>;
	bulkIndex(documents: Array<Omit<SearchDocument, 'id'>>): Promise<{
		successful: number;
		failed: number;
		errors: Array<{
			document: Omit<SearchDocument, 'id'>;
			error: string;
		}>;
	}>;

	// Synonym Management
	createSynonym(
		synonym: Omit<SearchSynonym, 'id'>
	): Promise<ISearchSynonymDocument>;
	updateSynonym(
		synonymId: string,
		updates: Partial<SearchSynonym>
	): Promise<ISearchSynonymDocument>;
	getSynonym(synonymId: string): Promise<ISearchSynonymDocument>;
	listSynonyms(filters?: {
		entityTypes?: SearchEntityType[];
		type?: string;
	}): Promise<ISearchSynonymDocument[]>;
	deleteSynonym(synonymId: string): Promise<void>;

	// Facet Management
	createFacet(facet: Omit<SearchFacet, 'id'>): Promise<ISearchFacetDocument>;
	updateFacet(
		facetId: string,
		updates: Partial<SearchFacet>
	): Promise<ISearchFacetDocument>;
	getFacet(facetId: string): Promise<ISearchFacetDocument>;
	listFacets(filters?: {
		field?: string;
		type?: string;
	}): Promise<ISearchFacetDocument[]>;
	deleteFacet(facetId: string): Promise<void>;

	// Cache Management
	getCachedResults(
		query: string,
		options?: {
			entityTypes?: SearchEntityType[];
			maxAge?: number;
		}
	): Promise<SearchResult[] | null>;
	cacheResults(
		query: string,
		results: SearchResult[],
		options?: {
			ttl?: number;
			metadata?: Record<string, any>;
		}
	): Promise<ISearchCacheDocument>;
	invalidateCache(
		query?: string,
		options?: {
			entityTypes?: SearchEntityType[];
			olderThan?: Date;
		}
	): Promise<void>;

	// Analytics
	trackSearchQuery(
		query: SearchQuery,
		results: {
			total: number;
			returned: number;
			latency: number;
			ids: string[];
		}
	): Promise<ISearchQueryDocument>;

	getSearchAnalytics(
		startDate: Date,
		endDate: Date,
		filters?: {
			entityTypes?: SearchEntityType[];
			userId?: string;
		}
	): Promise<ISearchAnalyticsDocument>;

	getPopularQueries(options?: {
		limit?: number;
		minCount?: number;
		entityTypes?: SearchEntityType[];
	}): Promise<
		Array<{
			query: string;
			count: number;
			successRate: number;
		}>
	>;

	getSearchPerformance(options?: {
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
	}>;

	// Maintenance
	reindexAll(options?: {
		entityTypes?: SearchEntityType[];
		batchSize?: number;
		refresh?: boolean;
	}): Promise<{
		total: number;
		successful: number;
		failed: number;
		duration: number;
	}>;

	optimizeIndices(options?: {
		entityTypes?: SearchEntityType[];
		maxSegments?: number;
	}): Promise<{
		successful: string[];
		failed: Array<{
			index: string;
			error: string;
		}>;
	}>;

	// Error Handling
	handleSearchError(
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
	}>;
}
