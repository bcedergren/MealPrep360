import { NextResponse } from 'next/server';

export class AppError extends Error {
	constructor(
		public message: string,
		public statusCode: number = 500,
		public code?: string
	) {
		super(message);
		this.name = 'AppError';
	}
}

export function handleError(error: unknown) {
	console.error('Error:', error);

	if (error instanceof AppError) {
		return NextResponse.json(
			{
				error: error.message,
				code: error.code,
			},
			{ status: error.statusCode }
		);
	}

	if (error instanceof Error) {
		return NextResponse.json(
			{
				error: error.message,
				code: 'INTERNAL_SERVER_ERROR',
			},
			{ status: 500 }
		);
	}

	return NextResponse.json(
		{
			error: 'An unexpected error occurred',
			code: 'INTERNAL_SERVER_ERROR',
		},
		{ status: 500 }
	);
}

// Common error types
export const Errors = {
	NotFound: (message: string = 'Resource not found') =>
		new AppError(message, 404, 'NOT_FOUND'),
	Unauthorized: (message: string = 'Unauthorized') =>
		new AppError(message, 401, 'UNAUTHORIZED'),
	Forbidden: (message: string = 'Forbidden') =>
		new AppError(message, 403, 'FORBIDDEN'),
	BadRequest: (message: string = 'Bad request') =>
		new AppError(message, 400, 'BAD_REQUEST'),
	ValidationError: (message: string = 'Validation failed') =>
		new AppError(message, 400, 'VALIDATION_ERROR'),
};
