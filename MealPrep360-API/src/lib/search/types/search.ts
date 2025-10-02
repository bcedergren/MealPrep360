import { Document } from 'mongoose';
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
	SearchOperator,
	SearchSortOrder,
	SearchBoostFactor,
} from './index';

export interface ISearchQueryDocument extends Document {
	userId?: string;
	sessionId: string;
	timestamp: Date;
	query: string;
	entityTypes?: SearchEntityType[];
	filters?: Array<{
		field: string;
		operator: SearchOperator;
		value: any;
	}>;
	results: {
		total: number;
		returned: number;
		latency: number;
		ids: string[];
	};
	analytics: {
		hasResults: boolean;
		clickedResults?: string[];
		refinedQuery?: string;
		suggestionsShown?: boolean;
		suggestionsClicked?: boolean;
	};
}

export interface ISearchIndexDocument extends Document, SearchIndex {
	status: {
		health: 'green' | 'yellow' | 'red';
		available: boolean;
		lastCheck: Date;
		issues?: Array<{
			type: string;
			message: string;
			timestamp: Date;
		}>;
	};
	mappings: {
		dynamic: boolean;
		properties: Record<
			string,
			{
				type: string;
				analyzer?: string;
				fields?: Record<string, any>;
			}
		>;
	};
	aliases?: string[];
	maintenance: {
		lastOptimized?: Date;
		lastBackup?: Date;
		scheduledTasks?: Array<{
			type: string;
			schedule: string;
			lastRun?: Date;
		}>;
	};
}

export interface ISearchDocumentDocument extends Document, SearchDocument {
	indexing: {
		status: 'pending' | 'indexed' | 'failed';
		timestamp?: Date;
		error?: string;
		retries: number;
	};
	versions: Array<{
		content: Record<string, any>;
		timestamp: Date;
		userId?: string;
	}>;
	relations?: Array<{
		type: string;
		targetId: string;
		metadata?: Record<string, any>;
	}>;
}

export interface ISearchAnalyticsDocument extends Document, SearchAnalytics {
	segmentation: {
		byUserType: Record<
			string,
			{
				searches: number;
				conversions: number;
			}
		>;
		byDeviceType: Record<
			string,
			{
				searches: number;
				latency: number;
			}
		>;
		byTimeOfDay: Array<{
			hour: number;
			searches: number;
			successRate: number;
		}>;
	};
	trends: {
		daily: Array<{
			date: string;
			searches: number;
			uniqueUsers: number;
		}>;
		weekly: Array<{
			week: string;
			searches: number;
			uniqueUsers: number;
		}>;
	};
	optimization: {
		suggestions: Array<{
			type: string;
			description: string;
			impact: 'low' | 'medium' | 'high';
			metadata?: any;
		}>;
		experiments?: Array<{
			id: string;
			description: string;
			status: string;
			results?: any;
		}>;
	};
}

export interface ISearchSynonymDocument extends Document, SearchSynonym {
	usage: {
		applications: number;
		lastUsed?: Date;
		effectiveness?: number;
	};
	validation: {
		status: 'active' | 'pending' | 'rejected';
		reviews?: Array<{
			userId: string;
			decision: string;
			comment?: string;
			timestamp: Date;
		}>;
	};
	sources?: Array<{
		type: string;
		reference: string;
		confidence: number;
	}>;
}

export interface ISearchFacetDocument extends Document, SearchFacet {
	configuration: {
		displayType?: 'list' | 'range' | 'cloud';
		sortOrder?: 'alphabetical' | 'count' | 'custom';
		customOrder?: string[];
	};
	analytics: {
		usageCount: number;
		popularValues: Array<{
			value: any;
			count: number;
		}>;
		effectiveness?: number;
	};
	localization?: Record<
		string,
		{
			name: string;
			valueLabels?: Record<string, string>;
		}
	>;
}

export interface ISearchCacheDocument extends Document, SearchCache {
	status: {
		valid: boolean;
		invalidatedAt?: Date;
		reason?: string;
	};
	usage: {
		hits: number;
		lastHit?: Date;
		uniqueUsers: number;
	};
	storage: {
		size: number;
		compressed: boolean;
		format: string;
	};
}
