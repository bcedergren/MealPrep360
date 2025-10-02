import { RequestValidator } from '../../core/validation/RequestValidator';

export interface Locale {
	id: string;
	code: string;
	name: string;
	region: string;
	enabled: boolean;
	fallback?: string;
	translations: Record<string, string>;
	metadata?: {
		direction?: 'ltr' | 'rtl';
		dateFormat?: string;
		timeFormat?: string;
		numberFormat?: string;
		currencyFormat?: string;
		[key: string]: any;
	};
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
}

export class LocaleValidator extends RequestValidator<
	Omit<Locale, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>
> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) =>
				typeof data.code === 'string' &&
				/^[a-z]{2}(-[A-Z]{2})?$/.test(data.code),
			message: 'Invalid locale code format (e.g., en or en-US)',
		});

		this.addRule({
			validate: (data) =>
				typeof data.name === 'string' && data.name.length >= 2,
			message: 'Name must be at least 2 characters long',
		});

		this.addRule({
			validate: (data) => typeof data.region === 'string',
			message: 'Region is required',
		});

		this.addRule({
			validate: (data) => typeof data.enabled === 'boolean',
			message: 'Enabled flag must be a boolean',
		});

		this.addRule({
			validate: (data) =>
				!data.fallback ||
				(typeof data.fallback === 'string' &&
					/^[a-z]{2}(-[A-Z]{2})?$/.test(data.fallback)),
			message: 'Invalid fallback locale code format',
		});

		this.addRule({
			validate: (data) =>
				typeof data.translations === 'object' &&
				data.translations !== null &&
				Object.entries(data.translations).every(
					([key, value]) => typeof key === 'string' && typeof value === 'string'
				),
			message: 'Translations must be a valid key-value object',
		});

		this.addRule({
			validate: (data) =>
				!data.metadata ||
				(typeof data.metadata === 'object' &&
					data.metadata !== null &&
					(!data.metadata.direction ||
						['ltr', 'rtl'].includes(data.metadata.direction))),
			message: 'Invalid metadata format',
		});
	}
}

export class TranslationValidator extends RequestValidator<{
	key: string;
	value: string;
	context?: string;
	metadata?: Record<string, any>;
}> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) => typeof data.key === 'string' && data.key.length > 0,
			message: 'Translation key is required',
		});

		this.addRule({
			validate: (data) =>
				typeof data.value === 'string' && data.value.length > 0,
			message: 'Translation value is required',
		});

		this.addRule({
			validate: (data) => !data.context || typeof data.context === 'string',
			message: 'Context must be a string if provided',
		});

		this.addRule({
			validate: (data) =>
				!data.metadata ||
				(typeof data.metadata === 'object' && data.metadata !== null),
			message: 'Invalid metadata format',
		});
	}
}
