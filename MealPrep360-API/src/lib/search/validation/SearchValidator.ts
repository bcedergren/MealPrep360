import { RequestValidator } from '../../core/validation/RequestValidator';
import {
	SearchQuery,
	SearchIndex,
	SearchDocument,
	SearchSynonym,
	SearchEntityType,
	SearchOperator,
	SearchSortOrder,
	SearchBoostFactor,
} from '../types';

export class SearchQueryValidator extends RequestValidator<SearchQuery> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) =>
				typeof data.query === 'string' && data.query.length >= 2,
			message: 'Query must be at least 2 characters long',
		});

		this.addRule({
			validate: (data) => {
				if (!data.entityTypes) return true;
				return data.entityTypes.every((type) =>
					[
						'recipe',
						'meal_plan',
						'ingredient',
						'category',
						'user',
						'article',
						'help_topic',
					].includes(type)
				);
			},
			message: 'Invalid entity types',
		});

		this.addRule({
			validate: (data) => {
				if (!data.filters) return true;
				return data.filters.every(
					(f) =>
						typeof f.field === 'string' &&
						[
							'contains',
							'equals',
							'starts_with',
							'ends_with',
							'greater_than',
							'less_than',
							'between',
							'in',
							'not_in',
						].includes(f.operator)
				);
			},
			message: 'Invalid filters configuration',
		});

		this.addRule({
			validate: (data) => {
				if (!data.sort) return true;
				return data.sort.every(
					(s) =>
						typeof s.field === 'string' && ['asc', 'desc'].includes(s.order)
				);
			},
			message: 'Invalid sort configuration',
		});

		this.addRule({
			validate: (data) => {
				if (!data.boost) return true;
				return data.boost.every(
					(b) =>
						[
							'relevance',
							'popularity',
							'recency',
							'rating',
							'completion_rate',
						].includes(b.factor) &&
						typeof b.weight === 'number' &&
						b.weight >= 0 &&
						b.weight <= 1
				);
			},
			message: 'Invalid boost configuration',
		});
	}
}

export class SearchIndexValidator extends RequestValidator<
	Omit<SearchIndex, 'id'>
> {
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
				[
					'recipe',
					'meal_plan',
					'ingredient',
					'category',
					'user',
					'article',
					'help_topic',
				].includes(data.entityType),
			message: 'Invalid entity type',
		});

		this.addRule({
			validate: (data) =>
				Array.isArray(data.fields) &&
				data.fields.length > 0 &&
				data.fields.every(
					(f) =>
						typeof f.name === 'string' &&
						['text', 'keyword', 'number', 'date', 'boolean', 'geo'].includes(
							f.type
						) &&
						typeof f.searchable === 'boolean' &&
						typeof f.filterable === 'boolean' &&
						typeof f.sortable === 'boolean'
				),
			message: 'Invalid fields configuration',
		});

		this.addRule({
			validate: (data) => {
				if (!data.settings) return true;
				return (
					(!data.settings.shards || typeof data.settings.shards === 'number') &&
					(!data.settings.replicas ||
						typeof data.settings.replicas === 'number') &&
					(!data.settings.refreshInterval ||
						typeof data.settings.refreshInterval === 'string')
				);
			},
			message: 'Invalid settings configuration',
		});
	}
}

export class SearchDocumentValidator extends RequestValidator<
	Omit<SearchDocument, 'id'>
> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) =>
				[
					'recipe',
					'meal_plan',
					'ingredient',
					'category',
					'user',
					'article',
					'help_topic',
				].includes(data.entityType),
			message: 'Invalid entity type',
		});

		this.addRule({
			validate: (data) =>
				typeof data.content === 'object' &&
				data.content !== null &&
				Object.keys(data.content).length > 0,
			message: 'Content is required and must be a non-empty object',
		});

		this.addRule({
			validate: (data) => {
				if (!data.metadata) return true;
				return (
					(!data.metadata.status ||
						['active', 'archived', 'deleted'].includes(data.metadata.status)) &&
					(!data.metadata.version || typeof data.metadata.version === 'string')
				);
			},
			message: 'Invalid metadata configuration',
		});
	}
}

export class SearchSynonymValidator extends RequestValidator<
	Omit<SearchSynonym, 'id'>
> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) =>
				Array.isArray(data.terms) &&
				data.terms.length >= 2 &&
				data.terms.every((term) => typeof term === 'string' && term.length > 0),
			message: 'At least two non-empty terms are required',
		});

		this.addRule({
			validate: (data) => ['one_way', 'two_way'].includes(data.type),
			message: 'Invalid synonym type',
		});

		this.addRule({
			validate: (data) => {
				if (!data.entityTypes) return true;
				return data.entityTypes.every((type) =>
					[
						'recipe',
						'meal_plan',
						'ingredient',
						'category',
						'user',
						'article',
						'help_topic',
					].includes(type)
				);
			},
			message: 'Invalid entity types',
		});

		this.addRule({
			validate: (data) => {
				if (!data.metadata) return true;
				return (
					!data.metadata.confidence ||
					(typeof data.metadata.confidence === 'number' &&
						data.metadata.confidence >= 0 &&
						data.metadata.confidence <= 1)
				);
			},
			message: 'Invalid metadata configuration',
		});
	}
}
