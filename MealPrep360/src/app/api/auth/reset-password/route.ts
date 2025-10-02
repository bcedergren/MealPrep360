import { NextRequest, NextResponse } from 'next/server';
import { serverApiClient } from '@/lib/api-client-server';

// POST /api/auth/reset-password - Reset password
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const response = await serverApiClient.post(
			'/api/auth/reset-password',
			body
		);

		if (!response.success) {
			return NextResponse.json({ error: response.error }, { status: 500 });
		}

		return NextResponse.json(response.data);
	} catch (error) {
		console.error('Error resetting password:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
