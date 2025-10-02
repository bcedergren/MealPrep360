import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serverApiClient } from '@/lib/api-client-server';
import { API_CONFIG } from '@/lib/api-config';
import jwt from 'jsonwebtoken';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';


// GET /api/ai/test - Test AI connectivity and functionality
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
					console.log(
						'Decoded JWT (redacted):',
						JSON.stringify(redacted, null, 2)
					);
				} else {
					console.log('Decoded JWT (redacted):', '[Unable to decode]');
				}
			} catch (err) {
				console.log('Error decoding JWT:', err);
			}
		} else {
			console.log('No JWT token available to decode.');
		}
		console.log(
			'API authentication code: Using Bearer token in Authorization header.'
		);

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const params = Object.fromEntries(searchParams.entries());

		// Log the full URL with query string for debugging
		const url = new URL(
			API_CONFIG.endpoints.aiTest,
			'https://api.mealprep360.com'
		);
		Object.entries(params).forEach(([key, value]) =>
			url.searchParams.append(key, value)
		);
		console.log('External API FULL URL:', url.toString());
		console.log(
			'External API endpoint:',
			API_CONFIG.endpoints.aiTest,
			'Params:',
			params
		);

		const response = await serverApiClient.get(
			API_CONFIG.endpoints.aiTest,
			params
		);

		if (!response.success) {
			console.error('API error message:', response.error);
			return NextResponse.json({ error: response.error }, { status: 500 });
		}

		return NextResponse.json(response.data);
	} catch (error) {
		console.error('Error testing AI:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// POST /api/ai/test - Test specific AI functionality
export async function POST(request: NextRequest) {
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
					console.log(
						'Decoded JWT (redacted):',
						JSON.stringify(redacted, null, 2)
					);
				} else {
					console.log('Decoded JWT (redacted):', '[Unable to decode]');
				}
			} catch (err) {
				console.log('Error decoding JWT:', err);
			}
		} else {
			console.log('No JWT token available to decode.');
		}
		console.log(
			'API authentication code: Using Bearer token in Authorization header.'
		);

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		console.log(
			'External API endpoint:',
			API_CONFIG.endpoints.aiTest,
			'Body:',
			body
		);
		const response = await serverApiClient.post(
			API_CONFIG.endpoints.aiTest,
			body
		);

		if (!response.success) {
			console.error('API error message:', response.error);
			return NextResponse.json({ error: response.error }, { status: 500 });
		}

		return NextResponse.json(response.data);
	} catch (error) {
		console.error('Error testing AI:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
