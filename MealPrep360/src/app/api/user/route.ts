import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serverApiClient } from '@/lib/api-client-server';
import { API_CONFIG } from '@/lib/api-config';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
import jwt from 'jsonwebtoken';

// GET /api/user - Get user profile
export async function GET(request: NextRequest) {
	try {
		const { userId, getToken } = await auth();
		const token = await getToken();
		if (token) {
			try {
				const decoded = jwt.decode(token, { complete: true });
				if (decoded && typeof decoded === 'object') {
					const redacted = { ...decoded };
					if (
						redacted.payload &&
						typeof redacted.payload === 'object' &&
						redacted.payload !== null
					) {
						if ('sub' in redacted.payload) redacted.payload.sub = '[REDACTED]';
						if ('email' in redacted.payload)
							redacted.payload.email = '[REDACTED]';
						if ('user_id' in redacted.payload)
							redacted.payload.user_id = '[REDACTED]';
					}
				} else {
					// Handle case where decoded is not an object
				}
			} catch (err) {
				// Handle JWT decode error
			}
		}

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const response = await serverApiClient.get(API_CONFIG.endpoints.user);

		if (!response.success) {
			console.error('API error message:', response.error);
			return NextResponse.json({ error: response.error }, { status: 500 });
		}

		return NextResponse.json(response.data);
	} catch (error) {
		console.error('Error fetching user:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// POST /api/user - Update user profile
export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const response = await serverApiClient.post(
			API_CONFIG.endpoints.user,
			body
		);

		if (!response.success) {
			return NextResponse.json({ error: response.error }, { status: 500 });
		}

		return NextResponse.json(response.data);
	} catch (error) {
		console.error('Error creating user:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

export async function PUT(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const response = await serverApiClient.put(API_CONFIG.endpoints.user, body);

		if (!response.success) {
			return NextResponse.json({ error: response.error }, { status: 500 });
		}

		return NextResponse.json(response.data);
	} catch (error) {
		console.error('Error updating user:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
