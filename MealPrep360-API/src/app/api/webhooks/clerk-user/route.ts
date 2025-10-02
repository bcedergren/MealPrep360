import { NextResponse, NextRequest } from 'next/server';
import { getOrCreateUser } from '@/lib/getOrCreateUser';

export async function POST(req: NextRequest) {
	const body = await req.json();

	// Clerk sends user.id as the Clerk user ID
	const clerkId = body.data?.id;
	if (!clerkId) {
		return NextResponse.json(
			{ error: 'Missing Clerk user ID' },
			{ status: 400 }
		);
	}

	// Call your utility to ensure user exists in your DB
	await getOrCreateUser(clerkId);

	return NextResponse.json({ success: true });
}
