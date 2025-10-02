import { NextRequest, NextResponse } from 'next/server';
import { serviceDiscovery } from '@/lib/services/discovery';
import { monitoring } from '@/lib/services/monitoring';
import { ErrorService } from '@/lib/core/errors/ErrorService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const type = searchParams.get('type') || 'health';

		switch (type) {
			case 'health':
				return NextResponse.json({
					status: 'ok',
					timestamp: new Date().toISOString(),
				});

			case 'services':
				return NextResponse.json(serviceDiscovery.listServices());

			case 'metrics':
				return NextResponse.json(monitoring.getSystemHealth());

			default:
				throw new Error(`Invalid monitoring type: ${type}`);
		}
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
