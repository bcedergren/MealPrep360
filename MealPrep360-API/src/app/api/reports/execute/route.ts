import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { IReportingService } from '@/lib/reporting/interfaces/IReportingService';
import { ReportStatus } from '@/lib/reporting/types';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';

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

		const { reportId, parameters, options } = await request.json();

		if (!reportId) {
			throw new Error('Report ID is required');
		}

		const service = await getReportingService();
		const execution = await service.executeReport(reportId, {
			...(parameters || {}),
			...(options || {}),
		});

		return NextResponse.json(execution);
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
		const reportId = searchParams.get('reportId');
		const status = searchParams.get('status');
		const startDate = searchParams.get('startDate');
		const endDate = searchParams.get('endDate');

		const service = await getReportingService();
		const executions = await service.listExecutions({
			reportId: reportId || undefined,
			status: (status as ReportStatus) || undefined,
			startDate: startDate ? new Date(startDate) : undefined,
			endDate: endDate ? new Date(endDate) : undefined,
		});

		return NextResponse.json(executions);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
