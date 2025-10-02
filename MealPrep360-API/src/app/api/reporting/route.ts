import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { IReportingService } from '@/lib/reporting/interfaces/IReportingService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';
import { ReportValidator } from '@/lib/reporting/validation/ReportingValidator';

const reportValidator = new ReportValidator();
let reportingService: IReportingService;

async function getReportingService(): Promise<IReportingService> {
	if (!reportingService) {
		const container = await Container.getInstance();
		reportingService =
			container.getService<IReportingService>('reportingService');
	}
	return reportingService;
}

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const validationResult = await reportValidator.validate(request);
		const service = await getReportingService();
		const report = await service.createReport({
			...validationResult.data,
			userId,
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
		const type = searchParams.get('type') as any;
		const status = searchParams.get('status') as any;
		const startDate = searchParams.get('startDate')
			? new Date(searchParams.get('startDate')!)
			: undefined;
		const endDate = searchParams.get('endDate')
			? new Date(searchParams.get('endDate')!)
			: undefined;

		const service = await getReportingService();
		const reports = await service.listReports({
			userId,
			type,
			status,
			startDate,
			endDate,
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

		const report = await reportingService.updateReport(reportId, updates);

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

		await reportingService.deleteReport(reportId);
		return NextResponse.json({ success: true });
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
