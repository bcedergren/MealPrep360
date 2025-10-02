import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { IAnalyticsService } from '@/lib/analytics/interfaces/IAnalyticsService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';
import { AnalyticsReportValidator } from '@/lib/analytics/validation/AnalyticsValidator';

const reportValidator = new AnalyticsReportValidator();
let analyticsService: IAnalyticsService;

async function getAnalyticsService(): Promise<IAnalyticsService> {
	if (!analyticsService) {
		const container = await Container.getInstance();
		analyticsService =
			container.getService<IAnalyticsService>('analyticsService');
	}
	return analyticsService;
}

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const validationResult = await reportValidator.validate(request);
		const service = await getAnalyticsService();
		const report = await service.createReport({
			...validationResult.data,
			status: 'pending',
			format: 'json',
			query: {
				metrics: validationResult.data.metrics,
				dimensions: validationResult.data.dimensions,
				filters: validationResult.data.filters,
			},
			metadata: {
				createdAt: new Date(),
				updatedAt: new Date(),
				createdBy: userId,
				version: '1.0.0',
			},
		});

		return NextResponse.json(report);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}

export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const { searchParams } = new URL(request.url);
		const type = searchParams.get('type');
		const status = searchParams.get('status') as any;

		const service = await getAnalyticsService();
		const reports = await service.listReports({
			userId,
			type: type || undefined,
			status: status || undefined,
		});

		return NextResponse.json(reports);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}

export async function PUT(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const { reportId, updates } = await request.json();
		if (!reportId) {
			throw new Error('Report ID is required');
		}

		const service = await getAnalyticsService();
		const report = await service.updateReport(reportId, updates);

		return NextResponse.json(report);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const { searchParams } = new URL(request.url);
		const reportId = searchParams.get('reportId');
		if (!reportId) {
			throw new Error('Report ID is required');
		}

		const service = await getAnalyticsService();
		await service.deleteReport(reportId);
		return NextResponse.json({ success: true });
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
