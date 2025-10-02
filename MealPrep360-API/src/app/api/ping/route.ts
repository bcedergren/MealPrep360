import { NextResponse } from 'next/server';

export async function GET() {
	return new NextResponse('pong', { status: 200 });
}

export async function POST() {
	return new NextResponse('pong', { status: 200 });
}

export const runtime = 'edge';
