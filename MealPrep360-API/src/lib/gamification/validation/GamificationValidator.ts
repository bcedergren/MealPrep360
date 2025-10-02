import { RequestValidator } from '../../core/validation/RequestValidator';
import { Achievement } from '../interfaces/IGamificationService';

export class AchievementValidator extends RequestValidator<
	Omit<Achievement, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
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
				typeof data.description === 'string' && data.description.length >= 10,
			message: 'Description must be at least 10 characters long',
		});

		this.addRule({
			validate: (data) => typeof data.type === 'string',
			message: 'Type is required',
		});

		this.addRule({
			validate: (data) => typeof data.category === 'string',
			message: 'Category is required',
		});

		this.addRule({
			validate: (data) => typeof data.points === 'number' && data.points > 0,
			message: 'Points must be a positive number',
		});

		this.addRule({
			validate: (data) =>
				Array.isArray(data.requirements) &&
				data.requirements.length > 0 &&
				data.requirements.every(
					(r) =>
						typeof r.type === 'string' &&
						typeof r.value === 'number' &&
						typeof r.operator === 'string'
				),
			message: 'At least one valid requirement is required',
		});

		this.addRule({
			validate: (data) =>
				Array.isArray(data.rewards) &&
				data.rewards.every(
					(r) =>
						typeof r.type === 'string' &&
						r.value !== undefined &&
						(!r.metadata ||
							(typeof r.metadata === 'object' && r.metadata !== null))
				),
			message: 'Invalid rewards configuration',
		});

		this.addRule({
			validate: (data) =>
				['active', 'inactive', 'archived'].includes(data.status),
			message: 'Invalid status',
		});

		this.addRule({
			validate: (data) =>
				!data.metadata ||
				(typeof data.metadata === 'object' && data.metadata !== null),
			message: 'Invalid metadata format',
		});
	}
}

export class GamificationEventValidator extends RequestValidator<{
	type: string;
	value: number;
	metadata?: Record<string, any>;
}> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) => typeof data.type === 'string',
			message: 'Event type is required',
		});

		this.addRule({
			validate: (data) => typeof data.value === 'number' && data.value >= 0,
			message: 'Value must be a non-negative number',
		});

		this.addRule({
			validate: (data) =>
				!data.metadata ||
				(typeof data.metadata === 'object' && data.metadata !== null),
			message: 'Invalid metadata format',
		});
	}
}
