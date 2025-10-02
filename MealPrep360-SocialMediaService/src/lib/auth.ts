import { auth as clerkAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export interface AuthResponse {
	userId: string;
	isAuthenticated: boolean;
}

export async function getAuth(): Promise<AuthResponse> {
	const { userId } = await clerkAuth();
	return {
		userId: userId || '',
		isAuthenticated: !!userId,
	};
}

export function requireAuth(): Promise<string> {
	return new Promise(async (resolve, reject) => {
		const { userId, isAuthenticated } = await getAuth();
		if (!isAuthenticated) {
			reject(new Error('Unauthorized'));
		}
		resolve(userId);
	});
}

export function handleAuthError(error: unknown) {
	console.error('Authentication error:', error);
	return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
}
