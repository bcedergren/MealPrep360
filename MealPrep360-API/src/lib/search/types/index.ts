export type SearchEntityType =
	| 'recipe'
	| 'meal_plan'
	| 'ingredient'
	| 'category'
	| 'user'
	| 'article'
	| 'help_topic';

export type SearchOperator =
	| 'contains'
	| 'equals'
	| 'starts_with'
	| 'ends_with'
	| 'greater_than'
	| 'less_than'
	| 'between'
	| 'in'
	| 'not_in';

export type SearchSortOrder = 'asc' | 'desc';

export type SearchBoostFactor =
	| 'relevance'
	| 'popularity'
	| 'recency'
	| 'rating'
	| 'completion_rate';

export interface SearchQuery {
	query: string;
	entityTypes?: SearchEntityType[];
	filters?: Array<{
		field: string;
		operator: SearchOperator;
		value: any;
	}>;
	sort?: Array<{
		field: string;
		order: SearchSortOrder;
	}>;
	boost?: Array<{
		factor: SearchBoostFactor;
		weight: number;
	}>;
	pagination?: {
		page: number;
		limit: number;
	};
	options?: {
		fuzzy?: boolean;
		highlight?: boolean;
		suggest?: boolean;
		explain?: boolean;
	};
}

export interface SearchResult<T = any> {
	id: string;
	entityType: SearchEntityType;
	score: number;
	data: T;
	highlights?: Array<{
		field: string;
		snippet: string;
	}>;
	explanation?: {
		description: string;
		value: number;
		details: any[];
	};
}

export interface SearchSuggestion {
	id: string;
	type: 'term' | 'phrase' | 'entity';
	text: string;
	score: number;
	metadata?: {
		entityType?: SearchEntityType;
		frequency?: number;
		[key: string]: any;
	};
}

export interface SearchIndex {
	name: string;
	entityType: SearchEntityType;
	fields: Array<{
		name: string;
		type: 'text' | 'keyword' | 'number' | 'date' | 'boolean' | 'geo';
		searchable: boolean;
		filterable: boolean;
		sortable: boolean;
		boost?: number;
		analyzer?: string;
	}>;
	settings?: {
		shards?: number;
		replicas?: number;
		refreshInterval?: string;
	};
	metadata?: {
		version?: string;
		lastUpdated?: Date;
		documentCount?: number;
		[key: string]: any;
	};
}

export interface SearchDocument {
	entityType: SearchEntityType;
	content: Record<string, any>;
	metadata?: {
		version?: string;
		lastUpdated?: Date;
		status?: 'active' | 'archived' | 'deleted';
		[key: string]: any;
	};
}

export interface SearchAnalytics {
	period: {
		start: Date;
		end: Date;
	};
	overview: {
		totalSearches: number;
		uniqueUsers: number;
		averageResults: number;
		noResultsRate: number;
	};
	topQueries: Array<{
		query: string;
		count: number;
		uniqueUsers: number;
		averageResults: number;
		clickThroughRate: number;
	}>;
	queryPatterns: Array<{
		pattern: string;
		examples: string[];
		frequency: number;
		successRate: number;
	}>;
	performance: {
		averageLatency: number;
		p95Latency: number;
		errorRate: number;
		cacheHitRate: number;
	};
	engagement: {
		clickThroughRate: number;
		averageClickPosition: number;
		refinementRate: number;
		abandonmentRate: number;
	};
}

export interface SearchSynonym {
	terms: string[];
	type: 'one_way' | 'two_way';
	entityTypes?: SearchEntityType[];
	metadata?: {
		source?: string;
		confidence?: number;
		[key: string]: any;
	};
}

export interface SearchFacet {
	field: string;
	type: 'terms' | 'range' | 'date_range';
	name: string;
	values: Array<{
		value: any;
		count: number;
		selected?: boolean;
	}>;
	metadata?: {
		order?: 'count' | 'value';
		minDocCount?: number;
		[key: string]: any;
	};
}

export interface SearchCache {
	query: string;
	entityTypes: SearchEntityType[];
	filters?: any[];
	results: SearchResult[];
	metadata: {
		timestamp: Date;
		expiresAt: Date;
		hitCount: number;
	};
}
