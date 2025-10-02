import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@clerk/nextjs/server';
import { ErrorService } from '../errors/ErrorService';
import { UnauthorizedError } from '../errors/ServiceError';
import { RequestValidator } from '../validation/RequestValidator';

export abstract class BaseRouteHandler<T, R = any> {
	protected abstract validator: RequestValidator<T>;

	protected async handleRequest(
		request: Request,
		handler: (data: T, userId: string) => Promise<R>
	): Promise<NextResponse> {
		try {
			// Check for debug mode (development only)
			const isDebugMode =
				process.env.DEBUG_MODE === 'true' &&
				process.env.NODE_ENV === 'development';

			let userId: string;

			if (isDebugMode) {
				// In debug mode, use a default user ID for testing
				userId = 'debug_user_' + Date.now();
				console.log('🔧 DEBUG MODE: Using debug user ID:', userId);
			} else {
				// Prefer forwarded user from middleware (multi-Clerk) via header
				const headerUserId = request.headers.get('x-user-id');
				if (headerUserId) {
					userId = headerUserId;
				} else {
					// Fall back to standard Clerk auth
					const authResult = await auth();
					if (!authResult.userId) {
						console.error('🚫 Authentication failed in BaseRouteHandler:', {
							authResult,
							hasUserId: !!authResult.userId,
							environment: process.env.NODE_ENV,
							debugMode: process.env.DEBUG_MODE,
							timestamp: new Date().toISOString(),
						});
						throw new UnauthorizedError();
					}
					userId = authResult.userId;
				}
			}

			const validationResult = await this.validator.validate(request);
			const result = await handler(validationResult.data, userId);

			return NextResponse.json(result);
		} catch (error) {
			return ErrorService.handle(error as Error);
		}
	}

	protected async handleAuthenticatedRequest(
		handler: (userId: string) => Promise<R>
	): Promise<NextResponse> {
		try {
			// Check for debug mode (development only)
			const isDebugMode =
				process.env.DEBUG_MODE === 'true' &&
				process.env.NODE_ENV === 'development';

			let userId: string;

			if (isDebugMode) {
				// In debug mode, use a default user ID for testing
				userId = 'debug_user_' + Date.now();
				console.log('🔧 DEBUG MODE: Using debug user ID:', userId);
			} else {
				// Prefer forwarded user from middleware (multi-Clerk) via header
				const hdrs = headers();
				const headerUserId = hdrs.get('x-user-id');
				if (headerUserId) {
					userId = headerUserId;
				} else {
					// Fall back to standard Clerk auth
					const authResult = await auth();
					if (!authResult.userId) {
						console.error('🚫 Authentication failed in BaseRouteHandler:', {
							authResult,
							hasUserId: !!authResult.userId,
							environment: process.env.NODE_ENV,
							debugMode: process.env.DEBUG_MODE,
							timestamp: new Date().toISOString(),
						});
						throw new UnauthorizedError();
					}
					userId = authResult.userId;
				}
			}

			const result = await handler(userId);
			return NextResponse.json(result);
		} catch (error) {
			return ErrorService.handle(error as Error);
		}
	}
}
