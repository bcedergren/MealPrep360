import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ensureUser } from './ensureUser';

export type AuthenticatedRequest = NextRequest & {
	userId: string;
	user: any;
};

type RouteHandler = (
	req: AuthenticatedRequest,
	params?: any
) => Promise<NextResponse> | NextResponse;

/**
 * Wrapper for API routes that require authentication.
 * Automatically checks Clerk auth and ensures user exists in database.
 *
 * Usage:
 * export const GET = withAuth(async (req) => {
 *   // req.userId and req.user are guaranteed to exist here
 *   return NextResponse.json({ userId: req.userId });
 * });
 */
export function withAuth(handler: RouteHandler) {
	return async (req: NextRequest, params?: any) => {
		try {
			// Get auth from Clerk
			const { userId } = await auth();

			if (!userId) {
				console.log('withAuth: No userId from Clerk');
				return NextResponse.json(
					{
						error: 'Unauthorized',
						message: 'Authentication required',
					},
					{ status: 401 }
				);
			}

			// Ensure user exists in database
			const user = await ensureUser();

			if (!user) {
				console.error('withAuth: Failed to ensure user in database');
				return NextResponse.json(
					{
						error: 'User setup failed',
						message: 'Could not create or find user in database',
					},
					{ status: 500 }
				);
			}

			// Add userId and user to request
			(req as any).userId = userId;
			(req as any).user = user;

			// Call the actual handler
			return handler(req as AuthenticatedRequest, params);
		} catch (error) {
			console.error('withAuth error:', error);
			return NextResponse.json(
				{
					error: 'Internal server error',
					message: error instanceof Error ? error.message : 'Unknown error',
				},
				{ status: 500 }
			);
		}
	};
}

/**
 * Wrapper for API routes that optionally use authentication.
 * If authenticated, ensures user exists in database.
 * If not authenticated, still calls the handler.
 *
 * Usage:
 * export const GET = withOptionalAuth(async (req) => {
 *   if (req.userId) {
 *     // User is authenticated
 *   } else {
 *     // User is not authenticated
 *   }
 * });
 */
export function withOptionalAuth(handler: RouteHandler) {
	return async (req: NextRequest, params?: any) => {
		try {
			// Get auth from Clerk
			const { userId } = await auth();

			if (userId) {
				// User is authenticated, ensure they exist in database
				const user = await ensureUser();

				if (user) {
					(req as any).userId = userId;
					(req as any).user = user;
				} else {
					console.warn(
						'withOptionalAuth: User authenticated but not in database'
					);
				}
			}

			// Call the handler regardless of auth status
			return handler(req as AuthenticatedRequest, params);
		} catch (error) {
			console.error('withOptionalAuth error:', error);
			return NextResponse.json(
				{
					error: 'Internal server error',
					message: error instanceof Error ? error.message : 'Unknown error',
				},
				{ status: 500 }
			);
		}
	};
}
