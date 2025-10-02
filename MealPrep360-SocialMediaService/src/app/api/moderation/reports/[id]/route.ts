import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Report } from '@/models/Report';
import connectDB from '@/lib/mongodb';
import type { NextRequest } from 'next/server';

// Helper function to check if user is a moderator
async function isModerator(userId: string): Promise<boolean> {
	// TODO: Implement proper moderator check
	// For now, check against a list of moderator IDs
	const moderatorIds = ['mod1', 'mod2']; // Replace with actual moderator IDs
	return moderatorIds.includes(userId);
}

// Update report status
export async function PATCH(
	request: Request,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if user is a moderator
		if (!(await isModerator(userId))) {
			return NextResponse.json(
				{ error: 'Not authorized to update reports' },
				{ status: 403 }
			);
		}

		const body = await request.json();
		const { status } = body;

		if (!status) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			);
		}

		await connectDB();

		const params = await context.params;
		const report = await Report.findById(params.id);
		if (!report) {
			return NextResponse.json({ error: 'Report not found' }, { status: 404 });
		}

		report.status = status;
		await report.save();

		return NextResponse.json(report);
	} catch (error) {
		console.error('Error updating report:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// Get report details
export async function GET(
	request: Request,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if user is a moderator
		if (!(await isModerator(userId))) {
			return NextResponse.json(
				{ error: 'Not authorized to view reports' },
				{ status: 403 }
			);
		}

		await connectDB();

		const params = await context.params;
		const report = await Report.findById(params.id);
		if (!report) {
			return NextResponse.json({ error: 'Report not found' }, { status: 404 });
		}

		return NextResponse.json(report);
	} catch (error) {
		console.error('Error fetching report:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
