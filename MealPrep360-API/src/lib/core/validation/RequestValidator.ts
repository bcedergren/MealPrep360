import { ValidationError } from '../errors/ServiceError';

export interface ValidationResult<T> {
	isValid: boolean;
	data: T;
	errors?: string[];
}

export interface ValidationRule<T> {
	validate(data: T): boolean;
	message: string;
}

export abstract class RequestValidator<T> {
	protected rules: ValidationRule<T>[] = [];

	async validate(request: Request): Promise<ValidationResult<T>> {
		let data: T;
		try {
			data = await request.json();
		} catch (error) {
			throw new ValidationError('Invalid JSON payload');
		}

		const errors: string[] = [];

		for (const rule of this.rules) {
			if (!rule.validate(data)) {
				errors.push(rule.message);
			}
		}

		if (errors.length > 0) {
			throw new ValidationError(errors.join(', '));
		}

		return {
			isValid: true,
			data,
		};
	}

	protected addRule(rule: ValidationRule<T>): void {
		this.rules.push(rule);
	}
}
