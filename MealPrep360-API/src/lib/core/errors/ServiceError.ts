export class ServiceError extends Error {
	constructor(
		message: string,
		public readonly statusCode: number = 500,
		public readonly errorCode?: string
	) {
		super(message);
		this.name = 'ServiceError';
	}
}

export class ValidationError extends ServiceError {
	constructor(message: string) {
		super(message, 400, 'VALIDATION_ERROR');
		this.name = 'ValidationError';
	}
}

export class NotFoundError extends ServiceError {
	constructor(message: string) {
		super(message, 404, 'NOT_FOUND');
		this.name = 'NotFoundError';
	}
}

export class UnauthorizedError extends ServiceError {
	constructor(message: string = 'Unauthorized') {
		super(message, 401, 'UNAUTHORIZED');
		this.name = 'UnauthorizedError';
	}
}
