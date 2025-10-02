import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { IShoppingListService } from '@/lib/shopping/interfaces/IShoppingListService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const container = await Container.getInstance();
		const shoppingListService = container.getService<IShoppingListService>(
			'shoppingListService'
		);

		const { searchParams } = new URL(request.url);
		const format = (searchParams.get('format') || 'pdf') as
			| 'pdf'
			| 'csv'
			| 'json';

		const buffer = await shoppingListService.exportList(
			params.id,
			userId,
			format
		);

		const contentType =
			format === 'pdf'
				? 'application/pdf'
				: format === 'csv'
					? 'text/csv'
					: 'application/json';

		const filename = `shopping-list-${params.id}.${format}`;

		return new NextResponse(buffer, {
			headers: {
				'Content-Type': contentType,
				'Content-Disposition': `attachment; filename="${filename}"`,
			},
		});
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
