import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { IReportingService } from '@/lib/reporting/interfaces/IReportingService';
import { ReportStatus, ReportType } from '@/lib/reporting/types';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';
import { ReportDefinitionValidator } from '@/lib/reporting/validation/ReportingValidator';

const reportValidator = new ReportDefinitionValidator();
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
			status: 'scheduled' as ReportStatus,
			parameters: {},
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
		const type = searchParams.get('type') as ReportType | undefined;
		const status = searchParams.get('status') as ReportStatus | undefined;

		const service = await getReportingService();
		const reports = await service.listReports({
			userId,
			type,
			status,
		});

		return NextResponse.json(reports);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
