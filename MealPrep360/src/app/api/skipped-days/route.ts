import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';


// GET /api/skipped-days - Get skipped days for a date range
export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const startDate = searchParams.get('startDate');
		const endDate = searchParams.get('endDate');

		if (!startDate || !endDate) {
			return NextResponse.json(
				{ error: 'startDate and endDate are required' },
				{ status: 400 }
			);
		}

		// Return empty array for now - no skipped days
		// In a real implementation, you would fetch from your database
		return NextResponse.json([]);
	} catch (error) {
		console.error('Error fetching skipped days:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// POST /api/skipped-days - Add a skipped day
export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { date } = body;

		if (!date) {
			return NextResponse.json({ error: 'date is required' }, { status: 400 });
		}

		// In a real implementation, you would save to your database
		console.log('Adding skipped day:', { userId, date });

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error adding skipped day:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// DELETE /api/skipped-days - Remove a skipped day
export async function DELETE(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const date = searchParams.get('date');

		if (!date) {
			return NextResponse.json({ error: 'date is required' }, { status: 400 });
		}

		// In a real implementation, you would remove from your database
		console.log('Removing skipped day:', { userId, date });

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error removing skipped day:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
