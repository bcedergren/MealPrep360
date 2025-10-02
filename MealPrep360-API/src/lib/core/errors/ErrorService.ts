import { NextResponse } from 'next/server';
import {
	ServiceError,
	ValidationError,
	NotFoundError,
	UnauthorizedError,
} from './ServiceError';

export interface ErrorResponse {
	error: string;
	code?: string;
	details?: unknown;
}

export class ErrorService {
	static handle(error: Error): NextResponse<ErrorResponse> {
		console.error('Error:', error);

		if (error instanceof ServiceError) {
			return NextResponse.json(
				{
					error: error.message,
					code: error.errorCode,
				},
				{ status: error.statusCode }
			);
		}

		if (error instanceof ValidationError) {
			return NextResponse.json(
				{
					error: error.message,
					code: 'VALIDATION_ERROR',
				},
				{ status: 400 }
			);
		}

		if (error instanceof NotFoundError) {
			return NextResponse.json(
				{
					error: error.message,
					code: 'NOT_FOUND',
				},
				{ status: 404 }
			);
		}

		if (error instanceof UnauthorizedError) {
			return NextResponse.json(
				{
					error: error.message,
					code: 'UNAUTHORIZED',
				},
				{ status: 401 }
			);
		}

		// Default error handler
		return NextResponse.json(
			{
				error: 'Internal server error',
				code: 'INTERNAL_ERROR',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
