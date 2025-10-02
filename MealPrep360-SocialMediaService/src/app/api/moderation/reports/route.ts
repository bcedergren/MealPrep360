import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Report } from '@/models/Report';
import connectDB from '@/lib/mongodb';

interface ReportQuery {
	status?: string;
	contentType?: string;
}

// Create a new report
export async function POST(request: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { reportedContentId, contentType, reason } = body;

		if (!reportedContentId || !contentType || !reason) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			);
		}

		await connectDB();

		const report = await Report.create({
			reporterId: userId,
			reportedContentId,
			contentType,
			reason,
		});

		return NextResponse.json(report, { status: 201 });
	} catch (error) {
		console.error('Error creating report:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// Get reports (moderator only)
export async function GET(request: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// TODO: Add moderator role check
		const { searchParams } = new URL(request.url);
		const status = searchParams.get('status');
		const contentType = searchParams.get('contentType');
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '10');

		await connectDB();

		const query: ReportQuery = {};
		if (status) query.status = status;
		if (contentType) query.contentType = contentType;

		const reports = await Report.find(query)
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit);

		const total = await Report.countDocuments(query);

		return NextResponse.json({
			reports,
			pagination: {
				total,
				page,
				limit,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error('Error fetching reports:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
