import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { IReportingService } from '@/lib/reporting/interfaces/IReportingService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';

let reportingService: IReportingService;

async function getReportingService(): Promise<IReportingService> {
	if (!reportingService) {
		const container = await Container.getInstance();
		reportingService = container.getService<IReportingService>('reportingService');
	}
	return reportingService;
}

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const { reportId, parameters } = await request.json();
		if (!reportId) {
			throw new Error('Report ID is required');
		}

		const service = await getReportingService();
		const execution = await service.executeReport(
			reportId,
			parameters
		);

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
		const executionId = searchParams.get('executionId');
		if (!executionId) {
			throw new Error('Execution ID is required');
		}

		const service = await getReportingService();
		const status = await service.getExecutionStatus(executionId);

		return NextResponse.json(status);
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

		const { executionId } = await request.json();
		if (!executionId) {
			throw new Error('Execution ID is required');
		}

		const service = await getReportingService();
		const execution = await service.retryExecution(executionId);

		return NextResponse.json(execution);
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
		const executionId = searchParams.get('executionId');
		if (!executionId) {
			throw new Error('Execution ID is required');
		}

		const service = await getReportingService();
		await service.cancelExecution(executionId);
		return NextResponse.json({ success: true });
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
