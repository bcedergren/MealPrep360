import { RequestValidator } from '../../core/validation/RequestValidator';
import { Feedback, FeedbackResponse } from '../interfaces/IFeedbackService';

export class FeedbackValidator extends RequestValidator<
	Omit<Feedback, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>
> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) =>
				['bug', 'feature', 'improvement', 'other'].includes(data.type),
			message: 'Invalid feedback type',
		});

		this.addRule({
			validate: (data) => typeof data.category === 'string',
			message: 'Category is required',
		});

		this.addRule({
			validate: (data) =>
				['low', 'medium', 'high', 'critical'].includes(data.priority),
			message: 'Invalid priority level',
		});

		this.addRule({
			validate: (data) =>
				typeof data.title === 'string' && data.title.length >= 3,
			message: 'Title must be at least 3 characters long',
		});

		this.addRule({
			validate: (data) =>
				typeof data.description === 'string' && data.description.length >= 10,
			message: 'Description must be at least 10 characters long',
		});

		this.addRule({
			validate: (data) =>
				!data.attachments ||
				(Array.isArray(data.attachments) &&
					data.attachments.every(
						(a) =>
							typeof a.type === 'string' &&
							typeof a.url === 'string' &&
							typeof a.name === 'string' &&
							typeof a.size === 'number'
					)),
			message: 'Invalid attachments format',
		});

		this.addRule({
			validate: (data) =>
				!data.metadata ||
				(typeof data.metadata === 'object' && data.metadata !== null),
			message: 'Invalid metadata format',
		});

		this.addRule({
			validate: (data) =>
				!data.tags ||
				(Array.isArray(data.tags) &&
					data.tags.every((t) => typeof t === 'string')),
			message: 'Tags must be an array of strings',
		});
	}
}

export class FeedbackResponseValidator extends RequestValidator<
	Omit<FeedbackResponse, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) => typeof data.feedbackId === 'string',
			message: 'Feedback ID is required',
		});

		this.addRule({
			validate: (data) =>
				typeof data.content === 'string' && data.content.length >= 1,
			message: 'Content is required',
		});

		this.addRule({
			validate: (data) => typeof data.isInternal === 'boolean',
			message: 'Internal flag must be a boolean',
		});

		this.addRule({
			validate: (data) =>
				!data.attachments ||
				(Array.isArray(data.attachments) &&
					data.attachments.every(
						(a) =>
							typeof a.type === 'string' &&
							typeof a.url === 'string' &&
							typeof a.name === 'string' &&
							typeof a.size === 'number'
					)),
			message: 'Invalid attachments format',
		});

		this.addRule({
			validate: (data) =>
				!data.metadata ||
				(typeof data.metadata === 'object' && data.metadata !== null),
			message: 'Invalid metadata format',
		});
	}
}
